import React, { memo } from 'react';

const ShareButton = memo(({ onShareClick }) => {
    return (
        <div className="share-container">
            <button
                className="share-button"
                onClick={() => onShareClick && onShareClick()}
            >
                Share
            </button>
        </div>
    );
});

ShareButton.displayName = 'ShareButton';
export default ShareButton;