import {createHash, randomInt} from "crypto";
import {FieldValue, Timestamp} from "firebase-admin/firestore";
import {onCall, HttpsError} from "firebase-functions/v2/https";
import {defineString} from "firebase-functions/params";
import {auth, db} from "../shared/admin";
import {actor} from "../shared/auth";
import {run} from "../shared/run";
import type {Request} from "../shared/types";
import {
  InputError,
  normalizedPhone,
  objectInput,
  optionalString,
  requiredString,
} from "../helpers";
import {
  isPublicLocationFilled,
  parsePublicLocation,
  type PublicOrderLocation,
} from "../jordanLocations";

const OTP_TTL_MS = 5 * 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;
const OTP_RESEND_COOLDOWN_MS = 45 * 1000;

/** Optional WhatsApp Cloud API credentials (Meta). Empty = debug OTP in-app. */
const whatsappToken = defineString("WHATSAPP_TOKEN", {default: ""});
const whatsappPhoneNumberId = defineString("WHATSAPP_PHONE_NUMBER_ID", {
  default: "",
});
const whatsappOtpTemplate = defineString("WHATSAPP_OTP_TEMPLATE", {
  default: "",
});
const whatsappOtpTemplateLang = defineString("WHATSAPP_OTP_TEMPLATE_LANG", {
  default: "ar",
});

type IssuedRole = "client" | "merchant";

function hashOtp(code: string, phoneE164: string, uid: string): string {
  return createHash("sha256")
    .update(`${uid}:${phoneE164}:${code}`)
    .digest("hex");
}

function normalizeE164Phone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 15) {
    throw new InputError("phoneNumber", "Invalid phone number.");
  }
  return `+${digits}`;
}

async function requireIssuedAccount(
  request: Request,
): Promise<{uid: string; role: IssuedRole; companyId: string}> {
  const current = actor(request);
  const snap = await db.doc(`users/${current.uid}`).get();
  if (!snap.exists) {
    throw new HttpsError("not-found", "User profile not found.");
  }
  const role = snap.get("role");
  const status = snap.get("status");
  const companyId = snap.get("companyId");
  if (status !== "active") {
    throw new HttpsError("permission-denied", "Account is not active.");
  }
  if (role !== "client" && role !== "merchant") {
    throw new HttpsError(
      "permission-denied",
      "Only clients and merchants can complete this profile.",
    );
  }
  if (typeof companyId !== "string" || !companyId) {
    throw new HttpsError("failed-precondition", "Company is required.");
  }
  return {uid: current.uid, role, companyId};
}

async function sendWhatsAppOtp(
  phoneE164: string,
  code: string,
): Promise<"whatsapp" | "debug"> {
  const token =
    whatsappToken.value().trim() || process.env.WHATSAPP_TOKEN?.trim() || "";
  const phoneNumberId =
    whatsappPhoneNumberId.value().trim() ||
    process.env.WHATSAPP_PHONE_NUMBER_ID?.trim() ||
    "";
  const template =
    whatsappOtpTemplate.value().trim() ||
    process.env.WHATSAPP_OTP_TEMPLATE?.trim() ||
    "";
  const templateLang =
    whatsappOtpTemplateLang.value().trim() ||
    process.env.WHATSAPP_OTP_TEMPLATE_LANG?.trim() ||
    "ar";
  const to = phoneE164.replace(/^\+/, "");

  if (!token || !phoneNumberId) {
    console.warn(
      "[otp] WhatsApp credentials missing; using debug delivery mode.",
    );
    return "debug";
  }

  const body = template
    ? {
        messaging_product: "whatsapp",
        to,
        type: "template",
        template: {
          name: template,
          language: {code: templateLang},
          components: [
            {
              type: "body",
              parameters: [{type: "text", text: code}],
            },
            {
              type: "button",
              sub_type: "url",
              index: "0",
              parameters: [{type: "text", text: code}],
            },
          ],
        },
      }
    : {
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: {
          body: `رمز التحقق في واصل: ${code}\nصالح لمدة 5 دقائق.`,
        },
      };

  try {
    const response = await fetch(
      `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      },
    );

    if (!response.ok) {
      const detail = await response.text();
      console.error("[otp] WhatsApp send failed", response.status, detail);
      return "debug";
    }

    return "whatsapp";
  } catch (error) {
    console.error("[otp] WhatsApp send threw", error);
    return "debug";
  }
}

const profileCallableOptions = {
  enforceAppCheck: false,
  cors: true,
} as const;

export const requestProfilePhoneOtp = onCall(profileCallableOptions, (request) =>
  run(async () => {
    const account = await requireIssuedAccount(request);
    const input = objectInput(request.data);
    const phoneRaw =
      optionalString(input, "phoneNumber", 20) ??
      optionalString(input, "phone", 20);
    if (!phoneRaw) {
      throw new InputError("phoneNumber", "phoneNumber is required.");
    }
    let phoneE164: string;
    try {
      phoneE164 = normalizedPhone(phoneRaw);
    } catch {
      phoneE164 = normalizeE164Phone(phoneRaw);
      // Prefer strict E.164 once digits are normalized.
      phoneE164 = normalizedPhone(phoneE164);
    }

    const otpRef = db.doc(`phoneOtps/${account.uid}`);
    const existing = await otpRef.get();
    if (existing.exists) {
      const lastSentAt = existing.get("sentAt");
      if (lastSentAt instanceof Timestamp) {
        const elapsed = Date.now() - lastSentAt.toMillis();
        if (elapsed < OTP_RESEND_COOLDOWN_MS) {
          throw new HttpsError(
            "resource-exhausted",
            "Please wait before requesting another code.",
            {
              retryAfterMs: OTP_RESEND_COOLDOWN_MS - elapsed,
            },
          );
        }
      }
    }

    const code = String(randomInt(100000, 999999));
    const delivery = await sendWhatsAppOtp(phoneE164, code);
    const expiresAt = Timestamp.fromMillis(Date.now() + OTP_TTL_MS);

    await otpRef.set({
      uid: account.uid,
      phoneNumber: phoneE164,
      codeHash: hashOtp(code, phoneE164, account.uid),
      attempts: 0,
      verified: false,
      sentAt: FieldValue.serverTimestamp(),
      expiresAt,
      updatedAt: FieldValue.serverTimestamp(),
    });

    console.info("[otp] issued", {
      uid: account.uid,
      phoneNumber: phoneE164,
      delivery,
    });

    return {
      ok: true,
      phoneNumber: phoneE164,
      expiresInSec: Math.floor(OTP_TTL_MS / 1000),
      delivery,
      // Always return in non-WhatsApp mode so QA can finish onboarding.
      ...(delivery === "debug" ? {debugCode: code} : {}),
    };
  }),
);

export const verifyProfilePhoneOtp = onCall(profileCallableOptions, (request) =>
  run(async () => {
    const account = await requireIssuedAccount(request);
    const input = objectInput(request.data);
    const phoneRaw =
      optionalString(input, "phoneNumber", 20) ??
      optionalString(input, "phone", 20);
    if (!phoneRaw) {
      throw new InputError("phoneNumber", "phoneNumber is required.");
    }
    const phoneE164 = normalizedPhone(
      phoneRaw.startsWith("+") ? phoneRaw : normalizeE164Phone(phoneRaw),
    );
    const code = requiredString(input, "code", 8).replace(/\s+/g, "");

    const otpRef = db.doc(`phoneOtps/${account.uid}`);
    const snap = await otpRef.get();
    if (!snap.exists) {
      throw new HttpsError("failed-precondition", "Request a code first.");
    }

    const storedPhone = snap.get("phoneNumber");
    const expiresAt = snap.get("expiresAt");
    const attempts = Number(snap.get("attempts") ?? 0);
    const codeHash = snap.get("codeHash");

    if (storedPhone !== phoneE164) {
      throw new HttpsError(
        "failed-precondition",
        "Phone number changed. Request a new code.",
      );
    }
    if (!(expiresAt instanceof Timestamp) || expiresAt.toMillis() < Date.now()) {
      throw new HttpsError("deadline-exceeded", "Verification code expired.");
    }
    if (attempts >= OTP_MAX_ATTEMPTS) {
      throw new HttpsError(
        "resource-exhausted",
        "Too many attempts. Request a new code.",
      );
    }

    const expected = hashOtp(code, phoneE164, account.uid);
    if (typeof codeHash !== "string" || expected !== codeHash) {
      await otpRef.update({
        attempts: attempts + 1,
        updatedAt: FieldValue.serverTimestamp(),
      });
      throw new HttpsError("invalid-argument", "Invalid verification code.");
    }

    await otpRef.set(
      {
        verified: true,
        verifiedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        attempts: attempts + 1,
      },
      {merge: true},
    );

    return {ok: true, phoneNumber: phoneE164, verified: true};
  }),
);

export const completeIssuedProfile = onCall(profileCallableOptions, (request) =>
  run(async () => {
    const account = await requireIssuedAccount(request);
    const input = objectInput(request.data);
    const fullName = requiredString(input, "fullName", 120);
    const phoneRaw = requiredString(input, "phoneNumber", 20);
    const phoneE164 = normalizedPhone(
      phoneRaw.startsWith("+") ? phoneRaw : normalizeE164Phone(phoneRaw),
    );
    const locationNote = optionalString(input, "locationNote", 200);
    const altPhoneRaw = optionalString(input, "altPhoneNumber", 20);
    const altPhoneNumber = altPhoneRaw
      ? normalizedPhone(
          altPhoneRaw.startsWith("+")
            ? altPhoneRaw
            : normalizeE164Phone(altPhoneRaw),
        )
      : null;

    const defaultLocation = parsePublicLocation(input.defaultLocation);
    if (!defaultLocation || !isPublicLocationFilled(defaultLocation)) {
      throw new InputError("defaultLocation", "A valid location is required.");
    }
    const location: PublicOrderLocation = {
      ...defaultLocation,
      note: locationNote ?? defaultLocation.note ?? null,
    };

    const otpSnap = await db.doc(`phoneOtps/${account.uid}`).get();
    const userSnap = await db.doc(`users/${account.uid}`).get();
    const invitePhoneTrusted =
      userSnap.get("source") === "client_invite" &&
      userSnap.get("phoneNumber") === phoneE164;
    const otpVerified =
      otpSnap.exists &&
      otpSnap.get("verified") === true &&
      otpSnap.get("phoneNumber") === phoneE164;
    if (!otpVerified && !invitePhoneTrusted) {
      throw new HttpsError(
        "failed-precondition",
        "Verify the mobile number with WhatsApp OTP first.",
      );
    }

    try {
      await auth.updateUser(account.uid, {phoneNumber: phoneE164});
    } catch (error: unknown) {
      // Phone may already be linked on Auth for another user — still save on profile.
      console.warn("[profile] auth.updateUser phone skipped", error);
    }

    await db.doc(`users/${account.uid}`).set(
      {
        fullName,
        phoneNumber: phoneE164,
        altPhoneNumber,
        defaultLocation: location,
        profileComplete: true,
        profileCompletedAt: FieldValue.serverTimestamp(),
        phoneVerifiedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      {merge: true},
    );

    await db.doc(`phoneOtps/${account.uid}`).delete().catch(() => undefined);

    return {
      ok: true,
      profileComplete: true,
      fullName,
      phoneNumber: phoneE164,
      defaultLocation: location,
    };
  }),
);
