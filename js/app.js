import { db, auth, onAuthStateChanged, serverTimestamp } from './firebase-setup.js';

let user = null;

onAuthStateChanged(auth, (currentUser) => {
  if (currentUser) {
    user = currentUser;
  } else {
    console.error("User is not authenticated...");
  }
});

document.getElementById('clickButton').addEventListener('click', () => {
  if (user) {
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
  }
});