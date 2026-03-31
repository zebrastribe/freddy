// Minimal admin panel entry point

// Import the main admin application
import './admin.js';

document.addEventListener('DOMContentLoaded', () => {
  const app = document.getElementById('app');
  if (app) {
    app.innerHTML = `
      <div class="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <h1 class="text-3xl font-bold text-gray-900 mb-4">Trace Admin Panel</h1>
        <p class="text-gray-600">Welcome to the admin dashboard.</p>
      </div>
    `;
  }
}); 