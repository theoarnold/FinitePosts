<<<<<<< HEAD
import React, { useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import Manifesto from './components/Manifesto';
import Home from './components/Home';
import Write from './components/Write';
import ViewPost from './components/ViewPost';
=======
import React from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import Home from './components/Home';
import ViewPost from './components/ViewPost';
import Manifesto from './components/Manifesto';
>>>>>>> 5bcf2bdd885fff5f229a1603fbc60bc31a1a4a62

function App() {
  const navigate = useNavigate();

  const handleNavbarClick = () => {
    navigate('/');
  };

  const handleManifestoClick = (e) => {
    e.stopPropagation();
  };

<<<<<<< HEAD
  const handleWriteClick = (e) => {
    e.stopPropagation();
  };

=======
>>>>>>> 5bcf2bdd885fff5f229a1603fbc60bc31a1a4a62
  return (
    <>
      <div className="navbar" onClick={handleNavbarClick} style={{ cursor: 'pointer' }}>
        <Link to="/" className="navbar-brand">FiniteBlog</Link>
<<<<<<< HEAD
        <div className="navbar-links">
          <Link to="/manifesto" className="navbar-link" onClick={handleManifestoClick}>manifesto</Link>
        </div>
=======
        <Link to="/manifesto" className="navbar-link" onClick={handleManifestoClick}>manifesto</Link>
>>>>>>> 5bcf2bdd885fff5f229a1603fbc60bc31a1a4a62
      </div>
      <div className="container">
        <Routes>
          <Route path="/" element={<Home />} />
<<<<<<< HEAD
          <Route path="/write" element={<Write />} />
=======
>>>>>>> 5bcf2bdd885fff5f229a1603fbc60bc31a1a4a62
          <Route path="/manifesto" element={<Manifesto />} />
          <Route path="/:slug" element={<ViewPost />} />
        </Routes>
      </div>
    </>
  );
}

export default App; 