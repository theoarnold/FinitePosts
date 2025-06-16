<<<<<<< HEAD
﻿import React, { useState, useEffect, useRef, memo } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import signalRService from '../services/signalRService';
=======
﻿import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import * as signalR from '@microsoft/signalr';
>>>>>>> 5bcf2bdd885fff5f229a1603fbc60bc31a1a4a62
import PostStats from './ViewPost/PostStats';
import ShareButton from './ViewPost/ShareButton';
import PostFooter from './ViewPost/PostFooter';
import ShareUrlPopup from './common/ShareUrlPopup';
<<<<<<< HEAD
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
=======

// API base URL for direct calls - adjust based on environment
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5206'
    : window.location.origin;

const ViewPost = memo(() => {
    const { slug } = useParams();
    const location = useLocation();
    const [post, setPost] = useState(null);
    const [error, setError] = useState('');
    const [isDeleted, setIsDeleted] = useState(false);
    const [viewerNumber, setViewerNumber] = useState(null);
    const [currentViews, setCurrentViews] = useState(0);
    const [activeViewers, setActiveViewers] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [hasFetched, setHasFetched] = useState(false);
    const [showSharePopup, setShowSharePopup] = useState(false);
    const connectionRef = useRef(null);
    const abortControllerRef = useRef(null);

    const setupSignalR = useCallback((postData) => {
        if (connectionRef.current?.state === signalR.HubConnectionState.Connected) {
            console.log("SignalR connection already exists");
            return;
        }

        console.log('Setting up SignalR connection');
        const connection = new signalR.HubConnectionBuilder()
            .withUrl(`${API_BASE_URL}/posthub`, { withCredentials: true })
            .withAutomaticReconnect()
            .build();

        connectionRef.current = connection;

        connection.on("ReceiveViewUpdate", (data) => {
            console.log("Received view update via SignalR:", data);

            if (data.currentViews !== undefined) {
                setCurrentViews(data.currentViews);
            }

            if (data.activeViewers !== undefined) {
                console.log("Setting active viewers:", data.activeViewers);
                setActiveViewers(data.activeViewers);
            }

            if (data.currentViews >= postData.viewLimit) {
                setIsDeleted(true);
            }
        });

        const pollViewerCount = () => {
            if (connection.state === signalR.HubConnectionState.Connected) {
                console.log("Polling for viewer count...");
                connection.invoke("RequestViewerCount", slug)
                    .then(() => console.log("Requested updated viewer count"))
                    .catch(err => console.error("Error requesting viewer count:", err));
            } else {
                console.warn("Cannot poll viewer count - connection not established");
            }
        };

        connection.start()
            .then(() => {
                console.log("SignalR connected");
                return connection.invoke("JoinPostGroup", slug);
            })
            .then(() => {
                console.log(`Joined group for post: ${slug}`);
                pollViewerCount();
                const intervalId = setInterval(pollViewerCount, 30000);
                connection.intervalId = intervalId;
            })
            .catch(err => {
                console.error("SignalR connection error:", err);
                setTimeout(() => setupSignalR(postData), 5000);
            });
    }, [slug]);

    useEffect(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        setPost(null);
        setError('');
        setIsDeleted(false);
        setViewerNumber(null);
        setCurrentViews(0);
        setActiveViewers(0);
        setIsLoading(true);
        setHasFetched(false);

        const apiUrl = `${API_BASE_URL}/api/posts/${slug}`;
        console.log('Fetching post from:', apiUrl);

        axios.get(apiUrl, {
            headers: {
                'Accept': 'application/json'
            },
            withCredentials: true,
            signal: abortControllerRef.current.signal
        })
            .then(response => {
                console.log('Post data received:', response.data);
                setPost(response.data);
                setCurrentViews(response.data.currentViews);
                setActiveViewers(response.data.activeViewers || 0);

                const storageKey = `viewer-number-${slug}`;
                const savedViewerNumber = localStorage.getItem(storageKey);

                if (savedViewerNumber) {
                    setViewerNumber(parseInt(savedViewerNumber));
                } else {
                    const newViewerNumber = response.data.currentViews;
                    localStorage.setItem(storageKey, newViewerNumber.toString());
                    setViewerNumber(newViewerNumber);
                }

                // Check if this is a new post (just created) by looking at the current views count
                // Show popup if this is a new view (currentViews <= 1) and we haven't seen this post before
                const isNewPost = response.data.currentViews <= 1 && !savedViewerNumber;
                console.log('Popup debug:', {
                    currentViews: response.data.currentViews,
                    savedViewerNumber: savedViewerNumber,
                    isNewPost: isNewPost,
                    slug: slug
                });
                
                if (isNewPost) {
                    console.log('Showing share popup for new post');
                    setShowSharePopup(true);
                } else {
                    console.log('Not showing popup:', { currentViews: response.data.currentViews, savedViewerNumber: !!savedViewerNumber });
                }

                setupSignalR(response.data);
                setHasFetched(true);
            })
            .catch(err => {
                if (err.name === 'CanceledError') {
                    console.log('Request cancelled');
                    return;
                }

                console.error('Error fetching post:', err);
                if (err.response && err.response.status === 404) {
                    setIsDeleted(true);
                } else {
                    setError(`Error loading post: ${err.message}`);
                }
            })
            .finally(() => {
                setIsLoading(false);
            });

        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }

            if (connectionRef.current?.state === signalR.HubConnectionState.Connected) {
                if (connectionRef.current.intervalId) {
                    clearInterval(connectionRef.current.intervalId);
                }
                connectionRef.current.invoke("LeavePostGroup", slug)
                    .then(() => connectionRef.current.stop())
                    .catch(err => console.error("Error during cleanup:", err));
            }
        };
    }, [slug, setupSignalR]);

    if (isDeleted) {
        return (
            <div className="card">
                <h2>Post Not Found</h2>
                <p>This post has either been viewed the maximum number of times or does not exist.</p>
                <Link to="/">
                    <button>Create New Post</button>
                </Link>
            </div>
        );
    }

    if (error) {
        return <div className="card">Error: {error}</div>;
>>>>>>> 5bcf2bdd885fff5f229a1603fbc60bc31a1a4a62
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
<<<<<<< HEAD
            
            <Link to="/" className="home-link">
                &lt; HOME
            </Link>
=======
>>>>>>> 5bcf2bdd885fff5f229a1603fbc60bc31a1a4a62

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