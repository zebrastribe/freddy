import { db, auth, onAuthStateChanged, serverTimestamp } from './firebase-setup.js';

let user = null;

onAuthStateChanged(auth, (currentUser) => {
  if (currentUser) {
    user = currentUser;
    console.log("User authenticated:", user);
  } else {
    console.error("User is not authenticated");
  }
});

document.getElementById('clickButton').addEventListener('click', () => {
  if (user) {
    // Ensure db.collection is called correctly
    db.collection("clicks").add({
      timestamp: serverTimestamp(),
      userId: user.uid
    })
    .then(() => {
      console.log("Document successfully written!");
    })
    .catch((error) => {
      console.error("Error writing document: ", error);
    });
  } else {
    console.error("User is not authenticated, cannot add document");
  }
});