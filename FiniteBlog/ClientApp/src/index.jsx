import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';

const root = ReactDOM.createRoot(document.getElementById('root'));

function Root() {
  const [siteKey, setSiteKey] = useState(process.env.REACT_APP_RECAPTCHA_SITE_KEY || '');
  const [loadingKey, setLoadingKey] = useState(!siteKey);
  const adsenseClient = process.env.REACT_APP_ADSENSE_CLIENT || '';

  useEffect(() => {
    if (siteKey) return;
    fetch('https://wypriback-hdcta5aregafawbq.uksouth-01.azurewebsites.net/api/config/recaptcha-site-key', { credentials: 'include' })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error('No site key configured');
        }
        const data = await res.json();
        setSiteKey(data.siteKey || '');
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error('Failed to load reCAPTCHA site key:', err.message);
      })
      .finally(() => setLoadingKey(false));
  }, [siteKey]);

  // Load Google AdSense script once with provided client id
  useEffect(() => {
    if (!adsenseClient) {
      // eslint-disable-next-line no-console
      console.warn('REACT_APP_ADSENSE_CLIENT is not set. Google ads will not load.');
      return;
    }
    const scriptId = 'google-adsense-script';
    if (document.getElementById(scriptId)) {
      return;
    }
    const script = document.createElement('script');
    script.id = scriptId;
    script.async = true;
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(adsenseClient)}`;
    script.crossOrigin = 'anonymous';
    document.head.appendChild(script);
  }, [adsenseClient]);

  if (loadingKey) {
    return null;
  }

  if (!siteKey) {
    // eslint-disable-next-line no-console
    console.error('<GoogleReCaptchaProvider /> recaptcha key not provided');
    return (
      <React.StrictMode>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </React.StrictMode>
    );
  }

  return (
    <React.StrictMode>
      <GoogleReCaptchaProvider reCaptchaKey={siteKey} scriptProps={{ async: true, defer: true }} useRecaptchaNet>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </GoogleReCaptchaProvider>
    </React.StrictMode>
  );
}

root.render(<Root />);