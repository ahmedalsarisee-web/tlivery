/**
 * Copy Firebase Auth users from wasel-47a78 to tlivery-87ad0.
 * Preserves UIDs and custom claims so Firestore user docs stay linked.
 */
import {createRequire} from 'node:module';
import {GoogleAuth} from 'google-auth-library';
import {initializeApp, getApps, applicationDefault} from 'firebase-admin/app';
import {getAuth} from 'firebase-admin/auth';

const require = createRequire(import.meta.url);
const {getGlobalDefaultAccount} = require('firebase-tools/lib/auth.js');
const {getCredentialPathAsync} = require('firebase-tools/lib/defaultCredentials.js');

const SOURCE_PROJECT = 'wasel-47a78';
const TARGET_PROJECT = 'tlivery-87ad0';

async function setupAdc() {
  const account = getGlobalDefaultAccount();
  if (!account) {
    throw new Error('Firebase CLI is not logged in. Run: npx firebase-tools login');
  }
  const credPath = await getCredentialPathAsync(account);
  process.env.GOOGLE_APPLICATION_CREDENTIALS = credPath;
  process.env.GOOGLE_CLOUD_PROJECT = TARGET_PROJECT;
  console.log(`Using Firebase CLI credentials for ${account.user?.email}`);
}

function adminApp(projectId, name) {
  const existing = getApps().find(app => app.name === name);
  if (existing) {
    return existing;
  }
  return initializeApp({credential: applicationDefault(), projectId}, name);
}

async function accessToken() {
  const auth = new GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  if (!token.token) {
    throw new Error('Failed to obtain Google access token');
  }
  return token.token;
}

async function googleFetch(url, options = {}) {
  const token = await accessToken();
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  });
  const text = await res.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = {raw: text};
  }
  return {ok: res.ok, status: res.status, body};
}

async function enableEmailAndPhone() {
  const patch = await googleFetch(
    `https://identitytoolkit.googleapis.com/admin/v2/projects/${TARGET_PROJECT}/config?updateMask=signIn`,
    {
      method: 'PATCH',
      body: JSON.stringify({
        signIn: {
          email: {enabled: true, passwordRequired: true},
          phoneNumber: {enabled: true, testPhoneNumbers: {}},
        },
      }),
    },
  );
  if (patch.ok) {
    console.log('Email/Password and Phone providers enabled');
    return;
  }
  console.warn('Provider update:', patch.status, patch.body?.error?.message ?? '');
}

async function listAllUsers(auth) {
  const users = [];
  let nextPageToken;
  do {
    const page = await auth.listUsers(1000, nextPageToken);
    users.push(...page.users);
    nextPageToken = page.pageToken;
  } while (nextPageToken);
  return users;
}

async function main() {
  await setupAdc();
  await enableEmailAndPhone();

  const srcAuth = getAuth(adminApp(SOURCE_PROJECT, 'src-auth'));
  const destAuth = getAuth(adminApp(TARGET_PROJECT, 'dest-auth'));
  const sourceUsers = await listAllUsers(srcAuth);
  const destUsers = await listAllUsers(destAuth);

  console.log(`Source users: ${sourceUsers.length}`);
  console.log(`Target users before copy: ${destUsers.length}`);

  const destByEmail = new Map(
    destUsers.filter(user => user.email).map(user => [user.email.toLowerCase(), user]),
  );
  const destByPhone = new Map(
    destUsers.filter(user => user.phoneNumber).map(user => [user.phoneNumber, user]),
  );

  let copied = 0;
  let failed = 0;

  for (const user of sourceUsers) {
    try {
      const emailKey = user.email?.toLowerCase();
      if (emailKey) {
        const existing = destByEmail.get(emailKey);
        if (existing && existing.uid !== user.uid) {
          await destAuth.deleteUser(existing.uid);
          destByEmail.delete(emailKey);
          console.log(`  removed conflicting email account ${existing.uid}`);
        }
      }
      if (user.phoneNumber) {
        const existingPhone = destByPhone.get(user.phoneNumber);
        if (existingPhone && existingPhone.uid !== user.uid) {
          await destAuth.deleteUser(existingPhone.uid);
          destByPhone.delete(user.phoneNumber);
          console.log(`  removed conflicting phone account ${existingPhone.uid}`);
        }
      }

      try {
        await destAuth.deleteUser(user.uid);
      } catch {
        // User does not exist yet on the target.
      }

      await destAuth.createUser({
        uid: user.uid,
        email: user.email,
        emailVerified: user.emailVerified,
        displayName: user.displayName,
        photoURL: user.photoURL,
        phoneNumber: user.phoneNumber,
        disabled: user.disabled,
      });
      if (user.customClaims && Object.keys(user.customClaims).length) {
        await destAuth.setCustomUserClaims(user.uid, user.customClaims);
      }
      copied += 1;
      const role = user.customClaims?.role ?? 'none';
      console.log(`  copied ${user.uid} ${user.email ?? user.phoneNumber ?? ''} [${role}]`);
    } catch (error) {
      failed += 1;
      console.warn(
        `  failed ${user.uid}:`,
        error instanceof Error ? error.message : error,
      );
    }
  }

  console.log(`Copied ${copied} accounts. Failed: ${failed}.`);
  console.log('Passwords are not copied. Users must reset password on first login to Tlivery.');
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
