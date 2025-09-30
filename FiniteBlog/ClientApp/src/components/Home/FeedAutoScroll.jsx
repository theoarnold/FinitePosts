import { useEffect, useRef, useCallback } from 'react';
import { useFeedData } from './FeedDataProvider';

const FeedAutoScroll = ({ feedRef, onScrollNearBottom }) => {
    const { posts, isRestored, checkAndFetchMore } = useFeedData();
    
    const scrollIntervalRef = useRef(null);
    const rafIdRef = useRef(null);
    const lastTimestampRef = useRef(null);
	const pixelsPerSecondRef = useRef(92.26);
    const isProgrammaticScrollRef = useRef(false);
    const autoScrollStarted = useRef(false);
    const isUserScrollingRef = useRef(false);
    const startDelayTimeoutRef = useRef(null);

    const startAutoScroll = useCallback(() => {
        if (!feedRef.current) {
            return;
        }

        if (scrollIntervalRef.current) {
            clearInterval(scrollIntervalRef.current);
        }

        isUserScrollingRef.current = false;
        autoScrollStarted.current = true;

        const step = (timestamp) => {
            const feedElement = feedRef.current;
            if (feedElement && !isUserScrollingRef.current) {
                if (lastTimestampRef.current !== null) {
                    const deltaMs = timestamp - lastTimestampRef.current;
                    const clampedDeltaMs = Math.min(deltaMs, 50);
                    const deltaPx = (pixelsPerSecondRef.current * clampedDeltaMs) / 1000;
                    const maxScrollTop = feedElement.scrollHeight - feedElement.clientHeight;
                    isProgrammaticScrollRef.current = true;
                    feedElement.scrollTop = Math.min(feedElement.scrollTop + deltaPx, maxScrollTop);

                    const distanceFromBottom = feedElement.scrollHeight - feedElement.scrollTop - feedElement.clientHeight;
                    checkAndFetchMore(distanceFromBottom);
                    onScrollNearBottom?.(distanceFromBottom);
                    // Reset the programmatic flag on the next frame so user scrolls are prioritized
                    window.requestAnimationFrame(() => { isProgrammaticScrollRef.current = false; });
                }
            }
            lastTimestampRef.current = timestamp;
            rafIdRef.current = window.requestAnimationFrame(step);
        };

        if (rafIdRef.current) {
            window.cancelAnimationFrame(rafIdRef.current);
            rafIdRef.current = null;
        }
        lastTimestampRef.current = null;
        rafIdRef.current = window.requestAnimationFrame(step);
    }, [feedRef, checkAndFetchMore, onScrollNearBottom]); // Add dependencies

    const stopAutoScroll = () => {
        if (scrollIntervalRef.current) {
            clearInterval(scrollIntervalRef.current);
            scrollIntervalRef.current = null;
        }
        if (rafIdRef.current) {
            window.cancelAnimationFrame(rafIdRef.current);
            rafIdRef.current = null;
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
            if (startDelayTimeoutRef.current) {
                clearTimeout(startDelayTimeoutRef.current);
            }
            startDelayTimeoutRef.current = setTimeout(() => {
                startDelayTimeoutRef.current = null;
                startAutoScroll();
            }, delay);
        }
    }, [posts, isRestored, startAutoScroll]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopAutoScroll();
            if (startDelayTimeoutRef.current) {
                clearTimeout(startDelayTimeoutRef.current);
                startDelayTimeoutRef.current = null;
            }
        };
    }, []);

    return {
        startAutoScroll,
        stopAutoScroll,
        pauseAutoScroll,
        resumeAutoScroll,
        isAutoScrollActive: !!rafIdRef.current,
        autoScrollStarted: autoScrollStarted.current,
        isProgrammaticScrollRef,
        cancelScheduledStart: () => {
            if (startDelayTimeoutRef.current) {
                clearTimeout(startDelayTimeoutRef.current);
                startDelayTimeoutRef.current = null;
            }
        },
        scheduleStartAfter: (ms) => {
            if (startDelayTimeoutRef.current) {
                clearTimeout(startDelayTimeoutRef.current);
            }
            startDelayTimeoutRef.current = setTimeout(() => {
                startDelayTimeoutRef.current = null;
                startAutoScroll();
            }, Math.max(0, ms || 0));
        }
    };
};

export default FeedAutoScroll; 