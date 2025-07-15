import { getFingerprint } from '@thumbmarkjs/thumbmarkjs';

class FingerprintService {
  constructor() {
    this.cachedFingerprint = null;
    this.fingerprintPromise = null;
    this.initialized = false;
  }

  async getFingerprint() {
    // If we already have a cached fingerprint, return it immediately
    if (this.cachedFingerprint) {
      return this.cachedFingerprint;
    }

    // If we're already generating a fingerprint, wait for it
    if (this.fingerprintPromise) {
      return this.fingerprintPromise;
    }

    // Start generating a new fingerprint
    this.fingerprintPromise = this.generateFingerprint();
    
    try {
      this.cachedFingerprint = await this.fingerprintPromise;
      this.initialized = true;
      return this.cachedFingerprint;
    } catch (error) {
      // Reset promise on error so it can be retried
      this.fingerprintPromise = null;
      // Return a fallback fingerprint based on device hardware
      const fallback = this.generateFallbackFingerprint();
      return fallback;
    }
  }

  async generateFingerprint() {
    try {
      // Use device-level characteristics plus more granular details
      const result = await getFingerprint({
        sources: {
          // Basic system info (identical on same model)
          system: {
            platform: true,              // Win32/iPhone (identical)
            hardwareConcurrency: true,   // CPU cores (identical)
            applePayVersion: true,       // OS/hardware dependent (identical)
            // Exclude browser-specific info
            browser: false,
            useragent: false,
            product: false,
            productSub: false,
            cookieEnabled: false
          },
          
          // Screen characteristics (device-level only, not monitor-specific)
          screen: {
            colorDepth: true,            // Color depth (device-level, consistent across monitors)
            // EXCLUDE monitor-specific dimensions that vary between multiple monitors:
            width: false,                // Varies by which monitor browser is on
            height: false,               // Varies by which monitor browser is on
            is_touchscreen: true,        // Touch capability (device-level)
            maxTouchPoints: true,        // Number of touch points (device-level)
            // Exclude media queries as they're browser-dependent
            mediaMatches: false
          },
          
          // System locale (can vary by user)
          locales: {
            timezone: true,              // Geographic location
            languages: false             // Browser-specific, exclude
          },
          
          // Math precision (CPU-dependent, should be identical)
          math: true,
          
          // Hardware info (mostly identical but include what we can)
          hardware: {
            architecture: true,          // CPU architecture
            deviceMemory: false,         // Firefox doesn't expose this (privacy)
            // Exclude browser-specific limits
            videocard: false,
            jsHeapSizeLimit: false
          },
          
          // DISABLE BROWSER-SPECIFIC RENDERING (CONFIRMED: These cause differences)
          // WebGL for GPU fingerprinting (can vary by driver/settings)
          webgl: {
            commonImageHash: true,       // Keep this - GPU hash should be consistent
            extensions: false,           // DISABLED: Different extension lists between browsers
            debugInfo: false             // DISABLED: Different debug info between browsers
          },
          
          // DISABLE BROWSER-SPECIFIC FEATURES (CONFIRMED: Different between browsers)
          audio: false,                  // DISABLED: Different audio implementations
          canvas: false,                 // DISABLED: Different rendering engines
          
          // Exclude these as they're too browser-specific
          fonts: false,                  // Font list varies by browser
          plugins: false,                // Plugin list varies by browser
          permissions: false             // Permission state varies by browser
        },
        timeout: 5000  // Longer timeout for more comprehensive fingerprinting
      });

      // Create our own deterministic hash from the components
      const deterministicHash = this.createDeterministicHash(result?.data);
      
      return deterministicHash;
    } catch (error) {
      throw error;
    }
  }

  // Create a deterministic hash from fingerprint components
  createDeterministicHash(data) {
    if (!data) return 'fallback_hash';
    
    // Extract and sort the key components, EXCLUDING monitor-specific values
    const components = [
      // Basic device info
      data.system?.platform || '',
      data.system?.hardwareConcurrency || 0,
      data.system?.applePayVersion || 0,
      
      // Screen details (device-level only, not monitor-specific)
      data.screen?.colorDepth || 0,
      // REMOVED: width, height, availWidth, availHeight - these vary by monitor
      data.screen?.is_touchscreen || false,
      data.screen?.maxTouchPoints || 0,
      
      // Geographic/settings
      data.locales?.timezone || '',
      
      // Hardware
      data.hardware?.architecture || 0,
      // REMOVED: deviceMemory - not consistent across browsers
      
      // GPU-specific (can vary by driver, settings)
      data.webgl?.commonImageHash || '',
      // REMOVED: WebGL extensions and debug info - browser-specific
      // this.hashObject(data.webgl?.extensions || {}),
      // this.hashObject(data.webgl?.debugInfo || {}),
      
      // REMOVED: Audio and Canvas - browser-specific implementations
      // this.hashObject(data.audio || {}),
      // this.hashObject(data.canvas || {}),
      
      // Math precision
      data.math ? this.hashMathValues(data.math) : ''
    ];
    
    // Create deterministic string
    const componentString = components.join('|');
    
    // Simple but consistent hash function
    let hash = 0;
    for (let i = 0; i < componentString.length; i++) {
      const char = componentString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    const finalHash = 'device_' + Math.abs(hash).toString(36);
    
    return finalHash;
  }

  // Hash any object consistently
  hashObject(obj) {
    if (!obj || typeof obj !== 'object') return '';
    
    // Convert object to sorted string for consistency
    const sortedKeys = Object.keys(obj).sort();
    const objString = sortedKeys.map(key => `${key}:${obj[key]}`).join(',');
    
    let hash = 0;
    for (let i = 0; i < objString.length; i++) {
      const char = objString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    return Math.abs(hash).toString(36);
  }

  // Create a simple hash of math values
  hashMathValues(math) {
    if (!math) return '';
    
    // Convert math object to sorted string for consistency
    const mathKeys = Object.keys(math).sort();
    const mathString = mathKeys.map(key => `${key}:${math[key]}`).join(',');
    
    let hash = 0;
    for (let i = 0; i < mathString.length; i++) {
      const char = mathString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    return Math.abs(hash).toString(36);
  }

  // Generate a device-based fallback fingerprint if thumbmarkjs fails
  generateFallbackFingerprint() {
    const nav = navigator;
    const screen = window.screen;
    
    // Include only device-level characteristics, exclude monitor-specific values
    const deviceComponents = [
      nav.platform || '',                   // OS platform
      nav.hardwareConcurrency || 0,         // CPU cores
      screen.colorDepth || 0,               // Screen color depth (device-level)
      // REMOVED: screen dimensions that vary by monitor
      // screen.width, screen.height, screen.availWidth, screen.availHeight
      nav.maxTouchPoints || 0,              // Touch points (device-level)
      // REMOVED: deviceMemory - not available in Firefox
      Intl.DateTimeFormat().resolvedOptions().timeZone || '', // Timezone
      // REMOVED: devicePixelRatio and orientation - can vary by monitor
    ];
    
    // Simple hash function for device identity
    let hash = 0;
    const deviceString = deviceComponents.join('|');
    for (let i = 0; i < deviceString.length; i++) {
      const char = deviceString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    const fallbackHash = 'device_' + Math.abs(hash).toString(36);
    
    return fallbackHash;
  }

  // Check if the fingerprint service is ready
  isReady() {
    return this.initialized && this.cachedFingerprint !== null;
  }

  // Clear the cached fingerprint (useful for testing)
  clearCache() {
    this.cachedFingerprint = null;
    this.fingerprintPromise = null;
    this.initialized = false;
  }
}

// Export singleton instance
const fingerprintService = new FingerprintService();
export default fingerprintService; 