import React, { memo } from 'react';
import TimeAgo from 'react-timeago';

const PostFooter = memo(({ createdAt, slug }) => {
  return (
    <div className="post-footer">
      <div className="post-footer-content">
        <div><TimeAgo date={createdAt} /></div>
        <div>{slug}</div>
      </div>
    </div>
  );
});

PostFooter.displayName = 'PostFooter';

export default PostFooter; 