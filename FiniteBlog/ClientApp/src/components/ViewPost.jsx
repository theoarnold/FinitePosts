import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { postService } from '../services/api';
import ExpiredPost from './common/ExpiredPost';
import PostContent from './common/PostContent';
import './ViewPost.css';

// API base URL for direct calls - adjust based on environment
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
  ? 'http://localhost:5206' 
  : window.location.origin;

console.log('Current hostname:', window.location.hostname);
console.log('API Base URL:', API_BASE_URL);

const ViewPost = () => {
  const { slug } = useParams();
  console.log('Current slug:', slug);
  const [post, setPost] = useState(null);
  const [error, setError] = useState('');
  const [isDeleted, setIsDeleted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
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
    setIsLoading(true);

    const fetchPost = async () => {
      const { data, error } = await postService.getPost(slug, abortControllerRef.current.signal);
      
      if (error === 'NOT_FOUND') {
        setIsDeleted(true);
      } else if (error) {
        setError(`Error loading post: ${error}`);
      } else {
        setPost(data);
      }
      
      setIsLoading(false);
    };

    fetchPost();

    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [slug]); // Only depend on slug changes

  if (isDeleted) {
    return <ExpiredPost />;
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
      
      {post && !isLoading && !isDeleted && (
        <PostContent post={post} slug={slug} />
      )}
    </div>
  );
};

export default ViewPost; 