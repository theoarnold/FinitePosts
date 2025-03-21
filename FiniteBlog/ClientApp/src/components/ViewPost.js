import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

// API base URL for direct calls
const API_BASE_URL = 'http://127.0.0.1:5206';

const ViewPost = () => {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDeleted, setIsDeleted] = useState(false);
  const [viewerNumber, setViewerNumber] = useState(null);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [copySuccess, setCopySuccess] = useState('');
  const [isExpanding, setIsExpanding] = useState(false);
  const shareDropdownRef = useRef(null);

  const fetchPost = async () => {
    try {
      console.log('Fetching post with slug:', slug);
      const response = await axios.get(`${API_BASE_URL}/api/posts/${slug}`, {
        headers: {
          'Accept': 'application/json'
        }
      });
      console.log('Post data received:', response.data);
      setPost(response.data);
      
      // Handle personal viewer number (only on first load)
      if (loading) {
        const storageKey = `viewer-number-${slug}`;
        const savedViewerNumber = localStorage.getItem(storageKey);
        
        if (savedViewerNumber) {
          setViewerNumber(parseInt(savedViewerNumber));
        } else {
          // If this is the first time viewing, save the current viewer number
          localStorage.setItem(storageKey, response.data.currentViews.toString());
          setViewerNumber(response.data.currentViews);
        }
        
        setLoading(false);
      }
    } catch (err) {
      console.error('Error fetching post:', err);
      if (err.response && err.response.status === 404) {
        setIsDeleted(true);
      } else {
        setError('An error occurred while fetching the post');
      }
      setLoading(false);
    }
  };

  // Handle click outside to close share dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (shareDropdownRef.current && !shareDropdownRef.current.contains(event.target)) {
        setShowShareOptions(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [shareDropdownRef]);

  // Function to trigger expansion animation
  useEffect(() => {
    if (showShareOptions) {
      // Short delay before starting expansion
      const timer = setTimeout(() => {
        setIsExpanding(true);
      }, 150);
      
      return () => clearTimeout(timer);
    } else {
      setIsExpanding(false);
    }
  }, [showShareOptions]);

  useEffect(() => {
    // Initial fetch
    fetchPost();
    
    // Set up polling for real-time updates
    const pollingInterval = setInterval(() => {
      if (!isDeleted) {
        fetchPost();
      }
    }, 3000); // Poll every 3 seconds
    
    // Clean up interval on component unmount
    return () => clearInterval(pollingInterval);
  }, [slug, isDeleted]);

  const handleShare = (platform) => {
    const url = window.location.href;
    const title = "Check out this disappearing post on FiniteBlog!";
    
    switch(platform) {
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`, '_blank');
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'email':
        window.open(`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent('Check out this post that will disappear after being viewed: ' + url)}`, '_blank');
        break;
      case 'copy':
        navigator.clipboard.writeText(url).then(() => {
          setCopySuccess('Copied!');
          setTimeout(() => {
            setCopySuccess('');
          }, 2000);
        }, (err) => {
          console.error('Could not copy text: ', err);
        });
        break;
      default:
        break;
    }
    
    setShowShareOptions(false);
  };

  if (loading) {
    return <div className="card">Loading...</div>;
  }

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

  return (
    <div className="card">
      
      {viewerNumber !== null && (
        <div className="personal-viewer-counter">
          <span style={{ fontSize: '1.1rem' }}>You are viewer {viewerNumber}/{post.viewLimit}</span>
        </div>
      )}
      
      <div style={{ whiteSpace: 'pre-wrap', marginBottom: '2rem' }}>{post.content}</div>    
      
      <div className="share-container" ref={shareDropdownRef} style={{ margin: '0.5rem 0' }}>
        <button 
          className="share-button" 
          onClick={() => setShowShareOptions(!showShareOptions)}
        >
          Share
        </button>
        
        {showShareOptions && (
          <div className={`share-dropdown ${isExpanding ? 'expanding' : ''}`}>
            <div className="share-option twitter" onClick={() => handleShare('twitter')}>
              <span>Twitter</span>
            </div>
            <div className="share-option facebook" onClick={() => handleShare('facebook')}>
              <span>Facebook</span>
            </div>
            <div className="share-option linkedin" onClick={() => handleShare('linkedin')}>
              <span>LinkedIn</span>
            </div>
            <div className="share-option email" onClick={() => handleShare('email')}>
              <span>Email</span>
            </div>
            <div className="share-option copy" onClick={() => handleShare('copy')}>
              <span role="img" aria-label="copy" style={{ position: 'absolute', left: '25%', transform: 'translateX(-50%)' }}>📋</span>
              {copySuccess && <span style={{ color: 'green', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>{copySuccess}</span>}
            </div>
          </div>
        )}
      </div>
      
      <div className="view-counter" style={{ 
        marginTop: '1rem', 
        display: 'flex', 
        justifyContent: 'space-between',
        width: '100%'
      }}>
        <div style={{ fontSize: '13px' }}>Created: {new Date(post.createdAt).toLocaleString()}</div>
        <div style={{ fontSize: '13px' }}>Total views: {post.currentViews}/{post.viewLimit}</div>
      </div>
      {post.currentViews === post.viewLimit - 1 && (
        <p style={{ color: 'red', fontWeight: 'bold', textAlign: 'right', marginTop: '13px' }}>
          Warning: This is the last view. The post will be deleted after this.
        </p>
      )}
    </div>
  );
};

export default ViewPost; 