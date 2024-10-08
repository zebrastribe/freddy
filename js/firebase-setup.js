// Import Firebase services
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-analytics.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

// Your web app's Firebase configuration 
const firebaseConfig = {
  apiKey: "AIzaSyBwLFO04OQgD6LjYdYlrEXb73THTp5H0Ss",
  authDomain: "tracker-6a648.firebaseapp.com",
  projectId: "tracker-6a648",
  storageBucket: "tracker-6a648.appspot.com",
  messagingSenderId: "789878332530",
  appId: "1:789878332530:web:9bd999d86df0fe9caef6eb",
  measurementId: "G-XMHHKFJ9QW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);

// Function to handle user authentication
function authenticateUser() {
  return signInAnonymously(auth).catch((error) => {
    console.error("Error signing in anonymously: ", error);
  });
}

// Check authentication state and re-authenticate if necessary
function checkAuthState() {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log("User is authenticated on SiteB");
      // Proceed with your logic here
    } else {
      console.log("User is not authenticated on SiteB, re-authenticating...");
      authenticateUser().then(() => {
        // Proceed with your logic here
      }).catch((error) => {
        console.error("Error during re-authentication on SiteB:", error);
      });
    }
  });
}

// Export necessary functions and variables
export { db, auth, checkAuthState, onAuthStateChanged };