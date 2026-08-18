/**
 * Bootstrap Firebase project tlivery-87ad0 and copy data from wasel-47a78.
 * Does not modify C:\\Wasel.
 */
import {execFileSync, spawnSync} from 'node:child_process';
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {initializeApp, getApps} from 'firebase-admin/app';
import {getAuth} from 'firebase-admin/auth';
import {getFirestore} from 'firebase-admin/firestore';
import {getStorage} from 'firebase-admin/storage';
import {applicationDefault, cert} from 'firebase-admin/app';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE_PROJECT = 'wasel-47a78';
const TARGET_PROJECT = 'tlivery-87ad0';
const REGION = 'me-central1';
const TMP = join(ROOT, 'scripts', '.migrate-tmp');

const firebaseBin = () => {
  const local = join(ROOT, 'node_modules', '.bin', process.platform === 'win32' ? 'firebase.cmd' : 'firebase');
  return existsSync(local) ? local : 'npx';
};

function runFirebase(args, opts = {}) {
  const bin = firebaseBin();
  const fullArgs = bin.endsWith('firebase.cmd') || bin.endsWith('firebase')
    ? args
    : ['firebase-tools', ...args];
  const result = spawnSync(bin, fullArgs, {
    cwd: ROOT,
    stdio: opts.stdio ?? 'pipe',
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });
  if (result.status !== 0 && !opts.allowFail) {
    const err = result.stderr || result.stdout || `firebase ${args.join(' ')} failed`;
    throw new Error(err);
  }
  return result;
}

function parseSdkConfig(stdout) {
  const start = stdout.indexOf('{');
  const end = stdout.lastIndexOf('}');
  if (start < 0 || end < 0) {
    throw new Error(`Could not parse sdkconfig:\n${stdout}`);
  }
  return JSON.parse(stdout.slice(start, end + 1));
}

function writeMobileEnv(config) {
  const env = [
    `EXPO_PUBLIC_FIREBASE_API_KEY=${config.apiKey ?? ''}`,
    `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=${config.authDomain ?? `${TARGET_PROJECT}.firebaseapp.com`}`,
    `EXPO_PUBLIC_FIREBASE_PROJECT_ID=${config.projectId ?? TARGET_PROJECT}`,
    `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=${config.storageBucket ?? `${TARGET_PROJECT}.firebasestorage.app`}`,
    `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=${config.messagingSenderId ?? ''}`,
    `EXPO_PUBLIC_FIREBASE_APP_ID=${config.appId ?? ''}`,
    '',
  ].join('\n');
  writeFileSync(join(ROOT, 'TliveryMobile', '.env'), env);
  writeFileSync(
    join(ROOT, 'TliveryMobile', 'src', 'firebase', 'firebaseConfig.generated.json'),
    JSON.stringify(config, null, 2),
  );
}

function writeWebEnv(config) {
  const env = [
    `VITE_FIREBASE_API_KEY=${config.apiKey ?? ''}`,
    `VITE_FIREBASE_MESSAGING_SENDER_ID=${config.messagingSenderId ?? ''}`,
    `VITE_FIREBASE_APP_ID=${config.appId ?? ''}`,
    '',
  ].join('\n');
  writeFileSync(join(ROOT, 'TliveryWebPlatform', '.env'), env);
  writeFileSync(join(ROOT, 'TliveryWebPlatform', '.env.local'), env);
}

function ensureWebApp() {
  const listed = runFirebase(['apps:list', '--project', TARGET_PROJECT], {allowFail: true});
  const text = `${listed.stdout ?? ''}\n${listed.stderr ?? ''}`;
  if (!/WEB/i.test(text) && !/web/i.test(text)) {
    console.log('Creating Firebase WEB app...');
    runFirebase(['apps:create', 'WEB', 'TliveryWeb', '--project', TARGET_PROJECT], {stdio: 'inherit'});
  }
  const sdk = runFirebase(['apps:sdkconfig', 'WEB', '--project', TARGET_PROJECT]);
  const config = parseSdkConfig(`${sdk.stdout ?? ''}${sdk.stderr ?? ''}`);
  writeMobileEnv(config);
  writeWebEnv(config);
  console.log('Wrote Firebase web SDK config to Expo .env and Vite .env');
  return config;
}

function deployRulesAndFunctions() {
  console.log('Deploying Firestore rules, indexes, storage rules, and functions...');
  runFirebase(
    ['deploy', '--only', 'firestore:rules,firestore:indexes,storage,functions', '--project', TARGET_PROJECT],
    {stdio: 'inherit'},
  );
}

function migrateAuth() {
  mkdirSync(TMP, {recursive: true});
  const exportFile = join(TMP, 'auth-users.json');
  console.log(`Exporting Auth users from ${SOURCE_PROJECT}...`);
  runFirebase(
    ['auth:export', exportFile, '--project', SOURCE_PROJECT, '--format', 'json'],
    {stdio: 'inherit'},
  );
  if (!existsSync(exportFile)) {
    throw new Error('Auth export file was not created.');
  }
  console.log(`Importing Auth users into ${TARGET_PROJECT}...`);
  runFirebase(
    ['auth:import', exportFile, '--project', TARGET_PROJECT, '--hash-algo', 'SCRYPT'],
    {stdio: 'inherit', allowFail: true},
  );
  // firebase auth:import often reads hash config from the export file itself.
  const retry = runFirebase(
    ['auth:import', exportFile, '--project', TARGET_PROJECT],
    {stdio: 'inherit', allowFail: true},
  );
  if (retry.status !== 0) {
    console.warn('Auth import reported an error. Users may need a password reset if hashes were skipped.');
  }
}

function adminApp(projectId, name) {
  const existing = getApps().find(app => app.name === name);
  if (existing) {
    return existing;
  }
  return initializeApp(
    {
      credential: applicationDefault(),
      projectId,
      storageBucket: `${projectId}.firebasestorage.app`,
    },
    name,
  );
}

async function copyDocument(srcDb, destDb, path) {
  const snap = await srcDb.doc(path).get();
  if (!snap.exists) {
    return;
  }
  await destDb.doc(path).set(snap.data(), {merge: false});
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
  const src = adminApp(SOURCE_PROJECT, 'src');
  const dest = adminApp(TARGET_PROJECT, 'dest');
  const srcDb = getFirestore(src);
  const destDb = getFirestore(dest);
  const collections = await srcDb.listCollections();
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
  if (value && typeof value === 'object' && !(value instanceof Date) && typeof value.toDate !== 'function') {
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
  const src = adminApp(SOURCE_PROJECT, 'src');
  const dest = adminApp(TARGET_PROJECT, 'dest');
  const srcBucket = getStorage(src).bucket();
  const destBucket = getStorage(dest).bucket();
  const [files] = await srcBucket.getFiles({autoPaginate: true});
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
    console.log(`  copied gs://${file.name}`);
  }

  console.log('Rewriting Storage download URLs in Firestore...');
  const destDb = getFirestore(dest);
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
  console.log(`Tlivery Firebase bootstrap -> ${TARGET_PROJECT}`);
  console.log('Wasel project will not be modified.');

  const login = runFirebase(['login:list'], {allowFail: true});
  const loginText = `${login.stdout ?? ''}${login.stderr ?? ''}`;
  if (!/logged in|✔|@/i.test(loginText)) {
    console.log('Opening Firebase login...');
    runFirebase(['login'], {stdio: 'inherit'});
  }

  runFirebase(['use', TARGET_PROJECT], {allowFail: true, stdio: 'inherit'});
  ensureWebApp();

  try {
    deployRulesAndFunctions();
  } catch (error) {
    console.warn('Deploy skipped or failed:', error instanceof Error ? error.message : error);
    console.warn('Enable Firestore, Storage, Functions, and Authentication in the Firebase console, then re-run.');
  }

  try {
    migrateAuth();
  } catch (error) {
    console.warn('Auth migration failed:', error instanceof Error ? error.message : error);
  }

  try {
    await migrateFirestore();
    await migrateStorageAndRewriteUrls();
  } catch (error) {
    console.warn('Firestore/Storage copy needs Google Application Default Credentials.');
    console.warn(error instanceof Error ? error.message : error);
    console.warn('After `gcloud auth application-default login`, run: node scripts/bootstrap-firebase.mjs');
  }

  console.log('Done. Next: cd TliveryMobile && npx expo start');
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
