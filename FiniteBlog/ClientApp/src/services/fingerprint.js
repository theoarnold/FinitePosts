import { getFingerprint } from '@thumbmarkjs/thumbmarkjs';

class FingerprintService {
  constructor() {
    this.cachedFingerprint = null;
    this.fingerprintPromise = null;
    this.initialized = false;
  }

  async getFingerprint() {
    if (this.cachedFingerprint) {
      return this.cachedFingerprint;
    }

    if (this.fingerprintPromise) {
      return this.fingerprintPromise;
    }

    this.fingerprintPromise = this.generateFingerprint();
    
    try {
      this.cachedFingerprint = await this.fingerprintPromise;
      this.initialized = true;
      return this.cachedFingerprint;
    } catch (error) {
      this.fingerprintPromise = null;
      const fallback = this.generateFallbackFingerprint();
      return fallback;
    }
  }

  async generateFingerprint() {
    try {
      const result = await getFingerprint({
        sources: {
          system: {
            platform: true,
            hardwareConcurrency: true,
            applePayVersion: true,
            browser: false,
            useragent: false,
            product: false,
            productSub: false,
            cookieEnabled: false
          },
          
          screen: {
            colorDepth: true,
            width: false,
            height: false,
            availWidth: false,
            availHeight: false,
            pixelDepth: false,
            is_touchscreen: true,
            maxTouchPoints: true,
            mediaMatches: false
          },
          
          locales: {
            timezone: true,
            languages: false
          },
          
          math: true,
          
          hardware: {
            architecture: true,
            deviceMemory: false,
            videocard: false,
            jsHeapSizeLimit: false
          },
          
          webgl: {
            commonImageHash: true,
            extensions: false,
            debugInfo: false
          },
          
          audio: false,
          canvas: false,
          fonts: false,
          plugins: false,
          permissions: false
        },
        timeout: 5000
      });

      const deterministicHash = this.createDeterministicHash(result?.data);
      
      return deterministicHash;
    } catch (error) {
      throw error;
    }
  }

  createDeterministicHash(data) {
    if (!data) return 'fallback_hash';
    
    const components = [
      data.system?.platform || '',
      data.system?.hardwareConcurrency || 0,
      data.system?.applePayVersion || 0,
      
      data.screen?.colorDepth || 0,
      data.screen?.is_touchscreen || false,
      data.screen?.maxTouchPoints || 0,
      
      data.locales?.timezone || '',
      
      data.hardware?.architecture || 0,
      
      data.webgl?.commonImageHash || '',
      
      data.math ? this.hashMathValues(data.math) : ''
    ];
    
    const componentString = components.join('|');
    
    let hash = 0;
    for (let i = 0; i < componentString.length; i++) {
      const char = componentString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    const finalHash = 'device_' + Math.abs(hash).toString(36);
    
    return finalHash;
  }

  hashObject(obj) {
    if (!obj || typeof obj !== 'object') return '';
    
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

  hashMathValues(math) {
    if (!math) return '';
    
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

  generateFallbackFingerprint() {
    const nav = navigator;
    const screen = window.screen;
    
    const deviceComponents = [
      nav.platform || '',
      nav.hardwareConcurrency || 0,
      screen.colorDepth || 0,
      nav.maxTouchPoints || 0,
      Intl.DateTimeFormat().resolvedOptions().timeZone || '',
    ];
    
    let hash = 0;
    const deviceString = deviceComponents.join('|');
    for (let i = 0; i < deviceString.length; i++) {
      const char = deviceString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    const fallbackHash = 'device_' + Math.abs(hash).toString(36);
    
    return fallbackHash;
  }

  isReady() {
    return this.initialized && this.cachedFingerprint !== null;
  }

  clearCache() {
    this.cachedFingerprint = null;
    this.fingerprintPromise = null;
    this.initialized = false;
  }
}

const fingerprintService = new FingerprintService();
export default fingerprintService; 