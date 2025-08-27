import React, { useEffect, useRef, useCallback } from 'react';
import TimeAgo from 'react-timeago';
import randomColor from 'randomcolor';

const FeedPost = React.memo(({ post, onPostClick, onRegisterPost, onUnregisterPost }) => {
  const postRef = useRef(null);
  const touchHandled = useRef(false);
  const touchStartRef = useRef({ x: 0, y: 0, time: 0 });
  const hasMoved = useRef(false);

  const handleClick = useCallback(() => {
    onPostClick(post.slug);
  }, [onPostClick, post.slug]);

  // Track touch start position and time
  const handleTouchStart = useCallback((e) => {
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };
    hasMoved.current = false;
    touchHandled.current = false;
  }, []);

  // Track if the user is scrolling/moving
  const handleTouchMove = useCallback((e) => {
    if (!touchStartRef.current) return;
    
    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStartRef.current.x);
    const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);
    
    // If the user has moved more than 10px in any direction, consider it a scroll/move gesture
    if (deltaX > 10 || deltaY > 10) {
      hasMoved.current = true;
    }
  }, []);

  // Only trigger navigation if it was a tap (not a scroll)
  const handleTouchEnd = useCallback((e) => {
    const touchDuration = Date.now() - touchStartRef.current.time;
    
    // Only handle as a tap if:
    // 1. User hasn't moved significantly (not scrolling)
    // 2. Touch duration is reasonable for a tap (< 500ms)
    // 3. Touch hasn't been handled already
    if (!hasMoved.current && touchDuration < 500 && !touchHandled.current) {
      e.preventDefault(); // Prevent the 300ms click delay
      touchHandled.current = true;
      handleClick();
      
      // Reset the flag after a short delay
      setTimeout(() => {
        touchHandled.current = false;
      }, 300);
    }
    
    // Reset tracking
    hasMoved.current = false;
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
  }, [post.slug, onRegisterPost, onUnregisterPost]);

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
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
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