const {onDocumentCreated} = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");

admin.initializeApp();

exports.sendCheckInNotification = onDocumentCreated(
    "clicks/{checkInId}",
    async (event) => {
      const checkIn = event.data.data();

      // Get the admin FCM token from Firestore
      const tokenDoc = await admin
          .firestore()
          .collection("fcm_tokens")
          .doc("admin")
          .get();
      if (!tokenDoc.exists) {
        console.log("No admin FCM token found - " +
          "admin needs to enable notifications");
        return null;
      }
      const fcmToken = tokenDoc.data().token;

      if (!fcmToken) {
        console.log("FCM token is empty - admin needs to enable notifications");
        return null;
      }

      // Compose the notification
      const payload = {
        notification: {
          title: "Ny check-in!",
          body:
          checkIn && checkIn.name ?
            `${checkIn.name} har lige checket ind` :
            "Der er kommet en ny check-in!",
          icon: "/img/emoji-cat-192x192.png",
          click_action: "https://zebrastribe.github.io/freddy/admin.html",
        },
      };

      // Send the notification
      try {
        await admin.messaging().sendToDevice(fcmToken, payload);
        console.log("Push notification sent to admin successfully");
      } catch (error) {
        console.error("Error sending push notification:", error);
        // Don't throw - we don't want to fail the check-in process
      }

      return null;
    },
);
