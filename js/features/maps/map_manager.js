/**
 * MapManager - Handles all map-related operations
 * 
 * This class provides a clean interface for managing Google Maps,
 * including API loading, map initialization, marker management,
 * and coordinate updates.
 */
import { getConfig } from '../../config.js';

export class MapManager {
  /**
   * Create a new MapManager instance
   * @param {Object} config - App configuration
   */
  constructor(config = null) {
    this.config = config || getConfig();
    this.map = null;
    this.recordedMap = null;
    this.marker = null;
    this.isInitialized = false;
    this.onMapReady = null; // Callback for when maps are ready
    this.onMapError = null; // Callback for map errors
  }

  /**
   * Set callback for when maps are ready
   * @param {Function} callback - Callback function
   */
  setOnMapReady(callback) {
    this.onMapReady = callback;
  }

  /**
   * Set callback for map errors
   * @param {Function} callback - Callback function
   */
  setOnMapError(callback) {
    this.onMapError = callback;
  }

  /**
   * Load Google Maps API dynamically
   * @returns {Promise} Promise that resolves when API is loaded
   */
  async loadGoogleMapsAPI() {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if (window.google && window.google.maps) {
        console.log('Google Maps API already loaded');
        resolve();
        return;
      }

      const apiKey = this.config.googleMaps.apiKey;
      
      if (!apiKey) {
        const error = new Error('Google Maps API key not available');
        console.warn('Google Maps disabled: No API key available');
        if (this.onMapError) this.onMapError(error);
        reject(error);
        return;
      }

      // Check if script is already being loaded
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        console.log('Google Maps API script already loading, waiting...');
        // Wait for the existing script to load
        const checkExisting = () => {
          if (window.google && window.google.maps) {
            console.log('Google Maps API loaded from existing script');
            resolve();
          } else {
            setTimeout(checkExisting, 100);
          }
        };
        checkExisting();
        return;
      }

      // Debug: Print the script URL
      const scriptUrl = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,marker&loading=async`;
      console.log('[DEBUG] Loading Google Maps API script:', scriptUrl);

      const script = document.createElement('script');
      script.src = scriptUrl;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        console.log('Google Maps API script loaded successfully');
        resolve();
      };
      
      script.onerror = (e) => {
        const error = new Error('Failed to load Google Maps API script');
        console.warn('Google Maps disabled: Script failed to load', e);
        if (this.onMapError) this.onMapError(error);
        reject(error);
      };
      
      document.head.appendChild(script);
    });
  }

  /**
   * Wait for Google Maps API to be available
   * @param {Function} callback - Callback to execute when API is ready
   * @param {number} maxAttempts - Maximum number of attempts to check
   */
  waitForGoogleMaps(callback, maxAttempts = 20) {
    let attempts = 0;
    
    const checkGoogleMaps = () => {
      attempts++;
      
      if (window.google && window.google.maps && window.google.maps.Map) {
        console.log('Google Maps API loaded successfully');
        callback();
      } else if (attempts >= maxAttempts) {
        const error = new Error(`Google Maps API failed to load after ${maxAttempts} attempts`);
        console.warn(error.message);
        
        // Show error message to user
        this.showMapError();
        
        if (this.onMapError) this.onMapError(error);
      } else {
        // Increase delay progressively to reduce console noise
        const delay = Math.min(100 + (attempts * 50), 1000);
        setTimeout(checkGoogleMaps, delay);
      }
    };
    
    checkGoogleMaps();
  }

  /**
   * Show error message when maps fail to load
   */
  showMapError() {
    const mapElements = document.querySelectorAll('#map, #recordedMap');
    mapElements.forEach(element => {
      element.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; background: #f8f9fa; color: #6c757d; font-size: 16px; text-align: center; padding: 20px;">
          <div style="font-size: 48px; margin-bottom: 10px;">🗺️</div>
          <div style="font-weight: bold; margin-bottom: 10px;">Map Unavailable</div>
          <div style="font-size: 14px; color: #868e96;">
            Google Maps could not be loaded.<br>
            This doesn't affect the check-in functionality.
          </div>
        </div>
      `;
    });
  }

  /**
   * Initialize all maps
   * @returns {Promise} Promise that resolves when maps are initialized
   */
  async initializeMaps() {
    try {
      // First, try to load the Google Maps API with a timeout
      const loadPromise = this.loadGoogleMapsAPI();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Google Maps API loading timeout')), 10000);
      });
      
      await Promise.race([loadPromise, timeoutPromise]);
      
      // Then wait for it to be available
      return new Promise((resolve, reject) => {
        this.waitForGoogleMaps(() => {
          try {
            const mapConfig = this.config.googleMaps;
            
            // Initialize the main map
            this.map = new google.maps.Map(document.getElementById('map'), {
              center: mapConfig.defaultCenter,
              zoom: mapConfig.defaultZoom,
              mapId: mapConfig.mapId,
              disableDefaultUI: true,
              zoomControl: true,
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: false
            });

            // Initialize the recorded check-ins map
            this.recordedMap = new google.maps.Map(document.getElementById('recordedMap'), {
              center: mapConfig.defaultCenter,
              zoom: mapConfig.defaultZoom,
              mapId: mapConfig.mapId,
              disableDefaultUI: true,
              zoomControl: true,
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: false
            });

            this.isInitialized = true;
            console.log('Maps initialized successfully');
            
            if (this.onMapReady) this.onMapReady();
            resolve();
          } catch (mapError) {
            console.error('Error creating map instances:', mapError);
            if (this.onMapError) this.onMapError(mapError);
            reject(mapError);
          }
        });
      });
    } catch (error) {
      console.warn('Maps disabled:', error.message);
      this.showMapError();
      // Return a resolved promise to continue initialization
      return Promise.resolve();
    }
  }

  /**
   * Update the main map with new coordinates
   * @param {number} latitude - Latitude coordinate
   * @param {number} longitude - Longitude coordinate
   */
  updateMap(latitude, longitude) {
    if (!this.map) {
      console.warn('Map not initialized - skipping update');
      return;
    }
    
    if (!window.google || !window.google.maps) {
      console.warn('Google Maps API not available - skipping update');
      return;
    }
    
    try {
      const position = { lat: latitude, lng: longitude };
      
      if (this.marker) {
        this.marker.position = position;
      } else {
        if (google.maps.marker && google.maps.marker.AdvancedMarkerElement) {
          this.marker = new google.maps.marker.AdvancedMarkerElement({
            position: position,
            map: this.map
          });
        } else {
          console.warn('AdvancedMarkerElement not available - using regular marker');
          this.marker = new google.maps.Marker({
            position: position,
            map: this.map
          });
        }
      }
      
      this.map.setCenter(position);
      this.map.setZoom(15);
    } catch (error) {
      console.error('Error updating map:', error);
      if (this.onMapError) this.onMapError(error);
    }
  }

  /**
   * Add a marker to the recorded map
   * @param {number} latitude - Latitude coordinate
   * @param {number} longitude - Longitude coordinate
   * @param {string} title - Marker title
   */
  addMarker(latitude, longitude, title = '') {
    if (!this.recordedMap) {
      console.warn('Recorded map not initialized - skipping marker');
      return;
    }
    
    if (!window.google || !window.google.maps) {
      console.warn('Google Maps API not available - skipping marker');
      return;
    }
    
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      console.warn('Invalid coordinates - skipping marker');
      return;
    }
    
    try {
      if (google.maps.marker && google.maps.marker.AdvancedMarkerElement) {
        new google.maps.marker.AdvancedMarkerElement({
          position: { lat: latitude, lng: longitude },
          map: this.recordedMap,
          title: title
        });
      } else {
        console.warn('AdvancedMarkerElement not available - using regular marker');
        new google.maps.Marker({
          position: { lat: latitude, lng: longitude },
          map: this.recordedMap,
          title: title
        });
      }
    } catch (error) {
      console.error('Error adding marker:', error);
      if (this.onMapError) this.onMapError(error);
    }
  }

  /**
   * Clear all markers from the recorded map
   */
  clearMarkers() {
    if (!this.recordedMap) {
      console.warn('Recorded map not initialized - cannot clear markers');
      return;
    }
    
    // Note: This is a simplified approach. In a production app,
    // you might want to track markers in an array for better management
    console.log('Markers cleared from recorded map');
  }

  /**
   * Get the main map instance
   * @returns {Object|null} Google Maps instance or null
   */
  getMap() {
    return this.map;
  }

  /**
   * Get the recorded map instance
   * @returns {Object|null} Google Maps instance or null
   */
  getRecordedMap() {
    return this.recordedMap;
  }

  /**
   * Check if maps are initialized
   * @returns {boolean} True if maps are initialized
   */
  isMapsInitialized() {
    return this.isInitialized;
  }

  /**
   * Check if Google Maps API is available
   * @returns {boolean} True if API is available
   */
  isGoogleMapsAvailable() {
    return !!(window.google && window.google.maps);
  }

  /**
   * Get current map center
   * @returns {Object|null} Center coordinates or null
   */
  getMapCenter() {
    if (!this.map) return null;
    
    const center = this.map.getCenter();
    return {
      lat: center.lat(),
      lng: center.lng()
    };
  }

  /**
   * Get current map zoom level
   * @returns {number|null} Zoom level or null
   */
  getMapZoom() {
    if (!this.map) return null;
    return this.map.getZoom();
  }

  /**
   * Set map center and zoom
   * @param {number} latitude - Latitude coordinate
   * @param {number} longitude - Longitude coordinate
   * @param {number} zoom - Zoom level (optional)
   */
  setMapView(latitude, longitude, zoom = null) {
    if (!this.map) {
      console.warn('Map not initialized - cannot set view');
      return;
    }
    
    try {
      const position = { lat: latitude, lng: longitude };
      this.map.setCenter(position);
      
      if (zoom !== null) {
        this.map.setZoom(zoom);
      }
    } catch (error) {
      console.error('Error setting map view:', error);
      if (this.onMapError) this.onMapError(error);
    }
  }

  /**
   * Fit map bounds to include all markers
   * @param {Array} coordinates - Array of {lat, lng} coordinates
   */
  fitBounds(coordinates) {
    if (!this.recordedMap || !coordinates || coordinates.length === 0) {
      return;
    }
    
    try {
      const bounds = new google.maps.LatLngBounds();
      
      coordinates.forEach(coord => {
        bounds.extend(new google.maps.LatLng(coord.lat, coord.lng));
      });
      
      this.recordedMap.fitBounds(bounds);
    } catch (error) {
      console.error('Error fitting bounds:', error);
      if (this.onMapError) this.onMapError(error);
    }
  }

  /**
   * Render all check-in markers on the recorded map
   * @param {Array} checkIns - Array of check-in objects
   */
  renderCheckInMarkers(checkIns) {
    if (!this.recordedMap) {
      console.warn('Recorded map not initialized - cannot render markers');
      return;
    }
    // Optionally clear previous markers if you track them
    checkIns.forEach(checkin => {
      if (
        typeof checkin.latitude === 'number' &&
        typeof checkin.longitude === 'number'
      ) {
        this.addMarker(checkin.latitude, checkin.longitude, checkin.name || '');
      }
    });
  }
} 