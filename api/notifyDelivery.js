import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

if (!getApps().length) {
  initializeApp({
    credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
  });
}

export default async function handler(req, res) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "No auth token" });

  try {
    await getAuth().verifyIdToken(authHeader.split("Bearer ")[1]);
  } catch (e) {
    return res.status(401).json({ error: "Invalid token" });
  }

  const { title, message, url } = req.body;
  const r = await fetch("https://onesignal.com/api/v1/notifications", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Basic ${process.env.ONESIGNAL_REST_KEY}`
    },
    body: JSON.stringify({
      app_id: "f6c24c6d-30ed-496e-a1ad-3b1f2e3a4a03",
      filters: [{ field: "tag", key: "role", relation: "=", value: "delivery_partner" }],
      headings: { en: title },
      contents: { en: message },
      url
    })
  });
  res.status(200).json(await r.json());
}



