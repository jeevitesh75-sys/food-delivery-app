const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
  });
}

const db = admin.firestore();

module.exports = async (req, res) => {
  try {
    const { orderId } = req.body;

    const orderDoc = await db.collection("orders").doc(orderId).get();

    if (!orderDoc.exists) {
      return res.status(404).json({ error: "Order not found" });
    }

    const order = orderDoc.data();

    // Restaurant
    const restaurantDoc = await db
      .collection("restaurants")
      .doc(order.restaurantId)
      .get();

    const restaurant = restaurantDoc.exists ? restaurantDoc.data() : {};

    // Delivery Boys
    const deliverySnap = await db.collection("deliveryboys").get();

    const emails = [];

    // Restaurant email
    if (restaurant.email) {
      emails.push(restaurant.email);
    }

    // All delivery boys
    deliverySnap.forEach((doc) => {
      const data = doc.data();
      if (data.email) emails.push(data.email);
    });

    const itemList = order.items
      .map(i => `${i.name} x${i.qty}`)
      .join("<br>");

    const body = {
      sender: {
        name: process.env.SENDER_NAME,
        email: process.env.SENDER_EMAIL
      },

      to: emails.map(email => ({ email })),

      subject: `New Order #${orderId}`,

      htmlContent: `
        <h2>🍔 New Order Received</h2>

        <p><b>Customer:</b> ${order.customerName}</p>

        <p><b>Phone:</b> ${order.customerPhone}</p>

        <p><b>Address:</b><br>${order.customerAddress}</p>

        <hr>

        <h3>Items</h3>

        ${itemList}

        <hr>

        <p><b>Total:</b> ₹${order.total}</p>

        <p><b>Payment:</b> ${order.payment}</p>
      `
    };

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "api-key": process.env.BREVO_API_KEY
      },
      body: JSON.stringify(body)
    });

    const result = await response.json();

    res.status(200).json(result);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};