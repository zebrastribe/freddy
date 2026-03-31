import admin from 'firebase-admin';
import http from 'http';

if (!process.env.FIRESTORE_EMULATOR_HOST) {
  process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8180';
}

if (!admin.apps.length) {
  admin.initializeApp({ projectId: 'tracker-6a648' });
}

const db = admin.firestore();

async function assertFirestoreEmulatorAvailable() {
  await new Promise((resolve, reject) => {
    const req = http.get('http://127.0.0.1:8180/', (res) => {
      res.resume();
      resolve();
    });
    req.on('error', () => reject(new Error('Firestore emulator is not reachable on 127.0.0.1:8180')));
    req.setTimeout(3000, () => {
      req.destroy();
      reject(new Error('Timed out connecting to Firestore emulator on 127.0.0.1:8180'));
    });
  });
}

async function migrateUserObjects() {
  const usersSnapshot = await db.collection('users').get();
  let moved = 0;
  let checkinsMoved = 0;

  for (const userDoc of usersSnapshot.docs) {
    const userId = userDoc.id;
    const petsSnapshot = await db.collection('users').doc(userId).collection('pets').get();
    for (const petDoc of petsSnapshot.docs) {
      await db.collection('users').doc(userId).collection('objects').doc(petDoc.id)
        .set(petDoc.data(), { merge: true });

      const checkinsSnapshot = await db.collection('users').doc(userId)
        .collection('pets').doc(petDoc.id).collection('checkins').get();
      for (const checkinDoc of checkinsSnapshot.docs) {
        await db.collection('users').doc(userId).collection('objects').doc(petDoc.id)
          .collection('checkins').doc(checkinDoc.id).set(checkinDoc.data(), { merge: true });
        await checkinDoc.ref.delete();
        checkinsMoved += 1;
      }

      await petDoc.ref.delete();
      moved += 1;
    }
  }
  return { moved, checkinsMoved };
}

async function migrateStatusAndEvents() {
  const statusSnapshot = await db.collection('pet_status').get();
  let statusMoved = 0;
  for (const statusDoc of statusSnapshot.docs) {
    await db.collection('object_status').doc(statusDoc.id).set(statusDoc.data(), { merge: true });
    await statusDoc.ref.delete();
    statusMoved += 1;
  }

  const clicksSnapshot = await db.collection('clicks').get();
  let clicksUpdated = 0;
  for (const clickDoc of clicksSnapshot.docs) {
    const data = clickDoc.data();
    if (data.petId && !data.objectId) {
      const updated = { ...data, objectId: data.petId };
      delete updated.petId;
      await clickDoc.ref.set(updated, { merge: false });
      clicksUpdated += 1;
    }
  }

  const notificationsSnapshot = await db.collection('notifications').get();
  let notificationsUpdated = 0;
  for (const notificationDoc of notificationsSnapshot.docs) {
    const data = notificationDoc.data();
    const updated = { ...data };
    let changed = false;
    if (updated.petId && !updated.objectId) {
      updated.objectId = updated.petId;
      delete updated.petId;
      changed = true;
    }
    if (updated.petName && !updated.objectName) {
      updated.objectName = updated.petName;
      delete updated.petName;
      changed = true;
    }
    if (changed) {
      await notificationDoc.ref.set(updated, { merge: false });
      notificationsUpdated += 1;
    }
  }

  const tokenSnapshot = await db.collection('fcm_tokens').get();
  let tokensUpdated = 0;
  for (const tokenDoc of tokenSnapshot.docs) {
    const data = tokenDoc.data();
    if (data.petId && !data.objectId) {
      const updated = { ...data, objectId: data.petId };
      delete updated.petId;
      await tokenDoc.ref.set(updated, { merge: false });
      tokensUpdated += 1;
    }
  }

  return { statusMoved, clicksUpdated, notificationsUpdated, tokensUpdated };
}

async function runMigration() {
  await assertFirestoreEmulatorAvailable();
  console.log('Starting hard cutover migration: pets -> objects');
  const { moved, checkinsMoved } = await migrateUserObjects();
  const eventStats = await migrateStatusAndEvents();
  console.log('Migration complete:', {
    objectsMoved: moved,
    checkinsMoved,
    ...eventStats,
  });
}

runMigration().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
