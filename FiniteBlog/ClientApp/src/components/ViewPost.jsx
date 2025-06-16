
import React, { useState, useEffect, useRef, memo } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import signalRService from '../services/signalRService';
import PostStats from './ViewPost/PostStats';
import ShareButton from './ViewPost/ShareButton';
import PostFooter from './ViewPost/PostFooter';
import ShareUrlPopup from './common/ShareUrlPopup';
import ExpiredPost from './common/ExpiredPost';

// API base URL for direct calls
const API_BASE_URL = 'http://localhost:5206';

const ViewPost = memo(() => {
    const { slug } = useParams();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentViews, setCurrentViews] = useState(0);
    const [activeViewers, setActiveViewers] = useState(0);
    const [viewerNumber, setViewerNumber] = useState(null);
    const [isDeleted, setIsDeleted] = useState(false);
    const [error, setError] = useState('');
    const [showSharePopup, setShowSharePopup] = useState(false);
    
    const cancelTokenRef = useRef(null);
    const unsubscribeRef = useRef(null);
    const pollIntervalRef = useRef(null);

    // Setup SignalR subscription
    useEffect(() => {
        if (!slug) return;

        const handleSignalRUpdate = (eventType, data) => {
            if (eventType === 'viewUpdate') {
                if (data.currentViews !== undefined) {
                    setCurrentViews(data.currentViews);
                }
                if (data.activeViewers !== undefined) {
                    setActiveViewers(data.activeViewers);
                }
                if (data.currentViews !== undefined && data.viewLimit !== undefined && data.currentViews >= data.viewLimit) {
                    setIsDeleted(true);
                }
            } else if (eventType === 'viewerCount') {
                if (data.activeViewers !== undefined) {
                    setActiveViewers(data.activeViewers);
                }
            }
        };

        // Subscribe immediately for ViewPost (no delay)
        unsubscribeRef.current = signalRService.subscribeImmediate(slug, handleSignalRUpdate);

        // Poll for viewer count every 5 seconds
        pollIntervalRef.current = setInterval(() => {
            signalRService.requestViewerCount(slug);
        }, 5000);

        return () => {
            if (unsubscribeRef.current) {
                unsubscribeRef.current();
                unsubscribeRef.current = null;
            }
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
                pollIntervalRef.current = null;
            }
        };
    }, [slug]);

    // Fetch post data
    useEffect(() => {
        const fetchPost = async () => {
            try {
                // Create a cancel token for this request
                const source = axios.CancelToken.source();
                cancelTokenRef.current = source;
                
                const apiUrl = `${API_BASE_URL}/api/posts/${slug}`;
                
                const response = await axios.get(apiUrl, {
                    headers: { 'Accept': 'application/json' },
                    cancelToken: source.token
                });
                
                setPost(response.data);
                setCurrentViews(response.data.currentViews);
                setActiveViewers(response.data.activeViewers || 0);
                
                // Check if this is a fresh visitor and set viewer number
                if (loading) {
                    const viewerKey = `viewer-number-${slug}`;
                    const savedViewerNumber = localStorage.getItem(viewerKey);
                    
                    if (savedViewerNumber) {
                        setViewerNumber(parseInt(savedViewerNumber));
                    } else {
                        localStorage.setItem(viewerKey, response.data.currentViews.toString());
                        setViewerNumber(response.data.currentViews);
                    }
                    
                    setLoading(false);
                }
            } catch (err) {
                if (axios.isCancel(err)) {
                    return;
                }
                
                if (err.response && err.response.status === 404) {
                    setIsDeleted(true);
                } else {
                    setError('An error occurred while fetching the post');
                }
                setLoading(false);
            }
        };

        fetchPost();

        return () => {
            if (cancelTokenRef.current) {
                cancelTokenRef.current.cancel('Component unmounted');
            }
        };
    }, [slug, loading]);

    if (loading) {
        return (
            <div className="card" style={{
                minHeight: '300px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
            }}>
                <div style={{ width: '8px', height: '8px', background: '#ddd', borderRadius: '50%' }}></div>
            </div>
        );
    }

    if (isDeleted) {
        return <ExpiredPost />;
    }

    if (error) {
        return (
            <div className="card">
                <h2>Error</h2>
                <p>{error}</p>
                <Link to="/" className="home-link">Go Home</Link>
            </div>
        );
    }

    if (!post) {
        return (
            <div className="card" style={{
                minHeight: '300px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
            }}>
                <div style={{ width: '8px', height: '8px', background: '#ddd', borderRadius: '50%' }}></div>
            </div>
        );
    }

    return (
        <div className="card post-card">
            <PostStats 
                viewerNumber={viewerNumber}
                viewLimit={post.viewLimit}
                activeViewers={activeViewers}
                currentViews={currentViews}
            />
            
            <Link to="/" className="home-link">
                &lt; HOME
            </Link>

            <div className="post-content">
                {post.content}
            </div>

            <ShareButton slug={slug} onShareClick={() => setShowSharePopup(true)} />
            
            <PostFooter 
                createdAt={post.createdAt}
                slug={slug}
            />

            {currentViews === post.viewLimit - 1 && (
                <p className="final-view-warning">
                    Warning: This is the last view. The post will be deleted after this.
                </p>
            )}

            <ShareUrlPopup 
                isVisible={showSharePopup}
                onClose={() => setShowSharePopup(false)}
                postSlug={slug}
            />
        </div>
    );
});

ViewPost.displayName = 'ViewPost';

export default ViewPost; 