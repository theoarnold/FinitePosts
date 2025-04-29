import React, { memo } from 'react';

const PostStats = memo(({ 
  viewerNumber, 
  viewLimit, 
  activeViewers, 
  currentViews 
}) => {
  if (viewerNumber === null) return null;

  return (
    <div className="personal-viewer-counter">
      <div className="stats-marquee">
        <div className="stats-marquee-content">
          {[...Array(3)].map((_, i) => (
            <React.Fragment key={i}>
              <span>You are viewer {viewerNumber}/{viewLimit}</span>
              <span className="stats-divider">|</span>
              <span>{activeViewers} {activeViewers === 1 ? 'Current Viewer' : 'Current Viewers'}</span>
              <span className="stats-divider">|</span>
              <span>{currentViews}/{viewLimit} Total views</span>
              <span className="diamond">◆</span>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
});

PostStats.displayName = 'PostStats';

export default PostStats; 