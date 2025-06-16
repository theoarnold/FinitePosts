import React, { useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import Manifesto from './components/Manifesto';
import Home from './components/Home';
import Write from './components/Write';
import ViewPost from './components/ViewPost';

function App() {
  const navigate = useNavigate();

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
        <Link to="/" className="navbar-brand">FiniteBlog</Link>
        <div className="navbar-links">
          <Link to="/manifesto" className="navbar-link" onClick={handleManifestoClick}>manifesto</Link>
        </div>
      </div>
      <div className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/write" element={<Write />} />
          <Route path="/manifesto" element={<Manifesto />} />
          <Route path="/:slug" element={<ViewPost />} />
        </Routes>
      </div>
    </>
  );
}

export default App; 