import React, { useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import Manifesto from './components/Manifesto';
import Home from './components/Home';
import Write from './components/Write';
import ViewPost from './components/ViewPost';
import FingerprintDebug from './components/FingerprintDebug';
import fingerprintService from './services/fingerprint';

function App() {

  // Start fingerprint generation immediately in background
  useEffect(() => {
    fingerprintService.getFingerprint().catch(() => {
      // Silently handle errors - fingerprint is optional for feed
    });
  }, []);



  const handleManifestoClick = (e) => {
    e.stopPropagation();
    };

  const handleNavbarClick = (e) => {
    // Don't navigate if clicking on navbar links
    if (e.target.closest('.navbar-links')) {
      return;
    }
    e.stopPropagation();
  };



  const handleFeedClick = (e) => {
    e.stopPropagation();
  };

  return (
    <>
      <Link to="/" className="navbar" onClick={handleNavbarClick} style={{ cursor: 'pointer', textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', width: '100%' }}>
        <span className="navbar-brand">wypri<span className="alpha-badge">Beta</span></span>
        <div className="navbar-links">
          <Link to="/manifesto" className="navbar-link" onClick={handleManifestoClick}>manifesto</Link>
          <Link to="/" className="navbar-link feed-link" onClick={handleFeedClick}>feed</Link>
        </div>
      </Link>
      <div className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/write" element={<Write />} />
          <Route path="/manifesto" element={<Manifesto />} />
          <Route path="/debug-fingerprint" element={<FingerprintDebug />} />
          <Route path="/:slug" element={<ViewPost />} />
        </Routes>
      </div>
    </>
  );
}

export default App; 