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
                
                const result = await postService.getPost(slug, abortControllerRef.current.signal);
                
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
                    
                    // Check if this is a fresh visitor and set viewer number
                    if (loading) {
                        const viewerKey = `viewer-number-${slug}`;
                        const savedViewerNumber = localStorage.getItem(viewerKey);
                        
                        if (savedViewerNumber) {
                            setViewerNumber(parseInt(savedViewerNumber));
                        } else {
                            localStorage.setItem(viewerKey, result.data.currentViews.toString());
                            setViewerNumber(result.data.currentViews);
                        }
                        
                        setLoading(false);
                    }
                }
            } catch (err) {
                // Handle aborted requests
                if (err.name === 'AbortError') {
                    return;
                }
                
                console.error('Error fetching post:', err);
                setError('An error occurred while fetching the post');
                setLoading(false);
            }
        };

        fetchPost();

        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [slug, loading]);

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