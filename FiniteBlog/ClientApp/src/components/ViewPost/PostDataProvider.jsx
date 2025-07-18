import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import { postService } from '../../services/api';

const PostDataContext = createContext();

export const usePostData = () => {
    const context = useContext(PostDataContext);
    if (!context) {
        throw new Error('usePostData must be used within a PostDataProvider');
    }
    return context;
};

const PostDataProvider = ({ slug, children }) => {
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isDeleted, setIsDeleted] = useState(false);
    const [currentViews, setCurrentViews] = useState(0);
    const [viewerNumber, setViewerNumber] = useState(null);
    
    const abortControllerRef = useRef(null);

    // Fetch post data
    useEffect(() => {
        const fetchPost = async () => {
            try {
                // Create an abort controller for this request
                abortControllerRef.current = new AbortController();
                
                // First, get post data without view counting for faster initial load
                const result = await postService.getPostData(slug, abortControllerRef.current.signal);
                
                if (result.error === 'NOT_FOUND') {
                    setIsDeleted(true);
                    setLoading(false);
                    return;
                }
                
                if (result.error) {
                    setError(result.error);
                    setLoading(false);
                    return;
                }
                
                if (result.data) {
                    setPost(result.data);
                    setCurrentViews(result.data.currentViews);
                    setLoading(false);
                    
                    // Process view count in the background (don't await this)
                    processViewCountInBackground();
                }
            } catch (err) {
                // Handle aborted requests
                if (err.name === 'AbortError') {
                    return;
                }
                
                // Error fetching post
                setError('Failed to load post');
                setLoading(false);
            }
        };

        const processViewCountInBackground = async () => {
            try {
                // Create a new abort controller for the view counting request
                const viewCountController = new AbortController();
                
                const viewResult = await postService.processPostView(slug, viewCountController.signal);
                
                if (viewResult.data) {
                    // Update the current views with the result from view counting
                    setCurrentViews(viewResult.data.currentViews);
                    
                    // Calculate viewer number AFTER view counting is processed
                    const viewerKey = `viewer-number-${slug}`;
                    const savedViewerNumber = localStorage.getItem(viewerKey);
                    
                    if (savedViewerNumber) {
                        setViewerNumber(parseInt(savedViewerNumber));
                    } else {
                        // Use the updated view count for viewer number calculation
                        localStorage.setItem(viewerKey, viewResult.data.currentViews.toString());
                        setViewerNumber(viewResult.data.currentViews);
                    }
                    
                    // If the post was deleted after reaching view limit
                    if (viewResult.data.isDeleted) {
                        setIsDeleted(true);
                    }
                }
            } catch (err) {
                // Silently handle view counting errors to not affect the user experience
                // The post content is already loaded, so view counting failures shouldn't break the UI
                if (err.name !== 'AbortError') {
                    // View counting failed
                }
            }
        };

        if (slug) {
            fetchPost();
        }

        // Cleanup function
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [slug]);

    const value = {
        post,
        loading,
        error,
        isDeleted,
        currentViews,
        setCurrentViews,
        viewerNumber,
        setIsDeleted
    };

    return (
        <PostDataContext.Provider value={value}>
            {children}
        </PostDataContext.Provider>
    );
};

export default PostDataProvider; 