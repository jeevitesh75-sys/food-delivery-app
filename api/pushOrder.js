// Sends app push alerts (FCM) for order events. Same setup as emailRestaurant.js (uses the FIREBASE_* env vars).
// The caller only sends { orderId, event }. The message text is built here from the real order,
// and each event is sent only once per order, so nobody can spam or fake alerts.
const { getMessaging } = require("firebase-admin/messaging");
const { FieldValue } = require("firebase-admin/firestore");
const { db } = require("./_firebaseAdmin.js");

const SITE = "https://www.elurufoods.shop";

// event -> status the order must be in right now
const NEEDS = { new: "Pending", accepted: "Accepted", ready: "Ready", out: "Out for Delivery", delivered: "Delivered", rejected: "Rejected" };

async function tokensFor(uids, role) {
  const out = [];
  const field = "tok_" + role;
  for (let i = 0; i < uids.length; i += 10) {
    const snaps = await Promise.all(uids.slice(i, i + 10).map(u => db.collection("fcmTokens").doc(u).get()));
    snaps.forEach(s => { if (s.exists) (s.data()[field] || []).forEach(t => out.push({ uid: s.id, token: t, field })); });
  }
  return out;
}

async function send(list, data) {
  if (!list.length) return 0;
  const tokens = [...new Set(list.map(x => x.token))];
  const res = await getMessaging().sendEachForMulticast({
    tokens,
    data,
    android: { priority: "high", ttl: 5 * 60 * 1000 }
  });
  // remove dead tokens
  const dead = new Set();
  res.responses.forEach((r, i) => {
    const c = r.error && r.error.code;
    if (c === "messaging/registration-token-not-registered" || c === "messaging/invalid-registration-token") dead.add(tokens[i]);
  });
  if (dead.size) {
    await Promise.all(list.filter(x => dead.has(x.token)).map(x =>
      db.collection("fcmTokens").doc(x.uid).update({ [x.field]: FieldValue.arrayRemove(x.token) }).catch(() => {})));
  }
  return res.successCount;
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { orderId, event } = req.body || {};
  if (!orderId || !NEEDS[event]) return res.status(400).json({ error: "Bad request" });

  try {
    const ref = db.collection("orders").doc(String(orderId));
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: "Order not found" });
    const order = snap.data();
    if (order.status !== NEEDS[event]) return res.status(200).json({ skipped: "Status does not match" });
    if (event === "accepted" && order.deliveryBoyId) return res.status(200).json({ skipped: "Already taken" });

    // send each event only once per order
    const claimed = await db.runTransaction(async (t) => {
      const cur = (await t.get(ref)).data() || {};
      if (cur["pushed_" + event]) return false;
      t.update(ref, { ["pushed_" + event]: true });
      return true;
    });
    if (!claimed) return res.status(200).json({ skipped: "Already sent" });

    const items = (order.items || []).map(i => `${i.name} x${i.qty}`).join(", ");
    const rest = order.restaurantName || "the restaurant";
    let sent = 0;

    if (event === "new") {
      const list = await tokensFor([order.restaurantId].filter(Boolean), "restaurant");
      sent = await send(list, { type: "ring", title: "🍔 NEW ORDER!", body: `₹${order.total} • ${items}`, url: `${SITE}/restaurant/Dashboard.html`, orderId });
    }

    if (event === "accepted") {
      const snapR = await db.collection("deliveryPartners").where("online", "==", true).get();
      const list = await tokensFor(snapR.docs.map(d => d.id), "delivery");
      sent = await send(list, { type: "ring", title: "🛵 NEW DELIVERY!", body: `${rest} → ${order.customerAddress || "Customer"} • Earn from ₹${order.deliveryFee || 0}`, url: `${SITE}/delivery/home.html`, orderId });
    }

    const customerMsg = {
      accepted: ["Order accepted ✅", `${rest} accepted your order and is preparing it.`],
      ready: ["Food is ready 🍽️", `Your order from ${rest} is ready.`],
      out: ["On the way 🛵", `${order.deliveryBoyName || "Your rider"} picked up your order.`],
      delivered: ["Delivered 🎉", "Your order was delivered. Enjoy your meal!"],
      rejected: ["Order not accepted ❌", `${rest} could not accept your order. Please try another restaurant.`]
    }[event];
    if (customerMsg && order.userId) {
      const list = await tokensFor([order.userId], "customer");
      sent += await send(list, { type: "info", title: customerMsg[0], body: customerMsg[1], url: `${SITE}/tracking.html`, orderId });
    }

    // restaurant also gets a quiet update when a rider takes the order
    if (event === "out" && order.restaurantId) {
      const list = await tokensFor([order.restaurantId], "restaurant");
      sent += await send(list, { type: "info", title: "Rider assigned 🛵", body: `${order.deliveryBoyName || "A rider"} is coming to pick up the order.`, url: `${SITE}/restaurant/Dashboard.html`, orderId });
    }

    res.status(200).json({ success: true, sent });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
}
