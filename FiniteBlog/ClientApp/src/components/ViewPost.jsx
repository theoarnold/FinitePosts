import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import * as signalR from '@microsoft/signalr';
import ShareOptions from './common/ShareOptions';
import ViewCounter from './common/ViewCounter';

// API base URL for direct calls - adjust based on environment
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
  ? 'http://localhost:5206' 
  : window.location.origin; // Use the same origin as the frontend when not on localhost

console.log('Current hostname:', window.location.hostname);
console.log('API Base URL:', API_BASE_URL);

const ViewPost = () => {
  const { slug } = useParams();
  console.log('Current slug:', slug);
  const [post, setPost] = useState(null);
  const [error, setError] = useState('');
  const [isDeleted, setIsDeleted] = useState(false);
  const [viewerNumber, setViewerNumber] = useState(null);
  const [currentViews, setCurrentViews] = useState(0);
  const [activeViewers, setActiveViewers] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasFetched, setHasFetched] = useState(false);
  const connectionRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Initial post fetch
  useEffect(() => {
    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    // Reset states when slug changes
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
    console.log('Request headers:', {
      'Accept': 'application/json',
      'withCredentials': true
    });
    
    axios.get(apiUrl, {
      headers: { 
        'Accept': 'application/json'
      },
      withCredentials: true,
      signal: abortControllerRef.current.signal
    })
    .then(response => {
      console.log('Post data received:', response.data);
      
      // Set post data - set all state values here to display immediately
      setPost(response.data);
      setCurrentViews(response.data.currentViews);
      setActiveViewers(response.data.activeViewers || 0); // Ensure active viewers is initialized
      
      // Set viewer number
      const storageKey = `viewer-number-${slug}`;
      const savedViewerNumber = localStorage.getItem(storageKey);
      
      if (savedViewerNumber) {
        setViewerNumber(parseInt(savedViewerNumber));
      } else {
        // Only set a new viewer number if we don't have one stored
        const newViewerNumber = response.data.currentViews;
        localStorage.setItem(storageKey, newViewerNumber.toString());
        setViewerNumber(newViewerNumber);
      }
      
      // Set up SignalR connection immediately
      setupSignalR(response.data);
      
      setHasFetched(true);
    })
    .catch(err => {
      // Don't show error if the request was cancelled
      if (err.name === 'CanceledError') {
        console.log('Request cancelled');
        return;
      }

      console.error('Error fetching post:', err);
      console.error('Error details:', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
        config: {
          url: err.config?.url,
          method: err.config?.method,
          headers: err.config?.headers
        }
      });
      
      if (err.response && err.response.status === 404) {
        setIsDeleted(true);
      } else {
        setError(`Error loading post: ${err.message}`);
      }
    })
    .finally(() => {
      setIsLoading(false);
    });

    // Cleanup function
    return () => {
      // Cancel any pending request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Clean up SignalR connection if it exists
      if (connectionRef.current?.state === signalR.HubConnectionState.Connected) {
        if (connectionRef.current.intervalId) {
          clearInterval(connectionRef.current.intervalId);
        }
        connectionRef.current.invoke("LeavePostGroup", slug)
          .then(() => connectionRef.current.stop())
          .catch(err => console.error("Error during cleanup:", err));
      }
    };
  }, [slug]); // Only depend on slug changes
  
  const setupSignalR = (postData) => {
    // If we already have a connection, don't create a new one
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
    
    // Set up regular polling for active viewers count
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
        
        // Initial request for viewer count
        pollViewerCount();
        
        // Set up regular polling every 30 seconds instead of 10
        const intervalId = setInterval(pollViewerCount, 30000);
        
        // Store the interval ID for cleanup
        connection.intervalId = intervalId;
      })
      .catch(err => {
        console.error("SignalR connection error:", err);
        setTimeout(() => setupSignalR(postData), 5000);
      });
      
    return () => {
      if (connection.state === signalR.HubConnectionState.Connected) {
        // Clear polling interval if it exists
        if (connection.intervalId) {
          clearInterval(connection.intervalId);
          console.log("Cleared viewer count polling interval");
        }
        
        connection.invoke("LeavePostGroup", slug)
          .then(() => connection.stop())
          .catch(err => console.error("Error during cleanup:", err));
      }
    };
  };

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
  }

  // Show immediately without loading state
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
    <div className="view-post-container">
      {isLoading && (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading post...</p>
        </div>
      )}
      
      {error && !isLoading && (
        <div className="error-container">
          <h2>Error</h2>
          <p>{error}</p>
          <Link to="/" className="home-link">Go back home</Link>
        </div>
      )}
      
      {isDeleted && !isLoading && (
        <div className="deleted-container">
          <h2>This post has expired</h2>
          <p>This post has reached its view limit and is no longer available.</p>
          <Link to="/" className="home-link">Create a new post</Link>
        </div>
      )}
      
      {post && !isLoading && !isDeleted && (
        <div className="post-content">
          <ViewCounter 
            currentViews={currentViews}
            viewLimit={post.viewLimit}
            activeViewers={activeViewers}
            viewerNumber={viewerNumber}
            hasFetched={hasFetched}
          />
          
          <div className="post-body" dangerouslySetInnerHTML={{ __html: post.content }}></div>
          
          <ShareOptions slug={slug} />
          
          <div className="post-footer">
            <div className="warning-text">
              <p>This post will self-destruct after {post.viewLimit} views.</p>
            </div>
            <Link to="/" className="home-link">Create your own post</Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewPost; 