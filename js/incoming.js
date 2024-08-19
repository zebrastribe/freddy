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