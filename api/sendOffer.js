// Admin only: sends an offer notification to every customer phone that has the Eluru Foods app.
//   POST { title, body }  -> sends and records it
//   GET                   -> last 15 offers sent
// The caller must send the admin's Firebase login token (Authorization: Bearer <token>).
// Only email/password logins are accepted (customers log in with Google, so they can never use this).
// Optional: set ADMIN_EMAILS in Vercel (comma separated) to allow only those emails.
const { getAuth } = require("firebase-admin/auth");
const { getMessaging } = require("firebase-admin/messaging");
const { FieldValue } = require("firebase-admin/firestore");
const { db } = require("./_firebaseAdmin.js");

const SITE = "https://www.elurufoods.shop";

async function requireAdmin(req) {
  const h = req.headers.authorization || "";
  const m = h.match(/^Bearer (.+)$/);
  if (!m) return null;
  let t;
  try { t = await getAuth().verifyIdToken(m[1]); } catch (e) { return null; }
  if (!t.firebase || t.firebase.sign_in_provider !== "password") return null;
  const allowed = (process.env.ADMIN_EMAILS || "").split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
  if (allowed.length && !allowed.includes(String(t.email || "").toLowerCase())) return null;
  return t;
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: "Admin login required" });

  try {
    if (req.method === "GET") {
      const snap = await db.collection("offers").orderBy("sentAt", "desc").limit(15).get();
      const offers = snap.docs.map(d => {
        const o = d.data();
        return { title: o.title, body: o.body, devices: o.devices || 0, delivered: o.delivered || 0, sentAt: o.sentAt && o.sentAt.toMillis ? o.sentAt.toMillis() : null };
      });
      return res.status(200).json({ offers });
    }

    if (req.method !== "POST") return res.status(405).end();

    const title = String((req.body && req.body.title) || "").trim().slice(0, 50);
    const body = String((req.body && req.body.body) || "").trim().slice(0, 150);
    if (!title || !body) return res.status(400).json({ error: "Title and message are required" });

    // every customer phone token
    const snap = await db.collection("fcmTokens").get();
    const owners = new Map(); // token -> uid
    snap.forEach(d => (d.data().tok_customer || []).forEach(t => owners.set(t, d.id)));
    const tokens = [...owners.keys()];

    let delivered = 0;
    const dead = [];
    for (let i = 0; i < tokens.length; i += 500) {
      const chunk = tokens.slice(i, i + 500);
      const r = await getMessaging().sendEachForMulticast({
        tokens: chunk,
        data: { type: "info", title, body, url: SITE + "/home.html" },
        android: { priority: "high", ttl: 24 * 60 * 60 * 1000 }
      });
      delivered += r.successCount;
      r.responses.forEach((x, j) => {
        const c = x.error && x.error.code;
        if (c === "messaging/registration-token-not-registered" || c === "messaging/invalid-registration-token") dead.push(chunk[j]);
      });
    }

    // clean up tokens of phones that uninstalled the app
    await Promise.all(dead.map(t =>
      db.collection("fcmTokens").doc(owners.get(t)).update({ tok_customer: FieldValue.arrayRemove(t) }).catch(() => {})));

    await db.collection("offers").add({
      title, body, devices: tokens.length, delivered, sentBy: admin.email || "", sentAt: FieldValue.serverTimestamp()
    });

    return res.status(200).json({ success: true, devices: tokens.length, delivered });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
};
