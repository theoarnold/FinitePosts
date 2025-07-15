import React, { useRef } from 'react';
import FeedDataProvider from './FeedDataProvider';
import FeedAutoScroll from './FeedAutoScroll';
import FeedUserInteraction from './FeedUserInteraction';
import FeedStatePersistence from './FeedStatePersistence';
import FeedHeader from './FeedHeader';
import FeedContent from './FeedContent';

const PostFeedContent = () => {
    const feedRef = useRef(null);

    // Set up state persistence
    const { saveFeedState, clearSavedState } = FeedStatePersistence({ feedRef });

    // Set up auto-scroll
    const autoScrollControls = FeedAutoScroll({ 
        feedRef, 
        onScrollNearBottom: (distanceFromBottom) => {
            // Additional logic for scroll position if needed
        }
    });

    // Set up user interaction detection
    FeedUserInteraction({ feedRef, autoScrollControls });

    // Handle post click - save state before navigation
    const handlePostClick = (slug) => {
        // Stop auto-scroll before saving state
        autoScrollControls.stopAutoScroll();
        saveFeedState();
    };

    // Handle write button click - clear saved state
    const handleWriteClick = () => {
        clearSavedState();
    };

    return (
        <div className="feed-container">
            <FeedHeader onWriteClick={handleWriteClick} />
            <FeedContent 
                feedRef={feedRef}
                onPostClick={handlePostClick}
            />
        </div>
    );
};

const PostFeed = () => {
    return (
        <FeedDataProvider>
            <PostFeedContent />
        </FeedDataProvider>
    );
};

export default PostFeed; 