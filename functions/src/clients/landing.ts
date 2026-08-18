import {onRequest} from "firebase-functions/v2/https";
import {Timestamp} from "firebase-admin/firestore";
import {db} from "../shared/admin";
import {normalizedInviteCode} from "../helpers";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function companyName(companyId: string): Promise<string> {
  const snap = await db.doc(`companies/${companyId}`).get();
  if (!snap.exists) {
    return "واصل";
  }
  const name =
    (snap.get("name") as string | undefined) ||
    (snap.get("displayName") as string | undefined) ||
    (snap.get("companyName") as string | undefined);
  return typeof name === "string" && name.trim() ? name.trim() : "واصل";
}

function renderPage(args: {
  title: string;
  body: string;
  statusCode?: number;
}): {status: number; html: string} {
  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(args.title)}</title>
  <style>
    :root { color-scheme: light; }
    body {
      margin: 0; font-family: "Segoe UI", Tahoma, Arial, sans-serif;
      background: linear-gradient(160deg, #f7f3e8 0%, #eef2f7 100%);
      color: #1c2430; min-height: 100vh;
    }
    .wrap { max-width: 440px; margin: 0 auto; padding: 28px 18px 40px; }
    .card {
      background: #fff; border-radius: 18px; padding: 22px 18px;
      box-shadow: 0 10px 30px rgba(28,36,48,.08);
    }
    h1 { font-size: 1.35rem; margin: 0 0 8px; }
    p { margin: 0 0 14px; line-height: 1.6; color: #4b5563; }
    label { display: block; font-size: .9rem; margin: 12px 0 6px; font-weight: 600; }
    input {
      width: 100%; box-sizing: border-box; border: 1px solid #d7dde7;
      border-radius: 12px; padding: 12px 14px; font-size: 1rem;
    }
    button {
      width: 100%; margin-top: 18px; border: 0; border-radius: 12px;
      padding: 13px 16px; font-size: 1rem; font-weight: 700; cursor: pointer;
      background: #c9a227; color: #1c2430;
    }
    button:disabled { opacity: .6; cursor: default; }
    .err { color: #b42318; background: #fef3f2; border-radius: 10px; padding: 10px 12px; margin-top: 12px; display: none; }
    .ok { color: #027a48; background: #ecfdf3; border-radius: 10px; padding: 10px 12px; margin-top: 12px; display: none; }
    .hint { font-size: .85rem; color: #6b7280; margin-top: 8px; }
    a.app { display: inline-block; margin-top: 10px; color: #1d4ed8; }
  </style>
</head>
<body>
  <div class="wrap"><div class="card">${args.body}</div></div>
</body>
</html>`;
  return {status: args.statusCode ?? 200, html};
}

/**
 * Public HTTPS landing for client invites (clickable in WhatsApp).
 * Serves a registration form when the web SPA origin is not configured.
 */
export const clientInviteLanding = onRequest(
  {
    cors: true,
    invoker: "public",
    region: "me-central1",
  },
  async (req, res) => {
    const raw =
      (typeof req.query.inviteCode === "string" && req.query.inviteCode) ||
      (typeof req.query.code === "string" && req.query.code) ||
      "";
    let inviteCode = "";
    try {
      inviteCode = normalizedInviteCode(raw.replace(/[^A-Za-z0-9]/g, ""));
    } catch {
      const page = renderPage({
        title: "دعوة غير صالحة",
        statusCode: 400,
        body: `<h1>رابط الدعوة غير صالح</h1><p>تأكد من فتح الرابط كاملاً كما وصلك على واتساب.</p>`,
      });
      res.status(page.status).set("Content-Type", "text/html; charset=utf-8").send(page.html);
      return;
    }

    const configured = (
      process.env.PUBLIC_WEB_APP_ORIGIN ||
      process.env.WEB_APP_ORIGIN ||
      ""
    ).trim();
    if (configured && !/localhost|127\.0\.0\.1/i.test(configured)) {
      const target = `${configured.replace(/\/$/, "")}/invite/client/${encodeURIComponent(inviteCode)}`;
      res.redirect(302, target);
      return;
    }

    const snap = await db.doc(`clientInvites/${inviteCode}`).get();
    if (!snap.exists) {
      const page = renderPage({
        title: "دعوة غير موجودة",
        statusCode: 404,
        body: `<h1>الدعوة غير موجودة</h1><p>قد يكون الرابط قديماً أو غير صحيح.</p>`,
      });
      res.status(page.status).set("Content-Type", "text/html; charset=utf-8").send(page.html);
      return;
    }

    const status = String(snap.get("status") ?? "pending");
    const expiresAt = snap.get("expiresAt") as Timestamp | undefined;
    const expired =
      !(expiresAt instanceof Timestamp) || expiresAt.toMillis() <= Date.now();
    const available =
      (status === "pending" || status === "open") &&
      !snap.get("claimedBy") &&
      !expired;
    const company = await companyName(String(snap.get("companyId") ?? ""));
    const deepLink = `tlivery://client-invite?inviteCode=${encodeURIComponent(inviteCode)}`;
    // Callable endpoint for same project/region.
    const project =
      process.env.GCLOUD_PROJECT ||
      process.env.GCP_PROJECT ||
      "tlivery-87ad0";
    const callableUrl = `https://me-central1-${project}.cloudfunctions.net/registerClientWithInvite`;

    if (!available) {
      const page = renderPage({
        title: "الدعوة غير متاحة",
        statusCode: 410,
        body: `<h1>هذه الدعوة لم تعد متاحة</h1>
          <p>تمت دعوتك إلى <strong>${escapeHtml(company)}</strong>، لكن الرابط مستخدم مسبقاً أو منتهٍ. أول من سجّل هو المعتمد.</p>
          <p class="hint">رمز الدعوة: ${escapeHtml(inviteCode)}</p>`,
      });
      res.status(page.status).set("Content-Type", "text/html; charset=utf-8").send(page.html);
      return;
    }

    const suggestedPhone = String(
      snap.get("phoneNumber") || snap.get("phone") || "",
    ).replace(/^\+/, "");

    const body = `
      <h1>انضم إلى ${escapeHtml(company)}</h1>
      <p>أكمل بياناتك لإنشاء حساب العميل. رقم الموبايل هو المعرّف الأساسي، والدعوة لمرة واحدة فقط.</p>
      <form id="f">
        <label>اسم العميل / الشركة</label>
        <input name="fullName" required autocomplete="name" placeholder="اسم العميل أو الشركة" />
        <label>رقم الموبايل (مع رمز الدولة)</label>
        <input name="phoneNumber" required inputmode="tel" placeholder="+9627XXXXXXXX" value="${escapeHtml(suggestedPhone ? (suggestedPhone.startsWith("962") ? `+${suggestedPhone}` : suggestedPhone) : "")}" />
        <label>كلمة المرور (6 أحرف على الأقل)</label>
        <input name="password" type="password" required minlength="6" autocomplete="new-password" />
        <label>تأكيد كلمة المرور</label>
        <input name="confirm" type="password" required minlength="6" autocomplete="new-password" />
        <button type="submit" id="btn">إنشاء الحساب</button>
        <div class="err" id="err"></div>
        <div class="ok" id="ok"></div>
      </form>
      <p class="hint">رمز الدعوة: ${escapeHtml(inviteCode)}</p>
      <a class="app" href="${escapeHtml(deepLink)}">فتح الدعوة في تطبيق واصل</a>
      <script>
        const inviteCode = ${JSON.stringify(inviteCode)};
        const callableUrl = ${JSON.stringify(callableUrl)};
        const form = document.getElementById('f');
        const err = document.getElementById('err');
        const ok = document.getElementById('ok');
        const btn = document.getElementById('btn');
        form.addEventListener('submit', async (e) => {
          e.preventDefault();
          err.style.display = 'none';
          ok.style.display = 'none';
          const data = Object.fromEntries(new FormData(form).entries());
          if ((data.password || '') !== (data.confirm || '')) {
            err.textContent = 'كلمتا المرور غير متطابقتين';
            err.style.display = 'block';
            return;
          }
          let phone = String(data.phoneNumber || '').replace(/\\s+/g, '');
          if (phone && !phone.startsWith('+')) phone = '+' + phone.replace(/\\D/g, '');
          btn.disabled = true;
          btn.textContent = 'جاري إنشاء الحساب…';
          try {
            const res = await fetch(callableUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                data: {
                  inviteCode,
                  fullName: String(data.fullName || '').trim(),
                  phoneNumber: phone,
                  password: String(data.password || ''),
                }
              }),
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok || json.error) {
              const msg = (json.error && (json.error.message || json.error.status)) || 'تعذر إنشاء الحساب';
              throw new Error(msg);
            }
            ok.textContent = 'تم إنشاء الحساب بنجاح. سجّل الدخول من تطبيق واصل أو المنصة بالإيميل أو رقم الموبايل.';
            ok.style.display = 'block';
            form.querySelectorAll('input').forEach((el) => { el.disabled = true; });
            btn.textContent = 'تم التسجيل';
          } catch (error) {
            err.textContent = error && error.message ? error.message : 'تعذر إنشاء الحساب';
            err.style.display = 'block';
            btn.disabled = false;
            btn.textContent = 'إنشاء الحساب';
          }
        });
      </script>
    `;

    const page = renderPage({title: `دعوة ${company}`, body});
    res
      .status(page.status)
      .set("Cache-Control", "no-store")
      .set("Content-Type", "text/html; charset=utf-8")
      .send(page.html);
  },
);
