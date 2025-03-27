import React from 'react';
import './ViewCounter.css';

const ViewCounter = ({ currentViews, viewLimit, activeViewers, viewerNumber, hasFetched }) => {
  return (
    <div className="post-header">
      <div className="post-stats">
        <div className="view-counter">
          <span className="view-count">{currentViews}</span>
          <span className="view-limit">/{viewLimit}</span>
          <span className="views-label">views</span>
        </div>
        
        {activeViewers > 0 && hasFetched && (
          <div className="active-viewers-counter">
            <span className="active-viewers-count">{activeViewers}</span>
            <span className="active-viewers-label">{activeViewers === 1 ? 'person' : 'people'} viewing now</span>
          </div>
        )}
      </div>
      
      {viewerNumber && (
        <div className="viewer-number">
          <span>You are viewer #{viewerNumber}</span>
        </div>
      )}
    </div>
  );
};

export default ViewCounter; 