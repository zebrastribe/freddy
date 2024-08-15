import { db, auth, onAuthStateChanged } from './firebase-setup.js';
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

let user = null;

onAuthStateChanged(auth, (currentUser) => {
  if (currentUser) {
    user = currentUser;
    console.log("User authenticated:", user);
  } else {
    console.error("User is not authenticated");
  }
});

document.getElementById('clickButton').addEventListener('click', async () => {
  if (user) {
    try {
      await addDoc(collection(db, "clicks"), {
        timestamp: serverTimestamp(),
        userId: user.uid
      });
      console.log("Document successfully written!");
    } catch (error) {
      console.error("Error writing document: ", error);
    }
  } else {
    console.error("User is not authenticated, cannot add document");
  }
});