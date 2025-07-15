import React, { useEffect, useRef } from 'react';
import TimeAgo from 'react-timeago';

const FeedPost = React.memo(({ post, onPostClick, onRegisterPost, onUnregisterPost }) => {
  const postRef = useRef(null);

  const handleClick = () => {
    onPostClick(post.slug);
  };

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

  return (
    <div
      ref={postRef}
      className={`feed-post ${hasImageAttachment ? 'feed-post-with-image' : ''}`}
      onClick={handleClick}
      style={hasImageAttachment ? {
        backgroundImage: `url(${post.attachedFileUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      } : {}}
    >
      {hasImageAttachment && <div className="feed-post-blur-overlay"></div>}
      
      <div className={`feed-post-header ${hasImageAttachment ? 'inverted-text' : ''}`}>
        <span className="post-time"><TimeAgo date={post.createdAt} /></span>
        <span className="post-stats">
          {post.currentViews}/{post.viewLimit} views
        </span>
      </div>
      
      <div className={`feed-post-preview ${hasImageAttachment ? 'inverted-text' : ''}`}>
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