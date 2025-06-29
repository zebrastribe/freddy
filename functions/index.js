const {onDocumentCreated} = require("firebase-functions/v2/firestore");
const {onRequest} = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

admin.initializeApp();

// Remote Config for admin password
const remoteConfig = admin.remoteConfig();

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

// Admin authentication endpoint
exports.verifyAdminPassword = onRequest(async (req, res) => {
  // Enable CORS
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }

  try {
    const {password} = req.body;

    if (!password) {
      res.status(400).json({error: "Password is required"});
      return;
    }

    // Get admin password from Remote Config
    const template = await remoteConfig.getTemplate();
    const adminPasswordParam = template.parameters && template.parameters.admin_password;
    const adminPassword = adminPasswordParam &&
      adminPasswordParam.defaultValue &&
      adminPasswordParam.defaultValue.value ||
      "AngryLion";

    if (password === adminPassword) {
      // Generate a session token
      const sessionToken = admin.auth().createCustomToken(
          "admin", {
            role: "admin",
            timestamp: Date.now(),
          },
      );

      res.json({
        success: true,
        message: "Authentication successful",
        sessionToken: await sessionToken,
      });
    } else {
      res.status(401).json({error: "Invalid password"});
    }
  } catch (error) {
    console.error("Admin authentication error:", error);
    res.status(500).json({error: "Internal server error"});
  }
});

// Get API keys endpoint (for client-side use)
exports.getApiKeys = onRequest(async (req, res) => {
  // Enable CORS
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  if (req.method !== "GET") {
    res.status(405).send("Method Not Allowed");
    return;
  }

  try {
    // Get API keys from Remote Config
    const template = await remoteConfig.getTemplate();

    const googleMapsParam = template.parameters && template.parameters.google_maps_api_key;
    const firebaseParam = template.parameters && template.parameters.firebase_api_key;
    const recaptchaParam = template.parameters && template.parameters.recaptcha_site_key;

    const apiKeys = {
      googleMaps: googleMapsParam &&
        googleMapsParam.defaultValue &&
        googleMapsParam.defaultValue.value ||
        "AIzaSyBd3xQgm7vnL2LCmxpabVT5qAhSFOteuGY",
      firebase: firebaseParam &&
        firebaseParam.defaultValue &&
        firebaseParam.defaultValue.value ||
        "AIzaSyBwLFO04OQgD6LjYdYlrEXb73THTp5H0Ss",
      recaptcha: recaptchaParam &&
        recaptchaParam.defaultValue &&
        recaptchaParam.defaultValue.value ||
        "6LdA7jIqAAAAAKYtion4hiHa7R--TT3maGb0EpNZ",
    };

    res.json(apiKeys);
  } catch (error) {
    console.error("Get API keys error:", error);
    res.status(500).json({error: "Internal server error"});
  }
});
