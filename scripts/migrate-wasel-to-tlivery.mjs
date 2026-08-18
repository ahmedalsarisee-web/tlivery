/**
 * Copy Auth, Firestore, and Storage from Wasel (wasel-47a78) to Tlivery (tlivery-87ad0).
 * Does not modify C:\Wasel.
 */
import {createRequire} from 'node:module';
import {GoogleAuth} from 'google-auth-library';
import {initializeApp, getApps, applicationDefault} from 'firebase-admin/app';
import {getAuth} from 'firebase-admin/auth';
import {getFirestore} from 'firebase-admin/firestore';
import {getStorage} from 'firebase-admin/storage';

const require = createRequire(import.meta.url);
const {getGlobalDefaultAccount} = require('firebase-tools/lib/auth.js');
const {getCredentialPathAsync} = require('firebase-tools/lib/defaultCredentials.js');

const SOURCE_PROJECT = 'wasel-47a78';
const TARGET_PROJECT = 'tlivery-87ad0';
const SOURCE_BUCKETS = [
  `${SOURCE_PROJECT}.firebasestorage.app`,
  `${SOURCE_PROJECT}.appspot.com`,
];
const TARGET_BUCKETS = [
  `${TARGET_PROJECT}.firebasestorage.app`,
  `${TARGET_PROJECT}.appspot.com`,
];

async function setupAdc() {
  const account = getGlobalDefaultAccount();
  if (!account) {
    throw new Error('Firebase CLI is not logged in. Run: npx firebase-tools login');
  }
  const credPath = await getCredentialPathAsync(account);
  if (!credPath) {
    throw new Error('Could not write application default credentials from Firebase CLI login.');
  }
  process.env.GOOGLE_APPLICATION_CREDENTIALS = credPath;
  process.env.GOOGLE_CLOUD_PROJECT = TARGET_PROJECT;
  console.log(`Using Firebase CLI credentials for ${account.user?.email}`);
  return credPath;
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

async function enableApi(api) {
  const url = `https://serviceusage.googleapis.com/v1/projects/${TARGET_PROJECT}/services/${api}:enable`;
  const result = await googleFetch(url, {method: 'POST', body: '{}'});
  if (result.ok || result.status === 409) {
    console.log(`Enabled API ${api}`);
    return;
  }
  console.warn(`Could not enable ${api}: ${result.status}`, result.body?.error?.message ?? result.body);
}

async function enableAuthProviders() {
  await enableApi('identitytoolkit.googleapis.com');
  const init = await googleFetch(
    `https://identitytoolkit.googleapis.com/admin/v2/projects/${TARGET_PROJECT}:initializeIdentityPlatform`,
    {method: 'POST', body: '{}'},
  );
  if (!init.ok && init.status !== 409 && init.status !== 400) {
    console.warn('initializeIdentityPlatform:', init.status, init.body?.error?.message ?? init.body);
  }
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
  if (!patch.ok) {
    console.warn('Auth provider config:', patch.status, patch.body?.error?.message ?? patch.body);
  } else {
    console.log('Enabled Email/Password and Phone authentication');
  }
}

async function enableStorage() {
  await enableApi('firebasestorage.googleapis.com');
  await enableApi('storage.googleapis.com');
  const created = await googleFetch(
    `https://storage.googleapis.com/storage/v1/b?project=${TARGET_PROJECT}`,
    {
      method: 'POST',
      body: JSON.stringify({
        name: `${TARGET_PROJECT}.firebasestorage.app`,
        location: 'ME-CENTRAL1',
        iamConfiguration: {uniformBucketLevelAccess: {enabled: true}},
      }),
    },
  );
  if (created.ok || created.status === 409) {
    console.log('Storage bucket exists or was created');
  } else {
    const fallback = await googleFetch(
      `https://storage.googleapis.com/storage/v1/b?project=${TARGET_PROJECT}`,
      {
        method: 'POST',
        body: JSON.stringify({
          name: `${TARGET_PROJECT}.appspot.com`,
          location: 'US',
          iamConfiguration: {uniformBucketLevelAccess: {enabled: true}},
        }),
      },
    );
    if (!fallback.ok && fallback.status !== 409) {
      console.warn('Create bucket:', created.status, created.body?.error?.message ?? created.body);
      console.warn('Fallback bucket:', fallback.status, fallback.body?.error?.message ?? fallback.body);
    }
  }
  const addFirebase = await googleFetch(
    `https://firebasestorage.googleapis.com/v1alpha/projects/${TARGET_PROJECT}/defaultBucket`,
    {method: 'POST', body: '{}'},
  );
  if (!addFirebase.ok && addFirebase.status !== 409 && addFirebase.status !== 400) {
    console.warn('defaultBucket:', addFirebase.status, addFirebase.body?.error?.message ?? addFirebase.body);
  } else {
    console.log('Firebase Storage is ready');
  }
}

function adminApp(projectId, name, bucket) {
  const existing = getApps().find(app => app.name === name);
  if (existing) {
    return existing;
  }
  return initializeApp(
    {
      credential: applicationDefault(),
      projectId,
      storageBucket: bucket,
    },
    name,
  );
}

async function firstWorkingBucket(projectId, name, candidates) {
  for (const bucket of candidates) {
    try {
      const app = adminApp(projectId, `${name}-${bucket}`, bucket);
      const [exists] = await getStorage(app).bucket(bucket).exists();
      if (exists) {
        console.log(`Using bucket ${bucket}`);
        return {app, bucket};
      }
    } catch (error) {
      console.warn(`Bucket ${bucket} not usable:`, error instanceof Error ? error.message : error);
    }
  }
  return null;
}

async function migrateAuth() {
  console.log('Copying Authentication users...');
  const src = adminApp(SOURCE_PROJECT, 'src-auth', SOURCE_BUCKETS[0]);
  const dest = adminApp(TARGET_PROJECT, 'dest-auth', TARGET_BUCKETS[0]);
  const srcAuth = getAuth(src);
  const destAuth = getAuth(dest);
  let nextPageToken;
  let copied = 0;
  do {
    const page = await srcAuth.listUsers(1000, nextPageToken);
    for (const user of page.users) {
      try {
        await destAuth.deleteUser(user.uid).catch(() => undefined);
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
        console.log(`  user ${user.uid} ${user.email ?? user.phoneNumber ?? ''}`);
      } catch (error) {
        console.warn(`  failed ${user.uid}:`, error instanceof Error ? error.message : error);
      }
    }
    nextPageToken = page.pageToken;
  } while (nextPageToken);
  console.log(`Copied ${copied} auth users (same UIDs). Passwords are not copied; users must reset password.`);
}

async function copyCollectionRecursive(srcDb, destDb, colRef) {
  const docs = await colRef.listDocuments();
  for (const docRef of docs) {
    const snap = await docRef.get();
    if (snap.exists) {
      await destDb.doc(snap.ref.path).set(snap.data());
    }
    const subcols = await docRef.listCollections();
    for (const sub of subcols) {
      await copyCollectionRecursive(srcDb, destDb, sub);
    }
  }
}

async function migrateFirestore() {
  console.log(`Copying Firestore ${SOURCE_PROJECT} -> ${TARGET_PROJECT}...`);
  const src = adminApp(SOURCE_PROJECT, 'src-fs', SOURCE_BUCKETS[0]);
  const dest = adminApp(TARGET_PROJECT, 'dest-fs', TARGET_BUCKETS[0]);
  const srcDb = getFirestore(src);
  const destDb = getFirestore(dest);
  const collections = await srcDb.listCollections();
  if (!collections.length) {
    console.warn('No Firestore collections found on the source project.');
  }
  for (const col of collections) {
    console.log(`  collection ${col.id}`);
    await copyCollectionRecursive(srcDb, destDb, col);
  }
}

function rewriteStorageUrl(value) {
  if (typeof value !== 'string') {
    return value;
  }
  return value
    .replaceAll(`${SOURCE_PROJECT}.firebasestorage.app`, `${TARGET_PROJECT}.firebasestorage.app`)
    .replaceAll(`${SOURCE_PROJECT}.appspot.com`, `${TARGET_PROJECT}.appspot.com`);
}

function rewriteDeep(value) {
  if (Array.isArray(value)) {
    return value.map(rewriteDeep);
  }
  if (
    value &&
    typeof value === 'object' &&
    !(value instanceof Date) &&
    typeof value.toDate !== 'function'
  ) {
    const next = {};
    for (const [key, nested] of Object.entries(value)) {
      next[key] = rewriteDeep(nested);
    }
    return next;
  }
  return rewriteStorageUrl(value);
}

async function migrateStorageAndRewriteUrls() {
  console.log('Copying Cloud Storage objects...');
  const src = await firstWorkingBucket(SOURCE_PROJECT, 'src-st', SOURCE_BUCKETS);
  const dest = await firstWorkingBucket(TARGET_PROJECT, 'dest-st', TARGET_BUCKETS);
  if (!src) {
    console.warn('Source Storage bucket was not found.');
    return;
  }
  if (!dest) {
    console.warn('Target Storage bucket was not found. Enable Storage in the Firebase console, then re-run.');
    return;
  }
  const srcBucket = getStorage(src.app).bucket(src.bucket);
  const destBucket = getStorage(dest.app).bucket(dest.bucket);
  const [files] = await srcBucket.getFiles({autoPaginate: true});
  console.log(`Found ${files.length} storage objects`);
  for (const file of files) {
    const destFile = destBucket.file(file.name);
    const [buf] = await file.download();
    const [metadata] = await file.getMetadata();
    await destFile.save(buf, {
      metadata: {
        contentType: metadata.contentType,
        metadata: metadata.metadata,
        cacheControl: metadata.cacheControl,
      },
    });
    console.log(`  copied ${file.name}`);
  }

  console.log('Rewriting Storage download URLs in Firestore...');
  const destDb = getFirestore(adminApp(TARGET_PROJECT, 'dest-fs', TARGET_BUCKETS[0]));
  const collections = await destDb.listCollections();
  const rewriteCol = async colRef => {
    const docs = await colRef.listDocuments();
    for (const docRef of docs) {
      const snap = await docRef.get();
      if (snap.exists) {
        await destDb.doc(snap.ref.path).set(rewriteDeep(snap.data()), {merge: false});
      }
      const subcols = await docRef.listCollections();
      for (const sub of subcols) {
        await rewriteCol(sub);
      }
    }
  };
  for (const col of collections) {
    await rewriteCol(col);
  }
}

async function main() {
  console.log(`Copying Wasel (${SOURCE_PROJECT}) -> Tlivery (${TARGET_PROJECT})`);
  console.log('Wasel will not be modified.');
  await setupAdc();
  await enableAuthProviders();
  await enableStorage();
  await migrateAuth();
  await migrateFirestore();
  await migrateStorageAndRewriteUrls();
  console.log('Done. Open https://console.firebase.google.com/project/tlivery-87ad0/overview');
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
