import React, { useState, useEffect } from 'react';
import fingerprintService from '../services/fingerprint';
import { getFingerprint } from '@thumbmarkjs/thumbmarkjs';

const FingerprintDebug = () => {
  const [fingerprint, setFingerprint] = useState(null);
  const [fingerprintData, setFingerprintData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [rawData, setRawData] = useState(null);
  const [rawValues, setRawValues] = useState(null);
  const [compositeDemo, setCompositeDemo] = useState(null);

  // Function to extract raw browser values
  const getRawBrowserValues = async () => {
    const nav = navigator;
    const screen = window.screen;
    
    // Get real IP from server
    let realIP = 'Loading...';
    try {
      const response = await fetch('/api/posts/debug/client-info');
      const data = await response.json();
      realIP = data.ipAddress || 'Unknown';
    } catch (error) {
      realIP = 'Error fetching IP';
    }
    
    return {
      // System info (device-level)
      platform: nav.platform || 'unknown',
      hardwareConcurrency: nav.hardwareConcurrency || 0,
      applePayVersion: nav.applePayVersion || 0,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'unknown',
      
      // Screen characteristics (device-level only)
      colorDepth: screen.colorDepth || 0,
      isTouchscreen: 'ontouchscreen' in window,
      maxTouchPoints: nav.maxTouchPoints || 0,
      
      // Browser-specific values (EXCLUDED from fingerprinting)
      excludedDeviceMemory: nav.deviceMemory || 'unknown',
      
      // Monitor-specific values (EXCLUDED from fingerprinting)
      excludedScreenWidth: screen.width || 0,
      excludedScreenHeight: screen.height || 0,
      excludedAvailWidth: screen.availWidth || 0,
      excludedAvailHeight: screen.availHeight || 0,
      excludedDevicePixelRatio: window.devicePixelRatio || 1,
      excludedOrientationAngle: screen.orientation?.angle || 0,
      
      // Real IP from server
      realIP: realIP,
    };
  };

  // Function to create composite fingerprint like the server does
  const createCompositeFingerprint = (deviceFingerprint, ipAddress) => {
    const components = [];
    
    if (deviceFingerprint) {
      components.push(`device:${deviceFingerprint}`);
    }
    
    if (ipAddress) {
      components.push(`ip:${ipAddress}`);
    }
    
    if (components.length === 0) return '';
    
    const composite = components.join('|');
    
    // Create a hash of the composite (matching server logic)
    let hash = 0;
    for (let i = 0; i < composite.length; i++) {
      const char = composite.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return {
      composite: composite,
      hash: `composite_${Math.abs(hash).toString(16).toUpperCase()}`,
      components: components
    };
  };

  const generateFingerprint = async () => {
    setLoading(true);
    try {
      // Get raw browser values first
      const rawVals = await getRawBrowserValues();
      setRawValues(rawVals);
      
      // Clear cache to generate fresh fingerprint
      fingerprintService.clearCache();
      const deviceFingerprint = await fingerprintService.getFingerprint();
      setFingerprint(deviceFingerprint);
      
      // Create composite fingerprint demo
      const composite = createCompositeFingerprint(deviceFingerprint, rawVals.realIP);
      setCompositeDemo(composite);
      
      // Also get the raw data for debugging
      const rawResult = await getFingerprint({
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
            width: false,                // Excluded: varies by monitor
            height: false,               // Excluded: varies by monitor
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
            deviceMemory: false,         // Excluded: not available in Firefox
            videocard: false,
            jsHeapSizeLimit: false
          },
          webgl: {
            commonImageHash: true,       // Keep GPU hash
            extensions: false,           // Excluded: different between browsers
            debugInfo: false             // Excluded: different between browsers
          },
          audio: false,                  // Excluded: different implementations
          canvas: false,                 // Excluded: different rendering engines
          fonts: false,
          plugins: false,
          permissions: false
        },
        timeout: 5000
      });
      
      setFingerprintData(rawResult?.data);
      setRawData(rawResult);
      
    } catch (error) {
      setFingerprint({ error: error.message });
    }
    setLoading(false);
  };

  useEffect(() => {
    generateFingerprint();
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', fontSize: '12px' }}>
      <h3>Device Fingerprint Debug - Enhanced Identifier</h3>
      <button onClick={generateFingerprint} disabled={loading}>
        {loading ? 'Generating...' : 'Generate New Fingerprint'}
      </button>
      
      {/* Raw Browser Values Section */}
      {rawValues && (
        <div style={{ marginTop: '20px' }}>
          <strong>Raw Values Used for Identification:</strong>
          <div style={{ 
            backgroundColor: '#fff3cd', 
            padding: '15px', 
            borderRadius: '4px',
            marginTop: '10px',
            border: '1px solid #ffeaa7'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <strong style={{ color: '#0d6efd' }}>✓ Included (Device-Level):</strong>
                <div>Platform: {rawValues.platform}</div>
                <div>CPU Cores: {rawValues.hardwareConcurrency}</div>
                <div>Apple Pay: {rawValues.applePayVersion}</div>
                <div>Timezone: {rawValues.timezone}</div>
                <div>Color Depth: {rawValues.colorDepth}</div>
                <div>Touch Screen: {rawValues.isTouchscreen ? 'Yes' : 'No'}</div>
                <div>Touch Points: {rawValues.maxTouchPoints}</div>
              </div>
              <div>
                <strong style={{ color: '#dc3545' }}>✗ Excluded (Browser/Monitor-Specific):</strong>
                <div style={{ opacity: 0.6 }}>Device Memory: {rawValues.excludedDeviceMemory} <em>(Firefox doesn't expose)</em></div>
                <div style={{ opacity: 0.6 }}>Screen: {rawValues.excludedScreenWidth} × {rawValues.excludedScreenHeight}</div>
                <div style={{ opacity: 0.6 }}>Available: {rawValues.excludedAvailWidth} × {rawValues.excludedAvailHeight}</div>
                <div style={{ opacity: 0.6 }}>Pixel Ratio: {rawValues.excludedDevicePixelRatio}</div>
                <div style={{ opacity: 0.6 }}>Orientation: {rawValues.excludedOrientationAngle}°</div>
                <div style={{ fontSize: '10px', color: '#dc3545', marginTop: '5px', fontStyle: 'italic' }}>
                  ↳ These values vary by browser/monitor, so they're excluded for consistency
                </div>
              </div>
            </div>
            <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#e7f3ff', borderRadius: '3px' }}>
              <strong>Network (Server-detected):</strong>
              <div>IP Address: {rawValues.realIP}</div>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Fingerprint Components */}
      {fingerprintData && (
        <div style={{ marginTop: '20px' }}>
          <strong>EVERY Fingerprint Component (Copy/Compare Between Browsers):</strong>
          <div style={{ 
            backgroundColor: '#f8f9fa', 
            padding: '15px', 
            borderRadius: '4px',
            marginTop: '10px',
            border: '1px solid #dee2e6',
            fontFamily: 'monospace',
            fontSize: '11px'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <strong>Basic System Values:</strong>
                <div>Platform: "{fingerprintData.system?.platform || 'undefined'}"</div>
                <div>CPU Cores: {fingerprintData.system?.hardwareConcurrency || 'undefined'}</div>
                <div>Apple Pay: {fingerprintData.system?.applePayVersion || 'undefined'}</div>
                <div>Architecture: {fingerprintData.hardware?.architecture || 'undefined'}</div>
                
                <strong style={{ marginTop: '10px', display: 'block' }}>Screen Values:</strong>
                <div>Color Depth: {fingerprintData.screen?.colorDepth || 'undefined'}</div>
                <div>Is Touchscreen: {String(fingerprintData.screen?.is_touchscreen || 'undefined')}</div>
                <div>Max Touch Points: {fingerprintData.screen?.maxTouchPoints || 'undefined'}</div>
                
                <strong style={{ marginTop: '10px', display: 'block' }}>Locale Values:</strong>
                <div>Timezone: "{fingerprintData.locales?.timezone || 'undefined'}"</div>
              </div>
              
              <div>
                <strong>WebGL Values:</strong>
                <div>Common Hash: "{fingerprintData.webgl?.commonImageHash || 'undefined'}" ✓ USED</div>
                <div style={{ opacity: 0.6 }}>Extensions: {JSON.stringify(fingerprintData.webgl?.extensions || {})} ❌ DISABLED</div>
                <div style={{ opacity: 0.6 }}>Debug Info: {JSON.stringify(fingerprintData.webgl?.debugInfo || {})} ❌ DISABLED</div>
                
                <strong style={{ marginTop: '10px', display: 'block' }}>DISABLED (Browser-Specific):</strong>
                <div style={{ opacity: 0.6 }}>Audio: {JSON.stringify(fingerprintData.audio || {})} ❌ DISABLED</div>
                <div style={{ opacity: 0.6 }}>Canvas: {JSON.stringify(fingerprintData.canvas || {})} ❌ DISABLED</div>
              </div>
            </div>
            
            <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#e9ecef', borderRadius: '3px' }}>
              <strong>Math Values (Should be IDENTICAL across browsers):</strong>
              <div style={{ fontSize: '10px', maxHeight: '100px', overflow: 'auto' }}>
                {JSON.stringify(fingerprintData.math || {}, null, 2)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Device Fingerprint Section */}
      <div style={{ marginTop: '20px' }}>
        <strong>Device Fingerprint Hash:</strong>
        <div style={{ 
          backgroundColor: '#f0f0f0', 
          padding: '15px', 
          borderRadius: '4px',
          marginTop: '10px',
          wordBreak: 'break-all',
          fontSize: '12px'
        }}>
          {fingerprint?.error ? (
            <div style={{ color: '#d63384' }}>Error: {fingerprint.error}</div>
          ) : fingerprint ? (
            <div style={{ marginBottom: '10px' }}>
              <strong style={{ color: '#0d6efd' }}>Device Hash:</strong><br/>
              <span style={{ fontFamily: 'monospace', backgroundColor: '#e7f3ff', padding: '4px', borderRadius: '3px' }}>
                {fingerprint}
              </span>
            </div>
          ) : (
            'Loading...'
          )}
        </div>
      </div>

      {/* Composite Fingerprint Section */}
      {compositeDemo && (
        <div style={{ marginTop: '20px' }}>
          <strong>Final Composite Identifier (Device + IP):</strong>
          <div style={{ 
            backgroundColor: '#f8f9fa', 
            padding: '15px', 
            borderRadius: '4px',
            marginTop: '10px',
            border: '1px solid #dee2e6'
          }}>
            <div style={{ marginBottom: '10px' }}>
              <strong>Components:</strong>
              {compositeDemo.components.map((comp, index) => (
                <div key={index} style={{ 
                  marginLeft: '10px', 
                  fontFamily: 'monospace', 
                  backgroundColor: index === 0 ? '#e7f3ff' : '#fff3e0',
                  padding: '2px 4px',
                  borderRadius: '3px',
                  marginTop: '2px'
                }}>
                  {comp}
                </div>
              ))}
            </div>
            <div style={{ marginBottom: '10px' }}>
              <strong>Composite String:</strong><br/>
              <code style={{ backgroundColor: '#f0f0f0', padding: '4px', borderRadius: '3px' }}>
                {compositeDemo.composite}
              </code>
            </div>
            <div>
              <strong style={{ color: '#198754' }}>Final Identifier:</strong><br/>
              <span style={{ 
                fontFamily: 'monospace', 
                backgroundColor: '#d1e7dd', 
                padding: '4px', 
                borderRadius: '3px',
                fontWeight: 'bold'
              }}>
                {compositeDemo.hash}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Identification Strategy */}
      <div style={{ marginTop: '20px' }}>
        <strong>Multi-Layer Identification Strategy:</strong>
        <div style={{ 
          backgroundColor: '#e2e3e5', 
          padding: '15px', 
          borderRadius: '4px',
          marginTop: '10px'
        }}>
          <div style={{ marginBottom: '10px' }}>
            <strong style={{ color: '#198754' }}>✓ Layer 1: Cookie-based Visitor ID</strong>
            <div style={{ fontSize: '11px', color: '#666', marginLeft: '15px' }}>
              Most reliable, persists across browser sessions
            </div>
          </div>
          <div>
            <strong style={{ color: '#0d6efd' }}>✓ Layer 2: Composite Fingerprint</strong>
            <div style={{ fontSize: '11px', color: '#666', marginLeft: '15px' }}>
              Device characteristics + IP address for hardware-level + network-level uniqueness
            </div>
          </div>
          <div style={{ fontSize: '11px', color: '#666', marginTop: '10px', fontStyle: 'italic' }}>
            If EITHER layer detects a previous view, the view count is not incremented
          </div>
        </div>
      </div>

      {/* Technical Details Section */}
      {fingerprintData && (
        <div style={{ marginTop: '20px' }}>
          <details>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
              Raw Fingerprint Components (Click to expand)
            </summary>
            <div style={{ 
              backgroundColor: '#f8f9fa', 
              padding: '15px', 
              borderRadius: '4px',
              marginTop: '10px',
              border: '1px solid #dee2e6',
              maxHeight: '400px',
              overflow: 'auto'
            }}>
              <pre>{JSON.stringify(fingerprintData, null, 2)}</pre>
            </div>
          </details>
        </div>
      )}

      {/* Testing Instructions */}
      <div style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
        <p><strong>Cross-Browser Testing Steps:</strong></p>
        <p><strong>1. Chrome Test:</strong> Open this page in Chrome, copy all console output</p>
        <p><strong>2. Firefox Test:</strong> Open this page in Firefox, copy all console output</p>
        <p><strong>3. Compare:</strong> Look for ANY differences in the component values</p>
        <p><strong>4. Focus on:</strong> Math values should be IDENTICAL. If WebGL/Audio/Canvas differ, that's the issue</p>
        <p><strong>5. Check Console:</strong> Look for "FINGERPRINT COMPONENT BREAKDOWN" and "Final component string"</p>
      </div>

      {/* Unique Device Differentiation */}
      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#fff3cd', borderRadius: '4px', border: '1px solid #ffeaa7' }}>
        <strong>How This Differentiates Identical Devices (Multi-Monitor Safe):</strong>
        <div style={{ marginTop: '10px', fontSize: '11px' }}>
          <div>• <strong>Different Networks:</strong> iPhone 14 on WiFi vs iPhone 14 on cellular = different IPs</div>
          <div>• <strong>Hardware Variations:</strong> Slight differences in GPU drivers, audio hardware</div>
          <div>• <strong>Software Stack:</strong> Different iOS versions, app installations affecting WebGL/Canvas</div>
          <div>• <strong>Settings Variations:</strong> Different accessibility settings, system configurations</div>
          <div>• <strong>Physical Differences:</strong> Hardware replacements with slightly different characteristics</div>
          <div style={{ marginTop: '8px', padding: '8px', backgroundColor: '#d1ecf1', borderRadius: '3px', border: '1px solid #bee5eb' }}>
            <strong>🖥️ Multi-Monitor Compatible:</strong> Screen dimensions are excluded so the same user isn't identified as different when moving between monitors
          </div>
        </div>
      </div>

      {/* Component String Breakdown */}
      {fingerprintData && (
        <div style={{ marginTop: '20px' }}>
          <strong>Component String Breakdown (Check Console for Details):</strong>
          <div style={{ 
            backgroundColor: '#fff3cd', 
            padding: '15px', 
            borderRadius: '4px',
            marginTop: '10px',
            border: '1px solid #ffeaa7',
            fontFamily: 'monospace',
            fontSize: '10px'
          }}>
            <div><strong>1. Platform:</strong> "{fingerprintData.system?.platform || ''}"</div>
            <div><strong>2. CPU Cores:</strong> {fingerprintData.system?.hardwareConcurrency || 0}</div>
            <div><strong>3. Apple Pay:</strong> {fingerprintData.system?.applePayVersion || 0}</div>
            <div><strong>4. Color Depth:</strong> {fingerprintData.screen?.colorDepth || 0}</div>
            <div><strong>5. Is Touchscreen:</strong> {String(fingerprintData.screen?.is_touchscreen || false)}</div>
            <div><strong>6. Max Touch Points:</strong> {fingerprintData.screen?.maxTouchPoints || 0}</div>
            <div><strong>7. Timezone:</strong> "{fingerprintData.locales?.timezone || ''}"</div>
            <div><strong>8. Architecture:</strong> {fingerprintData.hardware?.architecture || 0}</div>
            <div><strong>9. WebGL Hash:</strong> "{fingerprintData.webgl?.commonImageHash || ''}"</div>
            <div><strong>10. Math Hash:</strong> [See console for computed hash]</div>
            
            <div style={{ marginTop: '8px', padding: '6px', backgroundColor: '#f8d7da', borderRadius: '3px' }}>
              <strong>❌ DISABLED for Browser Consistency:</strong><br/>
              WebGL Extensions, WebGL Debug, Audio, Canvas
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FingerprintDebug; 