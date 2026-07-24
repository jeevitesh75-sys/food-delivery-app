export default async function handler(req, res) {
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
