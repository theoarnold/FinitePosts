import React, { memo } from 'react';
import Marquee from 'react-fast-marquee';

const PostStats = memo(({ 
  viewerNumber, 
  viewLimit, 
  activeViewers, 
  currentViews 
}) => {
  if (viewerNumber === null) return null;

  return (
    <div className="personal-viewer-counter">
      <div className="marquee-indicator">●</div>
      <div className="stats-marquee">
        <Marquee
          speed={50}
          gradient={false}
          className="stats-marquee-content"
          pauseOnHover={false}
          delay={0}
          loop={0}
          play={true}
          direction="left"
        >
          <span>Viewer {viewerNumber}/{viewLimit}</span>
          <span className="stats-divider">|</span>
          <span>{activeViewers} Here</span>
          <span className="stats-divider">|</span>
          <span>{currentViews}/{viewLimit} Views</span>
          <span className="diamond">◆</span>
          <span>Viewer {viewerNumber}/{viewLimit}</span>
          <span className="stats-divider">|</span>
          <span>{activeViewers} Here</span>
          <span className="stats-divider">|</span>
          <span>{currentViews}/{viewLimit} Views</span>
          <span className="diamond">◆</span>
        </Marquee>
      </div>
      <div className="marquee-progress-bar">
        <div 
          className="marquee-progress-fill"
          style={{ 
            clipPath: `inset(0 ${100 - (currentViews / viewLimit) * 100}% 0 0)`
          }}
        ></div>
      </div>
    </div>
  );
});

PostStats.displayName = 'PostStats';

export default PostStats; 