import { useEffect, useRef } from 'react';
import { useFeedData } from './FeedDataProvider';

const FeedUserInteraction = ({ feedRef, autoScrollControls }) => {
    const { checkAndFetchMore } = useFeedData();
    const { pauseAutoScroll, resumeAutoScroll, autoScrollStarted } = autoScrollControls;
    
    const scrollTimeoutRef = useRef(null);
    const isManualScrollingRef = useRef(false);

    // Handle user interaction - pause auto-scroll
    const handleUserInteraction = () => {
        if (!autoScrollStarted) return;
        
        // Immediately pause auto-scroll
        pauseAutoScroll();
        isManualScrollingRef.current = true;
        
        if (scrollTimeoutRef.current) {
            clearTimeout(scrollTimeoutRef.current);
        }
        
        scrollTimeoutRef.current = setTimeout(() => {
            isManualScrollingRef.current = false;
            // Restart auto-scroll after user stops interacting
            resumeAutoScroll();
        }, 2000); // Give users more time before resuming auto-scroll
    };

    // Add user interaction event listeners to feed element
    useEffect(() => {
        const feedElement = feedRef.current;
        if (!feedElement) return;
        
        // Mouse events
        const handleMouseDown = () => {
            handleUserInteraction();
        };
        
        // Touch events for mobile
        const handleTouchStart = () => {
            handleUserInteraction();
        };
        
        // Direct user scroll events
        const handleWheel = (e) => {
            handleUserInteraction();
        };
        
        const handleTouchMove = () => {
            handleUserInteraction();
        };
        
        const handleKeyDown = (e) => {
            // Check for arrow keys, page up/down, home/end
            if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End'].includes(e.key)) {
                handleUserInteraction();
            }
        };
        
        // Add event listeners with appropriate options
        feedElement.addEventListener('wheel', handleWheel, { passive: false });
        feedElement.addEventListener('touchmove', handleTouchMove, { passive: false });
        feedElement.addEventListener('keydown', handleKeyDown);
        feedElement.addEventListener('mousedown', handleMouseDown);
        feedElement.addEventListener('touchstart', handleTouchStart);
        
        return () => {
            feedElement.removeEventListener('wheel', handleWheel);
            feedElement.removeEventListener('touchmove', handleTouchMove);
            feedElement.removeEventListener('keydown', handleKeyDown);
            feedElement.removeEventListener('mousedown', handleMouseDown);
            feedElement.removeEventListener('touchstart', handleTouchStart);
        };
    }, [feedRef, autoScrollStarted]);

    // Global event listeners to catch any user interaction
    useEffect(() => {
        const globalWheelHandler = (e) => {
            // Check if the event is within our feed element
            const feedElement = feedRef.current;
            if (feedElement && feedElement.contains(e.target)) {
                handleUserInteraction();
                
                // Also check if we need to load more posts during manual scrolling
                const distanceFromBottom = feedElement.scrollHeight - feedElement.scrollTop - feedElement.clientHeight;
                checkAndFetchMore(distanceFromBottom);
            }
        };

        const globalKeyHandler = (e) => {
            if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End'].includes(e.key)) {
                const feedElement = feedRef.current;
                if (feedElement && (document.activeElement === feedElement || feedElement.contains(document.activeElement))) {
                    handleUserInteraction();
                }
            }
        };

        window.addEventListener('wheel', globalWheelHandler, { passive: false });
        window.addEventListener('keydown', globalKeyHandler);

        return () => {
            window.removeEventListener('wheel', globalWheelHandler);
            window.removeEventListener('keydown', globalKeyHandler);
        };
    }, [feedRef, autoScrollStarted, checkAndFetchMore]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }
        };
    }, []);

    return {
        isManualScrolling: isManualScrollingRef.current
    };
};

export default FeedUserInteraction; 