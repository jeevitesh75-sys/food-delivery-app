const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

exports.sendNotification =
functions.https.onRequest(
    async (req, res) => {
      try {
        await admin.messaging().send({
          token: req.body.token,
          notification: {
            title: req.body.title,
            body: req.body.body,
          },
        });

        res.send("sent");
      } catch (e) {
        console.log(e);

        res.status(500).send(
            e.message,
        );
      }
    },
);
