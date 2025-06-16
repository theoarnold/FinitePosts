import React from 'react';

const FeedState = ({ loading, error, posts, onRetry }) => {
  if (loading) {
    return (
      <div className="feed-container">
        <div className="loading">Loading posts...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="feed-container">
        <div className="error-message">{error}</div>
        <button onClick={onRetry} className="retry-button">Retry</button>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="no-posts">
        <p>No posts available yet.</p>
        <p>Be the first to create one!</p>
      </div>
    );
  }

  return null;
};

export default FeedState; 