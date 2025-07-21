import React, { useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const FeedHeader = ({ onWriteClick }) => {
    const navigate = useNavigate();
    const touchHandled = useRef(false);

    const handleWriteClick = useCallback(() => {
        onWriteClick?.();
        navigate('/write');
    }, [onWriteClick, navigate]);

    // Optimized touch handler for mobile devices
    const handleTouchEnd = useCallback((e) => {
        e.preventDefault(); // Prevent the 300ms click delay
        touchHandled.current = true;
        handleWriteClick();
        
        // Reset the flag after a short delay
        setTimeout(() => {
            touchHandled.current = false;
        }, 300);
    }, [handleWriteClick]);

    // Only handle click if touch wasn't already handled
    const handleClick = useCallback((e) => {
        if (touchHandled.current) {
            e.preventDefault();
            return;
        }
        handleWriteClick();
    }, [handleWriteClick]);

    return (
        <div className="feed-header">
            <div className="write-post-container">
                <button 
                    className="write-post-button" 
                    onClick={handleClick}
                    onTouchEnd={handleTouchEnd}
                >
                    Write a post
                </button>
            </div>
        </div>
    );
};

export default FeedHeader; 