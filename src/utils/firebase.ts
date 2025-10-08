// import admin from 'firebase-admin';
// import dotenv from 'dotenv';

// dotenv.config()

// const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

// if (!raw) {
//   throw new Error('Missing FIREBASE_SERVICE_ACCOUNT_JSON environment variable');
// }

// // Re-parse and fix \n newlines in private key
// const serviceAccount = JSON.parse(raw);
// if (typeof serviceAccount.private_key === 'string') {
//   serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
// }

// if (!admin.apps.length) {
//   admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount),
//   });
// }

// export default admin;




import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

if (!raw) {
  throw new Error('Missing FIREBASE_SERVICE_ACCOUNT_JSON');
}

const serviceAccount = JSON.parse(raw);

// Important: replace literal \n with real newlines
if (typeof serviceAccount.private_key === 'string') {
  serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export default admin;
