import React, { useEffect, useRef } from 'react';

/**
 * Google Native Ad (AdSense - fluid format)
 * Reads config from env:
 * - REACT_APP_ADSENSE_CLIENT (required)
 * - REACT_APP_ADSENSE_NATIVE_SLOT (required)
 * - REACT_APP_ADSENSE_LAYOUT_KEY (optional, for in-feed native layouts)
 *
 * You can override via props: client, slot, layoutKey.
 */
const GoogleNativeAd = ({ client, slot, layoutKey, className = '' }) => {
  const adRef = useRef(null);

  const resolvedClient = client || process.env.REACT_APP_ADSENSE_CLIENT || '';
  const resolvedSlot = slot || process.env.REACT_APP_ADSENSE_NATIVE_SLOT || '';
  const resolvedLayoutKey = layoutKey || process.env.REACT_APP_ADSENSE_LAYOUT_KEY || '';

  useEffect(() => {
    if (!resolvedClient || !resolvedSlot) {
      // eslint-disable-next-line no-console
      console.warn('GoogleNativeAd: Missing client or slot. Set REACT_APP_ADSENSE_CLIENT and REACT_APP_ADSENSE_NATIVE_SLOT.');
      return;
    }
    // Attempt to (re)initialize the ad on mount
    try {
      if (window && window.adsbygoogle && adRef.current) {
        window.adsbygoogle.push({});
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('GoogleNativeAd init warning:', e);
    }
  }, [resolvedClient, resolvedSlot]);

  if (!resolvedClient || !resolvedSlot) {
    return null;
  }

  return (
    <div className={`post-ad-container ${className}`}>
      {/* Google AdSense native ad */}
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={resolvedClient}
        data-ad-slot={resolvedSlot}
        data-ad-format="fluid"
        data-full-width-responsive="true"
        {...(resolvedLayoutKey ? { 'data-ad-layout-key': resolvedLayoutKey } : {})}
        ref={adRef}
      />
    </div>
  );
};

export default GoogleNativeAd;


