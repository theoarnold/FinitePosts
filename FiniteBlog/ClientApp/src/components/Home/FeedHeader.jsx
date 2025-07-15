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
            <button 
                className="write-post-button" 
                onClick={handleWriteClick}
            >
                Write a post
            </button>
        </div>
    );
};

export default FeedHeader; 