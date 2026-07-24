const { db } = require("./_firebaseAdmin.js");
const { transporter } = require("./_mailer.js");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { orderId } = req.body;
  if (!orderId) return res.status(400).json({ error: "Missing orderId" });

  try {
    const orderSnap = await db.collection("orders").doc(orderId).get();
    if (!orderSnap.exists) return res.status(404).json({ error: "Order not found" });
    const order = orderSnap.data();

    const restSnap = await db.collection("restaurants").doc(order.restaurantId).get();
    const restaurant = restSnap.data();
    if (!restaurant?.email) return res.status(200).json({ skipped: "No restaurant email" });

    const itemSummary = (order.items || []).map(i => `${i.name} x${i.qty}`).join(", ");

    await transporter.sendMail({
      from: `"Eluru Foods" <${process.env.EMAIL_USER}>`,
      to: restaurant.email,
      subject: "🍔 New Order Received!",
      text: `New order from ${order.customerName}\n\nItems: ${itemSummary}\nTotal: ₹${order.total}\nAddress: ${order.customerAddress}\nPhone: ${order.customerPhone}`
    });

    res.status(200).json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
};
