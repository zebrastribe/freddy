import { HomePage } from '../pages/home-page.js'
import { UserPage } from '../pages/user-page.js'
import { ObjectPage } from '../pages/object-page.js'

export class Router {
  constructor() {
    this.routes = new Map()
    this.currentPage = null
    this.isInitialized = false
    
    this.setupRoutes()
  }

  setupRoutes() {
    this.routes.set('/', HomePage)
    this.routes.set('/:userid', UserPage)
    this.routes.set('/:userid/:name', ObjectPage)
  }

  async initialize() {
    try {
      console.log('🛣️ Initializing Router...')
      
      // Set up navigation event listeners
      window.addEventListener('popstate', () => this.handleRouteChange())
      
      // Handle initial route
      await this.handleRouteChange()
      
      this.isInitialized = true
      console.log('✅ Router initialized')
      
    } catch (error) {
      console.error('❌ Router initialization failed:', error)
    }
  }

  async handleRouteChange() {
    const path = window.location.pathname
    const route = this.findRoute(path)
    
    if (route) {
      try {
        // Clean up current page
        if (this.currentPage && this.currentPage.cleanup) {
          this.currentPage.cleanup()
        }
        
        // Create and render new page
        this.currentPage = new route()
        await this.currentPage.render()
        
        console.log(`📄 Rendered page: ${path}`)
        
      } catch (error) {
        console.error('❌ Page rendering failed:', error)
        this.showErrorPage(error)
      }
    } else {
      this.showNotFoundPage()
    }
  }

  findRoute(path) {
    // Exact match first
    if (this.routes.has(path)) {
      return this.routes.get(path)
    }
    
    // Pattern matching for dynamic routes
    for (const [pattern, component] of this.routes) {
      if (this.matchRoute(pattern, path)) {
        return component
      }
    }
    
    return null
  }

  matchRoute(pattern, path) {
    if (pattern === path) return true
    
    // Simple pattern matching for :param
    const patternParts = pattern.split('/')
    const pathParts = path.split('/')
    
    if (patternParts.length !== pathParts.length) return false
    
    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i].startsWith(':')) {
        // This is a parameter, store it
        const paramName = patternParts[i].slice(1)
        this.routeParams = this.routeParams || {}
        this.routeParams[paramName] = pathParts[i]
      } else if (patternParts[i] !== pathParts[i]) {
        return false
      }
    }
    
    return true
  }

  navigate(path) {
    window.history.pushState({}, '', path)
    this.handleRouteChange()
  }

  getRouteParams() {
    return this.routeParams || {}
  }

  handleAuthStateChange(user) {
    // Re-render current page if auth state changes
    if (this.isInitialized) {
      this.handleRouteChange()
    }
  }

  showErrorPage(error) {
    const app = document.getElementById('app')
    app.innerHTML = `
      <div class="min-h-screen bg-gradient-to-br from-red-50 to-white flex items-center justify-center">
        <div class="card max-w-md">
          <h1 class="card-header text-red-600">Error</h1>
          <p class="text-gray-600 mb-4">Something went wrong while loading the page.</p>
          <button onclick="window.location.reload()" class="btn-primary">Reload Page</button>
        </div>
      </div>
    `
  }

  showNotFoundPage() {
    const app = document.getElementById('app')
    app.innerHTML = `
      <div class="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
        <div class="card max-w-md">
          <h1 class="card-header">Page Not Found</h1>
          <p class="text-gray-600 mb-4">The page you're looking for doesn't exist.</p>
          <button onclick="window.location.href='/'" class="btn-primary">Go Home</button>
        </div>
      </div>
    `
  }
} 