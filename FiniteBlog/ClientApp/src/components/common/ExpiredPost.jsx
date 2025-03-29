import React from 'react';
import { Link } from 'react-router-dom';
import './ExpiredPost.css';

const ExpiredPost = () => {
  return (
    <div className="deleted-container">
      <h2>This post has expired</h2>
      <p>This post has reached its view limit and is no longer available.</p>
      <Link to="/" className="home-link">Create a new post</Link>
    </div>
  );
};

export default ExpiredPost; 