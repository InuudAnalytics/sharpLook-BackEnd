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
// main path & test 
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
// console.log("This is raw,",raw);
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
