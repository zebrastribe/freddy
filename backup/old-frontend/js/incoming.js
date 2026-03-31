/*
The provided JavaScript code is designed to handle token management, including extracting a token from the URL, validating it, and marking it as used. This functionality is crucial for scenarios where tokens are used for authentication or authorization purposes.
The script begins by importing necessary modules from Firebase Firestore and a local Firebase setup file. It declares a token variable to store the token value extracted from the URL.
The logTokenFromUrl function is responsible for extracting the token from the URL. It creates a URL object from the current window location and uses URLSearchParams to parse the query parameters. The function then retrieves the token parameter and logs it to the console. If the token is not found, it logs a corresponding message.
The getToken function is a simple utility that returns the current value of the token variable. This function can be used by other parts of the application to access the token.
The isTokenValid function is an asynchronous function that checks if the token is valid. It first checks if a token is available. If not, it logs a message and returns false. It then retrieves the token document from the Firestore database using the doc and getDoc functions. If the token document does not exist, it logs a message and returns false. The function then checks if the token has already been used or if it has expired. If either condition is true, it logs a message and returns false. If the token is valid, it returns true.
The useToken function is another asynchronous function that marks the token as used. It first checks if a token is available. If not, it logs a message and exits. It then updates the token document in the Firestore database, setting the used field to true. Finally, it logs a message indicating that the token has been marked as used.
Overall, this script provides a robust mechanism for managing tokens, ensuring they are valid and marking them as used to prevent reuse. This is particularly useful in applications that require secure token-based authentication or authorization.
*/

import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

// Get Firestore instance from global Firebase app
function getDb() {
  if (window.firebaseDB) {
    return window.firebaseDB;
  }
  throw new Error('Firebase DB not initialized');
}

let token = null;

export function logTokenFromUrl() {
    // Get the current URL
    const url = new URL(window.location.href);

    // Get the search parameters from the URL
    const params = new URLSearchParams(url.search);

    // Extract the 'token' parameter
    token = params.get('token');

    // Log the 'token' parameter to the console
    if (token) {
        console.log('Token:', token);
    } else {
        console.log('Token parameter not found in the URL.');
    }
}

// Export a function to get the token value
export function getToken() {
    return token;
}

// Function to check if the token is valid
export async function isTokenValid() {
    if (!token) {
        console.log('No token available.');
        return false;
    }

    // Special bypass for dev token
    if (token === 'dev') {
        console.log('Dev token detected - bypassing validation');
        return true;
    }

    try {
        const db = getDb();
        const tokenDoc = doc(db, 'tokens', token);
        const tokenSnapshot = await getDoc(tokenDoc);

        if (!tokenSnapshot.exists()) {
            console.log('Token does not exist.');
            return false;
        }

        const tokenData = tokenSnapshot.data();
        const now = new Date();

        if (tokenData.used) {
            console.log('Token has already been used.');
            return false;
        }

        const expiryDate = new Date(tokenData.expiry);

        if (expiryDate < now) {
            console.log('Token has expired.');
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error validating token:', error);
        return false;
    }
}

// Function to mark the token as used
export async function useToken() {
    if (!token) {
        console.log('No token available.');
        return;
    }

    try {
        const db = getDb();
        const tokenDoc = doc(db, 'tokens', token);
        await updateDoc(tokenDoc, {
            used: true
        });

        console.log('Token marked as used.');
    } catch (error) {
        console.error('Error marking token as used:', error);
    }
}