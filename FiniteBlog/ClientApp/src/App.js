import React, { useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import Manifesto from './components/Manifesto';
import Home from './components/Home';
import Write from './components/Write';
import ViewPost from './components/ViewPost';
import FingerprintDebug from './components/FingerprintDebug';
import fingerprintService from './services/fingerprint';

function App() {
  const navigate = useNavigate();

  // Start fingerprint generation immediately in background
  useEffect(() => {
    fingerprintService.getFingerprint().catch(() => {
      // Silently handle errors - fingerprint is optional for feed
    });
  }, []);

  const handleNavbarClick = () => {
    navigate('/');
  };

  const handleManifestoClick = (e) => {
    e.stopPropagation();
    };

  const handleWriteClick = (e) => {
    e.stopPropagation();
  };

  return (
    <>
      <div className="navbar" onClick={handleNavbarClick} style={{ cursor: 'pointer' }}>
        <Link to="/" className="navbar-brand">wypri</Link>
        <div className="navbar-links">
          <Link to="/manifesto" className="navbar-link" onClick={handleManifestoClick}>manifesto</Link>
        </div>
      </div>
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