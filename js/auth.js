// auth.js
import { auth, onAuthStateChanged } from './firebase-setup.js';
import { fetchLastCoordinates, fetchCheckIns } from './fetch.js';

let user = null;

onAuthStateChanged(auth, (currentUser) => {
  if (currentUser) {
    user = currentUser;
    console.log("User authenticated:", user);
    fetchLastCoordinates(); // Fetch last coordinates when user is authenticated
    fetchCheckIns(); // Fetch and display all check-ins
  } else {
    console.error("User is not authenticated");
  }
});

export function getUser() {
  return user;
}