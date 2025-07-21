import React, { useEffect, useRef, useCallback } from 'react';
import TimeAgo from 'react-timeago';
import randomColor from 'randomcolor';

const FeedPost = React.memo(({ post, onPostClick, onRegisterPost, onUnregisterPost }) => {
  const postRef = useRef(null);
  const touchHandled = useRef(false);

  const handleClick = useCallback(() => {
    onPostClick(post.slug);
  }, [onPostClick, post.slug]);

  // Optimized touch handler for mobile devices
  const handleTouchEnd = useCallback((e) => {
    e.preventDefault(); // Prevent the 300ms click delay
    touchHandled.current = true;
    handleClick();
    
    // Reset the flag after a short delay
    setTimeout(() => {
      touchHandled.current = false;
    }, 300);
  }, [handleClick]);

  // Only handle click if touch wasn't already handled
  const handleClickOptimized = useCallback((e) => {
    if (touchHandled.current) {
      e.preventDefault();
      return;
    }
    handleClick();
  }, [handleClick]);

  // Register/unregister this post element for visibility tracking
  useEffect(() => {
    if (postRef.current && onRegisterPost) {
      onRegisterPost(post.slug, postRef.current);
    }

    return () => {
      if (onUnregisterPost) {
        onUnregisterPost(post.slug);
      }
    };
  }, [post.slug]); // Only depend on the slug, not the functions

  // Check if post has an image attachment
  const hasImageAttachment = post.hasAttachment && 
    post.attachedFileContentType && 
    post.attachedFileContentType.startsWith('image/');

  // Generate a consistent subtle random color overlay for this post (80% transparent)
  const baseColor = randomColor({ 
    luminosity: 'light',
    seed: post.slug // Use post slug as seed for consistent color
  });
  
  // Convert to rgba with low opacity
  const randomOverlayColor = baseColor + '2A'; // 2A = 20% opacity in hex

  return (
    <div
      ref={postRef}
      className={`feed-post ${hasImageAttachment ? 'feed-post-with-image' : ''}`}
      onClick={handleClickOptimized}
      onTouchEnd={handleTouchEnd}
      style={{
        ...(hasImageAttachment ? {
          backgroundImage: `url(${post.attachedFileUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        } : {}),
        position: 'relative'
      }}
    >
      {/* Very subtle random color overlay */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: randomOverlayColor,
          borderRadius: '8px', // Match the feed post border radius
          pointerEvents: 'none',
          zIndex: 1
        }}
      />
      
      {hasImageAttachment && <div className="feed-post-blur-overlay"></div>}
      
      <div className={`feed-post-header ${hasImageAttachment ? 'inverted-text' : ''}`} style={{ position: 'relative', zIndex: 2 }}>
        <span className="post-time"><TimeAgo date={post.createdAt} /></span>
        <span className="post-stats">
          <span 
            style={{ 
              display: 'inline-block',
              width: '6px',
              height: '6px',
              backgroundColor: '#4CAF50',
              borderRadius: '50%',
              marginRight: '6px',
              animation: 'pulse 2s infinite'
            }}
          ></span>
          <span style={{ fontWeight: 'bold' }}>{post.currentViews}/{post.viewLimit} views</span>
        </span>
      </div>
      
      <div className={`feed-post-preview ${hasImageAttachment ? 'inverted-text' : ''}`} style={{ position: 'relative', zIndex: 2 }}>
        {post.preview || '(Image/File only)'}
      </div>
      
      <div className="feed-post-footer" style={{ position: 'relative', zIndex: 2 }}>
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