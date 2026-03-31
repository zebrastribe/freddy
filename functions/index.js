const {onDocumentCreated} = require("firebase-functions/v2/firestore");
const {onRequest} = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

admin.initializeApp();

// Remote Config for admin password
const remoteConfig = admin.remoteConfig();
const IS_EMULATOR =
  process.env.FUNCTIONS_EMULATOR === "true" ||
  process.env.FIREBASE_EMULATOR_HUB;

const ERROR_CODES = {
  UNAUTHORIZED: "unauthorized",
  FORBIDDEN: "forbidden",
  METHOD_NOT_ALLOWED: "method_not_allowed",
  MISSING_CONFIGURATION: "missing_configuration",
};

function getParamValue(template, key) {
  const param = template.parameters && template.parameters[key];
  return param &&
    param.defaultValue &&
    param.defaultValue.value;
}

async function findObjectById(objectId) {
  if (!objectId) return null;

  const topLevelDoc = await admin.firestore().collection("objects").doc(objectId).get();
  if (topLevelDoc.exists) {
    return {id: topLevelDoc.id, ...topLevelDoc.data()};
  }

  const nestedObjects = await admin.firestore()
      .collectionGroup("objects")
      .where(admin.firestore.FieldPath.documentId(), "==", objectId)
      .limit(1)
      .get();
  if (!nestedObjects.empty) {
    const doc = nestedObjects.docs[0];
    return {id: doc.id, ...doc.data()};
  }

  return null;
}

async function requireAdminRequest(req, res) {
  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) {
    res.status(401).json({error: "Missing bearer token", code: ERROR_CODES.UNAUTHORIZED});
    return false;
  }

  const idToken = authHeader.replace("Bearer ", "").trim();
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const role = decodedToken.role || decodedToken.adminRole;
    if (role === "admin" || role === "superadmin") {
      return true;
    }

    const userDoc = await admin.firestore().collection("users").doc(decodedToken.uid).get();
    const userRole = userDoc.exists ? userDoc.data().role : null;
    if (userRole === "admin" || userRole === "superadmin") {
      return true;
    }

    res.status(403).json({error: "Admin role required", code: ERROR_CODES.FORBIDDEN});
    return false;
  } catch (error) {
    res.status(401).json({error: "Invalid token", code: ERROR_CODES.UNAUTHORIZED});
    return false;
  }
}

async function processCheckInNotification(checkIn, checkInId, objectIdParam = null) {
      const effectiveObjectId = checkIn.objectId || objectIdParam || null;

      console.log(`Processing check-in notification for: ${checkInId}`, checkIn);

      try {
        // Get object information if objectId is provided
        let objectName = "Object";
        let objectOwnerId = null;

        if (effectiveObjectId) {
          try {
            const objectData = await findObjectById(effectiveObjectId);
            if (objectData) {
              objectName = objectData.name || "Object";
              objectOwnerId = objectData.userId || objectData.ownerId || null;
              console.log(`Found object: ${objectName} (owner: ${objectOwnerId})`);
            }
          } catch (error) {
            console.error("Error fetching object information:", error);
          }
        }

        // Get all FCM tokens for this object (owner + admin)
        const tokensToNotify = [];

        // 1. Get admin token (legacy support)
        try {
          const adminTokenDoc = await admin.firestore().collection("fcm_tokens").doc("admin").get();
          if (adminTokenDoc.exists && adminTokenDoc.data().token) {
            tokensToNotify.push({
              token: adminTokenDoc.data().token,
              type: "admin",
              userId: "admin"
            });
            console.log("Added admin token for notification");
          }
        } catch (error) {
          console.error("Error fetching admin token:", error);
        }

        // 2. Get object owner token if different from check-in user
        if (objectOwnerId && objectOwnerId !== checkIn.userId) {
          try {
            const ownerTokenDoc = await admin.firestore().collection("fcm_tokens").doc(`${objectOwnerId}_${effectiveObjectId}`).get();
            if (ownerTokenDoc.exists && ownerTokenDoc.data().token) {
              tokensToNotify.push({
                token: ownerTokenDoc.data().token,
                type: "owner",
                userId: objectOwnerId
              });
              console.log(`Added owner token for user: ${objectOwnerId}`);
            }
          } catch (error) {
            console.error("Error fetching owner token:", error);
          }
        }

        // 3. Get all tokens for this specific object (multi-user support)
        if (effectiveObjectId) {
          try {
            const objectTokensQuery = await admin.firestore()
              .collection("fcm_tokens")
              .where("objectId", "==", effectiveObjectId)
              .get();

            objectTokensQuery.forEach(doc => {
              const tokenData = doc.data();
              if (tokenData.token && tokenData.userId !== checkIn.userId) { // Don't notify the person who made the check-in
                tokensToNotify.push({
                  token: tokenData.token,
                  type: "object_user",
                  userId: tokenData.userId
                });
                console.log(`Added object user token for user: ${tokenData.userId}`);
              }
            });
          } catch (error) {
            console.error("Error fetching object user tokens:", error);
          }
        }

        // Send notifications to all relevant tokens
        const notificationPromises = tokensToNotify.map(async (tokenInfo) => {
          try {
            const notificationTitle = `Ny ${objectName} Check-in!`;
            const notificationBody = checkIn.name ? 
              `${checkIn.name} har lige checket ind` : 
              "Der er kommet en ny check-in!";

            const message = {
              token: tokenInfo.token,
              notification: {
                title: notificationTitle,
                body: notificationBody,
              },
              webpush: {
                notification: {
                  icon: "/img/emoji-cat-192x192.png",
                  badge: "/img/emoji-cat-192x192.png",
                  tag: `checkin-${effectiveObjectId || 'general'}`,
                  requireInteraction: false,
                  silent: false,
                  click_action: effectiveObjectId ?
                    `https://zebrastribe.github.io/freddy/${objectOwnerId}/${objectName}/` :
                    "https://zebrastribe.github.io/freddy/",
                },
                data: {
                  userId: checkIn.userId || '',
                  objectId: effectiveObjectId || '',
                  objectName: objectName,
                  checkInId: checkInId,
                  url: effectiveObjectId ?
                    `https://zebrastribe.github.io/freddy/${objectOwnerId}/${objectName}/` :
                    "https://zebrastribe.github.io/freddy/",
                  timestamp: new Date().toISOString()
                }
              },
            };

            await admin.messaging().send(message);
            console.log(`Push notification sent to ${tokenInfo.type} (${tokenInfo.userId}) successfully`);
            return { success: true, userId: tokenInfo.userId, type: tokenInfo.type };
          } catch (error) {
            console.error(`Error sending notification to ${tokenInfo.type} (${tokenInfo.userId}):`, error);
            return { success: false, userId: tokenInfo.userId, type: tokenInfo.type, error: error.message };
          }
        });

        const results = await Promise.all(notificationPromises);
        const successCount = results.filter(r => r.success).length;
        const failureCount = results.filter(r => !r.success).length;

        console.log(`Notification sending completed: ${successCount} successful, ${failureCount} failed`);
        return { successCount, failureCount, results };

      } catch (error) {
        console.error("Error in sendCheckInNotification:", error);
        // Don't throw - we don't want to fail the check-in process
        return { error: error.message };
      }
}

exports.sendCheckInNotification = onDocumentCreated(
    "clicks/{checkInId}",
    async (event) => {
      const checkIn = event.data.data();
      const checkInId = event.params.checkInId;
      return processCheckInNotification(checkIn, checkInId, null);
    },
);

exports.sendObjectCheckInNotification = onDocumentCreated(
    "users/{userId}/objects/{objectId}/checkins/{checkInId}",
    async (event) => {
      const checkIn = event.data.data();
      const checkInId = event.params.checkInId;
      return processCheckInNotification(checkIn, checkInId, event.params.objectId);
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
        const adminPassword = getParamValue(template, "admin_password") ||
          (IS_EMULATOR ? "AngryLion" : null);

        if (!adminPassword) {
          res.status(503).json({error: "Admin password is not configured"});
          return;
        }

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
        res.status(405).json({error: "Method Not Allowed", code: ERROR_CODES.METHOD_NOT_ALLOWED});
        return;
      }

      if (!(await requireAdminRequest(req, res))) {
        return;
      }

      try {
        // Get API keys from Remote Config
        const template = await remoteConfig.getTemplate();

        const googleMapsValue = getParamValue(template, "google_maps_api_key");
        const firebaseValue = getParamValue(template, "firebase_api_key");

        const apiKeys = {
          googleMaps: googleMapsValue || (IS_EMULATOR ? "demo-google-maps-key" : null),
          firebase: firebaseValue || (IS_EMULATOR ? "demo-firebase-key" : null),
          // For now, return null for reCAPTCHA to disable it until properly configured
          recaptcha: null,
        };

        if (!apiKeys.googleMaps || !apiKeys.firebase) {
          res.status(503).json({error: "API keys are not configured", code: ERROR_CODES.MISSING_CONFIGURATION});
          return;
        }

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
        res.status(405).json({error: "Method Not Allowed", code: ERROR_CODES.METHOD_NOT_ALLOWED});
        return;
      }

      if (!(await requireAdminRequest(req, res))) {
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
            tokenPreview: linkedToken ? `${linkedToken.slice(0, 6)}...` : null,
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
        res.status(405).json({error: "Method Not Allowed", code: ERROR_CODES.METHOD_NOT_ALLOWED});
        return;
      }

      if (!(await requireAdminRequest(req, res))) {
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
