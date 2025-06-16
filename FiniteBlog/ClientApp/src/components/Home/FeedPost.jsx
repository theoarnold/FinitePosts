import React, { useEffect, useRef } from 'react';

const FeedPost = React.memo(({ post, onPostClick, formatTimeAgo, onRegisterElement, onUnregisterElement }) => {
  const postRef = useRef(null);

  const handleClick = () => {
    onPostClick(post.slug);
  };

  // Register/unregister this post element for visibility tracking
  useEffect(() => {
    if (postRef.current && onRegisterElement) {
      onRegisterElement(post.slug, postRef.current);
    }

    return () => {
      if (onUnregisterElement) {
        onUnregisterElement(post.slug);
      }
    };
  }, [post.slug, onRegisterElement, onUnregisterElement]);

  return (
    <div
      ref={postRef}
      className="feed-post"
      onClick={handleClick}
    >
      <div className="feed-post-header">
        <span className="post-time">{formatTimeAgo(post.createdAt)}</span>
        <span className="post-stats">
          {post.currentViews}/{post.viewLimit} views
          {post.hasAttachment && <span className="attachment-indicator">📎</span>}
        </span>
      </div>
      
      <div className="feed-post-preview">
        {post.preview || '(Image/File only)'}
      </div>
      
      <div className="feed-post-footer">
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ 
              clipPath: `inset(0 ${100 - (post.currentViews / post.viewLimit) * 100}% 0 0)`
            }}
          ></div>
        </div>
      </div>
    </div>
  );
});

export default FeedPost; 