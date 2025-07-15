import { useEffect, useRef } from 'react';
import { useFeedData } from './FeedDataProvider';

const FeedAutoScroll = ({ feedRef, onScrollNearBottom }) => {
    const { posts, isRestored, checkAndFetchMore } = useFeedData();
    
    const scrollIntervalRef = useRef(null);
    const autoScrollStarted = useRef(false);
    const isUserScrollingRef = useRef(false);

    // Simple auto-scroll functionality
    const startAutoScroll = () => {
        if (!feedRef.current) {
            return;
        }
        
        if (scrollIntervalRef.current) {
            clearInterval(scrollIntervalRef.current);
        }
        
        isUserScrollingRef.current = false;
        autoScrollStarted.current = true;
        
        scrollIntervalRef.current = setInterval(() => {
            if (feedRef.current && !isUserScrollingRef.current) {
                const feedElement = feedRef.current;
                
                // Auto-scroll (slightly faster for better visibility)
                feedElement.scrollTop += 2;
                
                // Check if we need more posts when approaching the bottom
                const distanceFromBottom = feedElement.scrollHeight - feedElement.scrollTop - feedElement.clientHeight;
                
                // Load posts much earlier and more aggressively for fast scrolling
                checkAndFetchMore(distanceFromBottom);
                
                // Notify parent about scroll position
                onScrollNearBottom?.(distanceFromBottom);
            }
        }, 30); // Slightly slower interval for smoother animation
    };

    const stopAutoScroll = () => {
        if (scrollIntervalRef.current) {
            clearInterval(scrollIntervalRef.current);
            scrollIntervalRef.current = null;
        }
    };

    const pauseAutoScroll = () => {
        isUserScrollingRef.current = true;
    };

    const resumeAutoScroll = () => {
        isUserScrollingRef.current = false;
        if (!scrollIntervalRef.current) {
            startAutoScroll();
        }
    };

    // Start auto-scroll when posts are loaded
    useEffect(() => {
        if (posts.length > 0) {
            // If restored from saved state, delay auto-scroll longer to let user see familiar position
            const delay = isRestored ? 3000 : 100;
            setTimeout(() => {
                startAutoScroll();
            }, delay);
        }
    }, [posts, isRestored]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopAutoScroll();
        };
    }, []);

    return {
        startAutoScroll,
        stopAutoScroll,
        pauseAutoScroll,
        resumeAutoScroll,
        isAutoScrollActive: !!scrollIntervalRef.current,
        autoScrollStarted: autoScrollStarted.current
    };
};

export default FeedAutoScroll; 