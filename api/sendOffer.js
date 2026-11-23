// Admin only: sends an offer notification to every customer phone that has the Eluru Foods app.
//   POST { title, body }  -> sends and records it
//   GET                   -> last 15 offers sent
// The caller must send the admin's Firebase login token (Authorization: Bearer <token>).
// Only email/password accounts are accepted (customers log in with Google, so they can never use this).
// Optional: set ADMIN_EMAILS in Vercel (comma separated) to allow only those emails.
const { getMessaging } = require("firebase-admin/messaging");
const { FieldValue } = require("firebase-admin/firestore");
const { db } = require("./_firebaseAdmin.js");

const SITE = "https://www.elurufoods.shop";

// Checks the admin's Firebase login token with Google (no extra packages needed).
const WEB_API_KEY = "AIzaSyD_AhACSdb6ddlmNWU3UNKxUSBj-0pSIA8";

async function requireAdmin(req) {
  const m = (req.headers.authorization || "").match(/^Bearer (.+)$/);
  if (!m) return { error: "Please log in again." };
  let user;
  try {
    const r = await fetch("https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=" + WEB_API_KEY, {
      method: "POST",
      // the key is restricted to the website, so tell Google the call is for the website
      headers: { "Content-Type": "application/json", Referer: SITE + "/", Origin: SITE },
      body: JSON.stringify({ idToken: m[1] })
    });
    if (!r.ok) {
      let msg = "";
      try { msg = ((await r.json()).error || {}).message || ""; } catch (e) {}
      return { error: "Login could not be verified (" + r.status + (msg ? ": " + msg : "") + "). Log out and log in again." };
    }
    user = ((await r.json()).users || [])[0];
  } catch (e) { return { error: "Login check failed: " + e.message }; }
  if (!user) return { error: "Login not found. Log out and log in again." };
  // must be an email + password account (customers, restaurants and riders use Google)
  if (!(user.providerUserInfo || []).some(p => p.providerId === "password"))
    return { error: "You are signed in with Google (" + (user.email || "") + "). Tap Logout in the menu, then log in with the admin email and password." };
  const allowed = (process.env.ADMIN_EMAILS || "").split(",").map(x => x.trim().toLowerCase()).filter(Boolean);
  if (allowed.length && !allowed.includes(String(user.email || "").toLowerCase()))
    return { error: (user.email || "This account") + " is not allowed to send offers." };
  return { email: user.email || "" };
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  try {
    const admin = await requireAdmin(req);
    if (admin.error) return res.status(401).json({ error: admin.error });

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
