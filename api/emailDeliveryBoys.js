import { db } from "./_firebaseAdmin.js";
import { transporter } from "./_mailer.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { restaurantName, customerAddress, total } = req.body;

  try {
    const snap = await db.collection("deliveryPartners").where("online", "==", true).get();
    const emails = snap.docs.map(d => d.data().email).filter(Boolean);

    if (emails.length === 0) return res.status(200).json({ skipped: "No online delivery boys" });

    await transporter.sendMail({
      from: `"Eluru Foods" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      bcc: emails,
      subject: "🛵 New Delivery Available!",
      text: `${restaurantName || "A restaurant"} → ${customerAddress || "Customer"}\nEarning: ₹${total}\n\nOpen the app to accept: https://www.elurufoods.shop/delivery/home.html`
    });

    res.status(200).json({ success: true, count: emails.length });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
}