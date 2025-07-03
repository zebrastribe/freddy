/**
 * Test setup file for Jest
 * @description Configures global test environment and mocks
 */

// Import Jest DOM matchers
import '@testing-library/jest-dom';

// Global test setup
beforeAll(() => {
  // Set up global mocks and configurations
  console.log('Setting up test environment...');
});

// Global test teardown
afterAll(() => {
  // Clean up global resources
  console.log('Cleaning up test environment...');
});

// Mock global browser APIs that might not be available in jsdom
global.Notification = {
  permission: 'granted',
  requestPermission: jest.fn().mockResolvedValue('granted')
};

// Mock service worker
global.ServiceWorkerRegistration = class {
  constructor() {
    this.showNotification = jest.fn();
  }
};

// Mock navigator.serviceWorker
Object.defineProperty(global.navigator, 'serviceWorker', {
  value: {
    register: jest.fn().mockResolvedValue(new ServiceWorkerRegistration()),
    getRegistration: jest.fn().mockResolvedValue(new ServiceWorkerRegistration()),
    ready: Promise.resolve(new ServiceWorkerRegistration())
  },
  writable: true
});

// Mock Google Maps API
global.google = {
  maps: {
    Map: jest.fn(),
    Marker: jest.fn(),
    LatLng: jest.fn(),
    MapTypeId: {
      ROADMAP: 'roadmap'
    }
  }
};

// Mock Firebase
global.firebase = {
  initializeApp: jest.fn(),
  getApp: jest.fn(),
  getApps: jest.fn().mockReturnValue([])
};

// Mock console methods to reduce noise in tests
const originalConsole = { ...console };
beforeEach(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  console.log.mockRestore();
  console.warn.mockRestore();
  console.error.mockRestore();
});

// Mock fetch API
global.fetch = jest.fn();

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:8000/',
    hostname: 'localhost',
    pathname: '/',
    search: '',
    hash: ''
  },
  writable: true
});

// Mock window.history
Object.defineProperty(window, 'history', {
  value: {
    pushState: jest.fn(),
    replaceState: jest.fn(),
    back: jest.fn(),
    forward: jest.fn()
  },
  writable: true
});

// Mock window.localStorage (basic implementation)
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true
});

// Mock window.sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
  writable: true
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn(callback => setTimeout(callback, 0));

// Mock cancelAnimationFrame
global.cancelAnimationFrame = jest.fn(id => clearTimeout(id));

// Mock performance API
Object.defineProperty(window, 'performance', {
  value: {
    now: jest.fn(() => Date.now()),
    mark: jest.fn(),
    measure: jest.fn(),
    getEntriesByType: jest.fn(() => [])
  },
  writable: true
});

// Mock URLSearchParams
global.URLSearchParams = class {
  constructor(search) {
    this.search = search || '';
  }
  
  get(key) {
    // Simple mock implementation
    const params = new URLSearchParams(this.search);
    return params.get(key);
  }
  
  has(key) {
    const params = new URLSearchParams(this.search);
    return params.has(key);
  }
  
  set(key, value) {
    const params = new URLSearchParams(this.search);
    params.set(key, value);
    this.search = params.toString();
  }
  
  delete(key) {
    const params = new URLSearchParams(this.search);
    params.delete(key);
    this.search = params.toString();
  }
  
  toString() {
    return this.search;
  }
};

// Mock URL constructor
global.URL = class {
  constructor(url, base) {
    this.href = url;
    this.hostname = 'localhost';
    this.pathname = '/';
    this.search = '';
    this.hash = '';
  }
  
  get searchParams() {
    return new URLSearchParams(this.search);
  }
};

// Export common test utilities
export const createMockElement = (tagName = 'div', attributes = {}) => {
  const element = document.createElement(tagName);
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
  return element;
};

export const createMockEvent = (type, options = {}) => {
  return new Event(type, options);
};

export const waitFor = (callback, timeout = 1000) => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const check = () => {
      try {
        const result = callback();
        if (result) {
          resolve(result);
          return;
        }
      } catch (error) {
        // Continue checking
      }
      
      if (Date.now() - startTime > timeout) {
        reject(new Error(`waitFor timed out after ${timeout}ms`));
        return;
      }
      
      setTimeout(check, 10);
    };
    
    check();
  });
};

// Global test utilities
global.createMockElement = createMockElement;
global.createMockEvent = createMockEvent;
global.waitFor = waitFor; 