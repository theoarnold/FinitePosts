import { useEffect } from 'react';
import { useFeedData } from './FeedDataProvider';

const FeedStatePersistence = ({ feedRef }) => {
    const { posts, isRestored, setIsRestored } = useFeedData();

    // Handle scroll restoration when posts are restored
    useEffect(() => {
        if (isRestored && posts.length > 0) {
            const savedState = sessionStorage.getItem('feed-state');
            if (savedState) {
                try {
                    const feedState = JSON.parse(savedState);
                    
                    // Use requestAnimationFrame for better timing
                    const restoreScroll = () => {
                        if (feedRef.current && feedState.scrollTop !== undefined) {
                            requestAnimationFrame(() => {
                                feedRef.current.scrollTop = feedState.scrollTop;
                        
                                // Verify and try again if needed
                                if (feedRef.current.scrollTop !== feedState.scrollTop) {
                                    setTimeout(() => {
                                        requestAnimationFrame(() => {
                                            feedRef.current.scrollTop = feedState.scrollTop;
            
                                        });
                                    }, 100);
                                }
                            });
                        }
                    };
                    
                    // Try immediately and then with delays
                    restoreScroll();
                    setTimeout(restoreScroll, 50);
                    setTimeout(restoreScroll, 200);
                    
                    // Clear the saved state after restoration attempts
                    setTimeout(() => {
                        sessionStorage.removeItem('feed-state');
                    }, 400);
                    
                        } catch (e) {
            // Error during scroll restoration
        }
            }
        }
    }, [isRestored, posts, feedRef]);

    // Clear the restored flag after starting auto-scroll
    useEffect(() => {
        if (posts.length > 0 && isRestored) {
            const delay = 3000; // Match the auto-scroll delay for restored state
            setTimeout(() => {
                setIsRestored(false);
            }, delay + 100);
        }
    }, [posts, isRestored, setIsRestored]);

    // Save current feed state to sessionStorage
    const saveFeedState = () => {
        if (feedRef.current && posts.length > 0) {
            const feedState = {
                scrollTop: feedRef.current.scrollTop,
                posts: posts,
                timestamp: Date.now()
            };
            
            // Only save if we have a meaningful scroll position and posts
            if (feedState.scrollTop >= 0 && feedState.posts.length > 0) {
        
                sessionStorage.setItem('feed-state', JSON.stringify(feedState));
            }
        }
    };

    // Clear saved state
    const clearSavedState = () => {
        sessionStorage.removeItem('feed-state');
    };

    return {
        saveFeedState,
        clearSavedState
    };
};

export default FeedStatePersistence; 