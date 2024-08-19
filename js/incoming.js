import { db } from './firebase-setup.js';
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

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
}

// Function to mark the token as used
export async function useToken() {
    if (!token) {
        console.log('No token available.');
        return;
    }

    const tokenDoc = doc(db, 'tokens', token);
    await updateDoc(tokenDoc, {
        used: true
    });

    console.log('Token marked as used.');
}