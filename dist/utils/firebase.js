"use strict";
// import admin from 'firebase-admin';
// import dotenv from 'dotenv';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
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
// main path
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
if (!raw) {
    throw new Error('Missing FIREBASE_SERVICE_ACCOUNT_JSON');
}
const serviceAccount = JSON.parse(raw);
// Important: replace literal \n with real newlines
if (typeof serviceAccount.private_key === 'string') {
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
}
if (!firebase_admin_1.default.apps.length) {
    firebase_admin_1.default.initializeApp({
        credential: firebase_admin_1.default.credential.cert(serviceAccount),
    });
}
exports.default = firebase_admin_1.default;
// // test with postman
// import admin from "firebase-admin";
// import dotenv from "dotenv";
// dotenv.config();
// if (!admin.apps.length) {
//   const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
//   if (!serviceAccountJson) {
//     throw new Error("❌ FIREBASE_SERVICE_ACCOUNT_JSON is not defined in .env");
//   }
//   const serviceAccount = JSON.parse(serviceAccountJson);
//   admin.initializeApp({
//     credential: admin.credential.cert({
//       projectId: serviceAccount.project_id,
//       clientEmail: serviceAccount.client_email,
//       privateKey: serviceAccount.private_key.replace(/\\n/g, "\n"),
//     }),
//   });
//   console.log("✅ Firebase Admin initialized successfully");
// }
// export default admin;
