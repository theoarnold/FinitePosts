import React from 'react';
import { useNavigate } from 'react-router-dom';

const FeedHeader = ({ onWriteClick }) => {
    const navigate = useNavigate();

    const handleWriteClick = () => {
        onWriteClick?.();
        navigate('/write');
    };

    return (
        <div className="feed-header">
            <div className="write-post-container">
                <button 
                    className="write-post-button" 
                    onClick={handleWriteClick}
                >
                    Write a post
                </button>
            </div>
        </div>
    );
};

export default FeedHeader; 