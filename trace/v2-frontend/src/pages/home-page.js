export function renderHomePage() {
  return `
    <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <!-- Header -->
      <header class="bg-white shadow-sm border-b border-gray-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between items-center py-4">
            <div class="flex items-center">
              <h1 class="text-2xl font-bold text-gray-900">Trace</h1>
              <span class="ml-2 text-sm text-gray-500">Pet Check-ins</span>
            </div>
            <nav class="flex space-x-4">
              <a href="/" class="text-gray-900 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">Home</a>
              <a href="/user/test" class="text-gray-500 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">User</a>
              <a href="/user/test/pet/freddy" class="text-gray-500 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">Pet</a>
            </nav>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Hero Section -->
        <div class="text-center mb-12">
          <h2 class="text-4xl font-bold text-gray-900 mb-4">
            Welcome to Trace
          </h2>
          <p class="text-xl text-gray-600 max-w-3xl mx-auto">
            A simple place to track pet check-ins and keep people informed.
          </p>
        </div>

        <!-- Feature Cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">Multi-User Support</h3>
            <p class="text-gray-600">Manage multiple users with individual pet collections and permissions.</p>
          </div>

          <div class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">Pet Management</h3>
            <p class="text-gray-600">Track multiple pets per user with detailed profiles and activity logs.</p>
          </div>

          <div class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">Real-time Data</h3>
            <p class="text-gray-600">Live updates keep pet activity current across devices.</p>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="bg-white rounded-lg shadow-md p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button onclick="window.traceApp.navigateTo('/user/test')" class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
              View User Profile
            </button>
            <button onclick="window.traceApp.navigateTo('/user/test/pet/freddy')" class="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors">
              View Pet Profile
            </button>
            <button class="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors">
              Check-in Pet
            </button>
            <button class="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition-colors">
              View History
            </button>
          </div>
        </div>

        <!-- Status Section -->
        <div class="mt-8 bg-white rounded-lg shadow-md p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div class="flex items-center">
              <div class="w-3 h-3 bg-green-400 rounded-full mr-3"></div>
              <span class="text-sm text-gray-600">Check-in service</span>
            </div>
            <div class="flex items-center">
              <div class="w-3 h-3 bg-green-400 rounded-full mr-3"></div>
              <span class="text-sm text-gray-600">Website</span>
            </div>
            <div class="flex items-center">
              <div class="w-3 h-3 bg-green-400 rounded-full mr-3"></div>
              <span class="text-sm text-gray-600">Notifications</span>
            </div>
          </div>
        </div>
      </main>

      <!-- Footer -->
      <footer class="bg-gray-50 border-t border-gray-200 mt-12">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p class="text-center text-gray-500 text-sm">
            Trace - Multi-user pet check-ins
          </p>
        </div>
      </footer>
    </div>
  `
}

export function initializeHomePage() {
  console.log('🏠 Home page initialized')
  
  // Add any home page specific initialization here
  // For example, loading user data, setting up event listeners, etc.
} 