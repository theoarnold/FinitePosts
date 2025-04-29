import React, { memo } from 'react';

const PostFooter = memo(({ createdAt, slug }) => {
  return (
    <div className="post-footer">
      <div className="post-footer-content">
        <div>Created {new Date(createdAt).toLocaleString()}</div>
        <div>ID: {slug}</div>
      </div>
    </div>
  );
});

PostFooter.displayName = 'PostFooter';

export default PostFooter; 