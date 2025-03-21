import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// API base URL for direct calls
const API_BASE_URL = 'http://127.0.0.1:5206';

const Home = () => {
  const [content, setContent] = useState('');
  const [viewLimit, setViewLimit] = useState(15);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [tempViewLimit, setTempViewLimit] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef(null);
  const navigate = useNavigate();

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      // Reset height to get the correct scrollHeight
      textareaRef.current.style.height = 'auto';
      // Set the height to scrollHeight to expand the textarea
      textareaRef.current.style.height = `${Math.max(200, textareaRef.current.scrollHeight)}px`;
    }
  }, [content]);

  const incrementViewLimit = () => {
    setViewLimit(prev => Math.min(prev + 1, 10000));
  };

  const decrementViewLimit = () => {
    setViewLimit(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!content.trim()) {
      setError('Content cannot be empty');
      return;
    }

    if (viewLimit <= 0) {
      setError('View limit must be greater than 0');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      console.log(`Submitting post to ${API_BASE_URL}/api/posts`);
      
      // Use the full URL to ensure it goes to the right place
      const response = await axios.post(`${API_BASE_URL}/api/posts`, {
        content,
        viewLimit
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Response:', response.data);
      
      if (response.data && response.data.slug) {
        // Navigate to the post page
        navigate(`/${response.data.slug}`);
      } else {
        console.error('Invalid response format - missing slug:', response.data);
        setError('Received an invalid response from the server');
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error('Error creating post:', err);
      
      if (err.response) {
        console.error('Error response:', err.response);
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        setError(typeof err.response.data === 'string' 
          ? err.response.data 
          : `Server error: ${err.response.status}`);
      } else if (err.request) {
        // The request was made but no response was received
        console.error('No response received:', err.request);
        setError('No response received from server. Please check your connection.');
      } else {
        // Something happened in setting up the request that triggered an Error
        setError('An error occurred while creating the post: ' + err.message);
      }
      
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card">
      <div style={{ 
        fontSize: '0.9rem', 
        margin: '0 0 1rem 0', 
        color: '#666',
        lineHeight: '1.4',
        fontWeight: 'normal'
      }}>
        <div style={{ 
          backgroundColor: '#f7f7f7',
          padding: '0.75rem',
          paddingTop: '0.5rem',
          borderRadius: '8px',
          marginBottom: '0.5rem',
          border: '1px solid #ddd'
        }}>
          <p style={{ 
            marginBottom: '0.25rem',
            marginTop: '0.25rem',
            fontSize: '1rem'
          }}>Share content that disappears after:</p>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div className="view-limit-controls">
              <button 
                type="button" 
                onClick={decrementViewLimit}
                className="view-limit-btn decrement"
                aria-label="Decrease view limit"
              >−</button>
              <input
                type="number"
                value={isFocused ? tempViewLimit : viewLimit}
                onChange={(e) => setTempViewLimit(e.target.value)}
                onFocus={() => {
                  setTempViewLimit('');
                  setIsFocused(true);
                }}
                onBlur={() => {
                  setIsFocused(false);
                  if (tempViewLimit === '' || isNaN(parseInt(tempViewLimit))) {
                    // If empty or not a number, keep original value
                    setTempViewLimit('');
                  } else {
                    // Update the actual viewLimit with the new value (constrained between 1 and 10000)
                    const newValue = Math.max(1, Math.min(10000, parseInt(tempViewLimit)));
                    setViewLimit(newValue);
                    setTempViewLimit('');
                  }
                }}
                min="1"
                max="10000"
                required
                className="view-limit-input"
                style={{ 
                  width: `${Math.max((isFocused ? tempViewLimit : viewLimit).toString().length * 16 + 16, 80)}px`,
                  lineHeight: '36px',
                  textAlign: 'center'
                }}
                aria-label="View limit"
              />
              <button 
                type="button" 
                onClick={incrementViewLimit}
                className="view-limit-btn increment"
                aria-label="Increase view limit"
              >+</button>
            </div>{" "}
            <span style={{ fontWeight: 'bold', marginLeft: '8px' }}>views</span>
          </div>
        </div>
      </div>
      
      {error && <div style={{ 
        color: '#e74c3c', 
        marginBottom: '1rem', 
        padding: '0.75rem', 
        backgroundColor: 'rgba(231, 76, 60, 0.1)',
        borderRadius: '6px',
        fontWeight: 'bold'
      }}>{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div>
          <textarea
            ref={textareaRef}
            placeholder={`Write to ${viewLimit} people here...`}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            autoFocus
            autoComplete="off"
            autoCorrect="on"
            spellCheck="true"
          />
        </div>
        
        {content.trim().length > 0 && (
          <button 
            type="submit" 
            disabled={isSubmitting} 
            className="post-button"
            style={{
              maxWidth: '200px',
              width: '100%',
              marginTop: '0.5rem',
              marginLeft: 'auto',
              display: 'block'
            }}
          >
            {isSubmitting ? 'Posting...' : 'Post'}
          </button>
        )}
      </form>
    </div>
  );
};

export default Home; 