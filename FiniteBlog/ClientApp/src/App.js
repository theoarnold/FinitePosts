import React from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import Home from './components/Home';
import ViewPost from './components/ViewPost';
import Manifesto from './components/Manifesto';

function App() {
  const navigate = useNavigate();

  const handleNavbarClick = () => {
    navigate('/');
  };

  const handleManifestoClick = (e) => {
    e.stopPropagation();
  };

  return (
    <>
      <div className="navbar" onClick={handleNavbarClick} style={{ cursor: 'pointer' }}>
        <Link to="/" className="navbar-brand">FiniteBlog</Link>
        <Link to="/manifesto" className="navbar-link" onClick={handleManifestoClick}>manifesto</Link>
      </div>
      <div className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/manifesto" element={<Manifesto />} />
          <Route path="/:slug" element={<ViewPost />} />
        </Routes>
      </div>
    </>
  );
}

export default App; 