import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import Home from './components/Home';
import ViewPost from './components/ViewPost';

function App() {
  return (
    <>
      <div className="navbar">
        <Link to="/" className="navbar-brand">FiniteBlog</Link>
      </div>
      <div className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/:slug" element={<ViewPost />} />
        </Routes>
      </div>
    </>
  );
}

export default App; 