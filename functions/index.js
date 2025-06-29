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

      // Send the notification
      try {
        // Use send() for web push tokens instead of sendToDevice()
        await admin.messaging().send({
          token: fcmToken,
          notification: {
            title: "Ny check-in!",
            body:
            checkIn && checkIn.name ?
              `${checkIn.name} har lige checket ind` :
              "Der er kommet en ny check-in!",
            icon: "/freddy/img/emoji-cat-192x192.png",
          },
          webpush: {
            notification: {
              click_action: "https://zebrastribe.github.io/freddy/admin.html",
            },
          },
        });
        console.log("Push notification sent to admin successfully");
      } catch (error) {
        console.error("Error sending push notification:", error);
        // Don't throw - we don't want to fail the check-in process
      }

      return null;
    },
);

// Admin authentication endpoint
exports.verifyAdminPassword = onRequest(
    {
      cors: true,
      maxInstances: 10,
    },
    async (req, res) => {
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
          const sessionToken = await admin.auth().createCustomToken(
              "admin", {
                role: "admin",
                timestamp: Date.now(),
              },
          );

          res.json({
            success: true,
            message: "Authentication successful",
            sessionToken: sessionToken,
          });
        } else {
          res.status(401).json({error: "Invalid password"});
        }
      } catch (error) {
        console.error("Admin authentication error:", error);
        res.status(500).json({error: "Internal server error"});
      }
    },
);

// Get API keys endpoint (for client-side use)
exports.getApiKeys = onRequest(
    {
      cors: true,
      maxInstances: 10,
    },
    async (req, res) => {
      if (req.method !== "GET") {
        res.status(405).send("Method Not Allowed");
        return;
      }

      try {
        // Get API keys from Remote Config
        const template = await remoteConfig.getTemplate();

        const googleMapsParam = template.parameters && template.parameters.google_maps_api_key;
        const firebaseParam = template.parameters && template.parameters.firebase_api_key;

        const apiKeys = {
          googleMaps: googleMapsParam &&
            googleMapsParam.defaultValue &&
            googleMapsParam.defaultValue.value ||
            "AIzaSyBd3xQgm7vnL2LCmxpabVT5qAhSFOteuGY",
          firebase: firebaseParam &&
            firebaseParam.defaultValue &&
            firebaseParam.defaultValue.value ||
            "AIzaSyBwLFO04OQgD6LjYdYlrEXb73THTp5H0Ss",
          // For now, return null for reCAPTCHA to disable it until properly configured
          recaptcha: null,
        };

        res.json(apiKeys);
      } catch (error) {
        console.error("Get API keys error:", error);
        res.status(500).json({error: "Internal server error"});
      }
    },
);

// Get admin notification status endpoint
exports.getNotificationStatus = onRequest(
    {
      cors: true,
      maxInstances: 10,
    },
    async (req, res) => {
      if (req.method !== "GET") {
        res.status(405).send("Method Not Allowed");
        return;
      }

      try {
        // Get the admin FCM token from Firestore
        const tokenDoc = await admin
            .firestore()
            .collection("fcm_tokens")
            .doc("admin")
            .get();

        if (!tokenDoc.exists) {
          res.json({
            linked: false,
            message: "Ingen admin-enhed er linket til notifikationer.",
            linkedDevice: null,
          });
          return;
        }

        const data = tokenDoc.data();
        const linkedToken = data.token;
        const linkedUserAgent = data.userAgent || "Ukendt";
        const linkedTimestamp = data.timestamp ?
          new Date(data.timestamp.seconds ? data.timestamp.seconds * 1000 : data.timestamp).toLocaleString("da-DK") :
          "Ukendt";

        res.json({
          linked: true,
          message: "Admin-enhed er linket til notifikationer.",
          linkedDevice: {
            userAgent: linkedUserAgent,
            timestamp: linkedTimestamp,
            token: linkedToken, // Include token for client-side comparison
          },
        });
      } catch (error) {
        console.error("Get notification status error:", error);
        res.status(500).json({error: "Internal server error"});
      }
    },
);

// Clear FCM token endpoint (for testing)
exports.clearFCMToken = onRequest(
    {
      cors: true,
      maxInstances: 10,
    },
    async (req, res) => {
      if (req.method !== "POST") {
        res.status(405).send("Method Not Allowed");
        return;
      }

      try {
        // Delete the admin FCM token from Firestore
        await admin
            .firestore()
            .collection("fcm_tokens")
            .doc("admin")
            .delete();

        res.json({
          success: true,
          message: "FCM token cleared successfully",
        });
      } catch (error) {
        console.error("Clear FCM token error:", error);
        res.status(500).json({error: "Internal server error"});
      }
    },
);
