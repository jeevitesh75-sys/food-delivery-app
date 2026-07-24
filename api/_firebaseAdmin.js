const admin = require("firebase-admin");

console.log("DEBUG projectId:", process.env.FIREBASE_PROJECT_ID);
console.log("DEBUG clientEmail:", process.env.FIREBASE_CLIENT_EMAIL);
console.log("DEBUG privateKey exists:", !!process.env.FIREBASE_PRIVATE_KEY);
console.log("DEBUG privateKey length:", process.env.FIREBASE_PRIVATE_KEY?.length);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
    })
  });
}

const db = admin.firestore();
module.exports = { db };
