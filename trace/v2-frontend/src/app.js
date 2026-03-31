console.log('📦 app.js loaded');

try {
  console.log('📦 Attempting to import home-page...');
  import('./pages/home-page.js').then(homeModule => {
    console.log('✅ home-page imported successfully');
    const { renderHomePage, initializeHomePage } = homeModule;
    
    console.log('📦 Attempting to import user-page...');
    import('./pages/user-page.js').then(userModule => {
      console.log('✅ user-page imported successfully');
      const { renderUserPage } = userModule;
      
      console.log('📦 Attempting to import pet-page...');
      import('./pages/object-page.js').then(petModule => {
        console.log('✅ object-page imported successfully');
        const { ObjectPage } = petModule;
        
        console.log('📦 All imports successful, defining TraceApp class...');

class TraceApp {
  constructor() {
    this.currentPage = null
    this.router = null
    this.init()
  }

  init() {
    console.log('🚀 Initializing Trace App...')
    
    // Initialize router
    this.initializeRouter()
    
    // Handle initial route
    this.handleRoute()
    
    // Listen for route changes
    window.addEventListener('popstate', () => this.handleRoute())
    
    console.log('✅ Trace App initialized')
  }

  initializeRouter() {
    // Simple client-side router
    this.router = {
      '/': { render: renderHomePage, init: initializeHomePage },
      '/checkin': { render: () => console.log('📍 Checkin page initialized'), init: () => console.log('📍 Checkin page initialized') },
      '/map': { render: () => console.log('🗺️ Map page initialized'), init: () => console.log('🗺️ Map page initialized') },
      '/history': { render: () => console.log('📊 History page initialized'), init: () => console.log('📊 History page initialized') },
      '/admin': { render: () => console.log('⚙️ Admin page initialized'), init: () => console.log('⚙️ Admin page initialized') }
    }
  }

  handleRoute() {
    const path = window.location.pathname
    console.log('🛣️ Navigating to:', path)
    
    // Find matching route
    let route = this.router[path]
            console.log('🔍 Exact route match:', route ? 'found' : 'not found')
    
    // Handle dynamic routes
    if (!route) {
              console.log('🔍 Checking dynamic routes...')
              
      // User routes: /user/:userId
      if (path.startsWith('/user/')) {
        const userId = path.split('/')[2]
                console.log('👤 User route matched:', userId)
        route = { 
          render: () => renderUserPage(userId), 
          init: () => console.log('👤 User page initialized for:', userId) 
        }
      }
              // Object routes: /urlName/objectName (hard cutover format)
              else if (path.split('/').filter(part => part).length === 2) {
                const parts = path.split('/').filter(part => part);
                const urlName = parts[0];
                const objectName = parts[1];
                console.log('📦 Object route matched:', urlName, objectName);
                
                // Create ObjectPage instance
                const objectPage = new ObjectPage();
        route = { 
                  render: async () => {
                    console.log('🎨 Starting async ObjectPage render...');
                    await objectPage.render();
                    console.log('✅ Async ObjectPage render complete');
                    return ''; // ObjectPage renders directly to DOM
                  }, 
                  init: () => console.log('📦 Object page initialized for:', urlName, objectName) 
        }
      }
      // Default to home
      else {
                console.log('🏠 No route matched, defaulting to home');
        route = this.router['/']
      }
    }
    
    // Render the page
    if (route && route.render) {
              console.log('🎨 Rendering page...');
      const app = document.getElementById('app')
      if (app) {
                // Check if render function is async by calling it and checking if it returns a Promise
                const renderResult = route.render();
                console.log('📋 Render result type:', typeof renderResult);
                
                if (renderResult && typeof renderResult.then === 'function') {
                  // It's an async function
                  console.log('⏳ Async render detected, waiting...');
                  renderResult.then(() => {
                    console.log('✅ Async render completed');
                    // Initialize the page after async render
                    if (route.init) {
                      route.init()
                    }
                  }).catch(error => {
                    console.error('❌ Error rendering page:', error);
                  });
                } else {
                  // It's a sync function
                  console.log('⚡ Sync render, setting innerHTML');
                  app.innerHTML = renderResult || '';
        
        // Initialize the page
        if (route.init) {
          route.init()
                  }
        }
        
        this.currentPage = path
                console.log('✅ Route handling complete');
              } else {
                console.error('❌ App element not found!');
      }
            } else {
              console.error('❌ No route or render function found!');
    }
  }

  navigateTo(path) {
    window.history.pushState({}, '', path)
    this.handleRoute()
  }
}

        // Set TraceApp on window and export it
        window.TraceApp = TraceApp
        console.log('✅ TraceApp class defined and set on window');
        
        // Initialize immediately if DOM is ready
        if (document.readyState === 'loading') {
document.addEventListener('DOMContentLoaded', () => {
            console.log('🚀 DOM ready, initializing TraceApp...');
            window.traceApp = new TraceApp();
            console.log('✅ TraceApp instance created');
          });
        } else {
          console.log('🚀 DOM already ready, initializing TraceApp immediately...');
          window.traceApp = new TraceApp();
          console.log('✅ TraceApp instance created');
        }
        
      }).catch(error => {
        console.error('❌ object-page import failed:', error)
      })
      
    }).catch(error => {
      console.error('❌ user-page import failed:', error)
    })
    
  }).catch(error => {
    console.error('❌ home-page import failed:', error)
  })
  
} catch (error) {
  console.error('❌ App.js execution error:', error)
} 