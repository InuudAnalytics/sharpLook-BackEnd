// src/utils/firebase.ts
import admin from 'firebase-admin';

// Ensure the Firebase app is only initialized once
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON as string);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export default admin;
