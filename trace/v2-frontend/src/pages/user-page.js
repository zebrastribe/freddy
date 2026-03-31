export class UserPage {
  constructor() {
    this.app = window.traceApp
  }

  async render() {
    const app = document.getElementById('app')
    app.innerHTML = `
      <div class="min-h-screen bg-gradient-to-br from-blue-50 to-white py-12 px-4">
        <div class="max-w-6xl mx-auto">
          <div class="card">
            <h1 class="card-header">User Pets</h1>
            <p class="text-gray-600 mb-6">This page will show all pets for a specific user.</p>
            <div class="bg-gray-50 rounded-lg p-4">
              <p class="text-gray-500 text-center">User pets will be loaded here</p>
            </div>
            <button onclick="window.location.href='/'" class="btn-primary mt-4">← Back to Home</button>
          </div>
        </div>
      </div>
    `
  }

  cleanup() {}
}

export function renderUserPage(userId) {
  return `
    <div class="min-h-screen bg-gradient-to-br from-orange-50 to-white py-12 px-4">
      <div class="max-w-4xl mx-auto">
        <div class="bg-white rounded-lg shadow-lg p-8">
          <h1 class="text-3xl font-bold text-gray-900 mb-6">User Profile: ${userId}</h1>
          <p class="text-gray-600 mb-6">This page will contain the user profile and their pets.</p>
          <div class="bg-gray-100 rounded-lg p-8 text-center">
            <p class="text-gray-500">User profile component will be integrated here</p>
            <p class="text-sm text-gray-400 mt-2">User ID: ${userId}</p>
          </div>
          <button onclick="window.location.href='/'" class="mt-6 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  `;
} 