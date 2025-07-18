import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import { getRandomPostsForFeed } from '../../services/api';

const FeedDataContext = createContext();

export const useFeedData = () => {
    const context = useContext(FeedDataContext);
    if (!context) {
        throw new Error('useFeedData must be used within a FeedDataProvider');
    }
    return context;
};

const FeedDataProvider = ({ children }) => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isRestored, setIsRestored] = useState(false);
    
    const isFetchingRef = useRef(false);
    const lastFetchTimeRef = useRef(0);

    // Function to fetch random posts
    const fetchPosts = async (append = false) => {
        if (isFetchingRef.current) {
            return;
        }
        
        isFetchingRef.current = true;
        
        try {
            // Fetch larger batches for faster loading
            const batchSize = append ? 25 : 30;
            const response = await getRandomPostsForFeed(batchSize);
            
            if (!response || !Array.isArray(response) || response.length === 0) {
                setError('No posts available');
                return;
            }
            
            if (append) {
                setPosts(prevPosts => {
                    // Remove duplicates
                    const existingSlugs = new Set(prevPosts.map(p => p.slug));
                    const newPosts = response.filter(post => !existingSlugs.has(post.slug));
                    
                    return [...prevPosts, ...newPosts];
                });
            } else {
                setPosts(response);
            }
            
            setError('');
        } catch (err) {
            setError('Failed to load posts');
        } finally {
            setLoading(false);
            isFetchingRef.current = false;
        }
    };

    // Check if we need more posts (for infinite scroll)
    const checkAndFetchMore = (distanceFromBottom) => {
        const now = Date.now();
        const shouldFetch = distanceFromBottom < 1500 && 
                           !isFetchingRef.current && 
                           (now - lastFetchTimeRef.current) > 200;
                           
        if (shouldFetch) {
            lastFetchTimeRef.current = now;
            fetchPosts(true);
        }
    };

    // Restore posts from sessionStorage if available
    const restoreFromSession = () => {
        const savedState = sessionStorage.getItem('feed-state');
        if (savedState) {
            try {
                const feedState = JSON.parse(savedState);
                // Check if the saved state is recent (within last 10 minutes)
                const isRecent = feedState.timestamp && (Date.now() - feedState.timestamp) < 10 * 60 * 1000;
                
                if (isRecent && feedState.posts && feedState.posts.length > 0) {
            
                    setPosts(feedState.posts);
                    setIsRestored(true);
                    setLoading(false);
                    return true;
                } else {
                    // Clear old or invalid saved state
                    sessionStorage.removeItem('feed-state');
                }
            } catch (e) {
                // Error parsing saved feed state
                sessionStorage.removeItem('feed-state');
            }
        }
        return false;
    };

    // Initialize component
    useEffect(() => {
        // Try to restore from session, if that fails fetch fresh posts
        if (!restoreFromSession()) {
            fetchPosts();
        }
    }, []);

    const value = {
        posts,
        loading,
        error,
        isRestored,
        setIsRestored,
        fetchPosts,
        checkAndFetchMore
    };

    return (
        <FeedDataContext.Provider value={value}>
            {children}
        </FeedDataContext.Provider>
    );
};

export default FeedDataProvider; 