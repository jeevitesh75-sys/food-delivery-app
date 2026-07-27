const { initializeApp, getApps, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getAuth } = require("firebase-admin/auth");

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
    })
  });
}

const db = getFirestore();

async function verifyAuth(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader) throw new Error("No auth token");
  const idToken = authHeader.split("Bearer ")[1];
  return await getAuth().verifyIdToken(idToken);
}

module.exports = { db, verifyAuth };
