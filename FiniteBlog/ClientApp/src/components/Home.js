import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// API base URL for direct calls
const API_BASE_URL = 'http://127.0.0.1:5206';

// Function to convert slider value (0-100) to view limit using a custom scale
const calculateViewLimit = (sliderValue, highRangeUnlocked) => {
  if (!highRangeUnlocked) {
    // With high range locked: 0-50 → 1-100, 50-100 → 100-1000
    if (sliderValue <= 50) {
      return Math.round(1 + ((sliderValue / 50) * 99));
    } else {
      const normalizedValue = (sliderValue - 50) / 50;
      const rawValue = 100 * Math.exp(Math.log(10) * normalizedValue);
      return Math.round(rawValue / 10) * 10;
    }
  } else {
    // With high range unlocked: 0-40 → 1-100, 40-70 → 100-1000, 70-100 → 1000-10000
    if (sliderValue <= 40) {
      return Math.round(1 + ((sliderValue / 40) * 99));
    } else if (sliderValue <= 70) {
      const normalizedValue = (sliderValue - 40) / 30;
      const rawValue = 100 * Math.exp(Math.log(10) * normalizedValue);
      return Math.round(rawValue / 10) * 10;
    } else {
      const normalizedValue = (sliderValue - 70) / 30;
      const rawValue = 1000 * Math.exp(Math.log(10) * normalizedValue);
      return Math.round(rawValue / 100) * 100;
    }
  }
};

// Function to convert view limit to slider position
const calculateSliderValue = (viewLimit, highRangeUnlocked) => {
  if (!highRangeUnlocked) {
    // With high range locked
    if (viewLimit <= 100) {
      return Math.round(((viewLimit - 1) / 99) * 50);
    } else {
      const roundedValue = Math.round(viewLimit / 10) * 10;
      const normalizedValue = Math.log(roundedValue / 100) / Math.log(10);
      return Math.round(50 + (normalizedValue * 50));
    }
  } else {
    // With high range unlocked
    if (viewLimit <= 100) {
      return Math.round(((viewLimit - 1) / 99) * 40);
    } else if (viewLimit <= 1000) {
      const roundedValue = Math.round(viewLimit / 10) * 10;
      const normalizedValue = Math.log(roundedValue / 100) / Math.log(10);
      return Math.round(40 + (normalizedValue * 30));
    } else {
      const roundedValue = Math.round(viewLimit / 100) * 100;
      const normalizedValue = Math.log(roundedValue / 1000) / Math.log(10);
      return Math.round(70 + (normalizedValue * 30));
    }
  }
};

const Home = () => {
  const [content, setContent] = useState('');
  const [viewLimit, setViewLimit] = useState(15);
  const [highRangeUnlocked, setHighRangeUnlocked] = useState(false);
  const [sliderValue, setSliderValue] = useState(calculateSliderValue(15, false));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [tempViewLimit, setTempViewLimit] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [fileAttached, setFileAttached] = useState(false);
  const [fileName, setFileName] = useState('');
  const [showTooltip, setShowTooltip] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [manualInputValue, setManualInputValue] = useState('15');
  const [isDragging, setIsDragging] = useState(false);
  const [ignoreMouseMove, setIgnoreMouseMove] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const sliderRef = useRef(null);
  const navigate = useNavigate();

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      // Reset height to get the correct scrollHeight
      textareaRef.current.style.height = 'auto';
      // Set the height to scrollHeight to expand the textarea
      textareaRef.current.style.height = `${Math.max(200, textareaRef.current.scrollHeight)}px`;
    }
    
    // Set typing state based on content
    setIsTyping(content.length > 0);
  }, [content]);
  
  // Detect mobile screen size
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Initial check
    checkIfMobile();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkIfMobile);
    
    // Clean up
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  // Add global mouse up event to handle when user releases mouse outside the slider
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
      }
    };
    
    // Add global event listeners
    document.addEventListener('mouseup', handleGlobalMouseUp);
    document.addEventListener('touchend', handleGlobalMouseUp);
    
    // Clean up event listeners
    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('touchend', handleGlobalMouseUp);
    };
  }, [isDragging]);

  // Update viewLimit when slider changes
  const handleSliderChange = (e) => {
    // If we're ignoring mouse movements, don't process changes
    if (ignoreMouseMove) {
      return;
    }
    
    const newSliderValue = parseInt(e.target.value);
    setSliderValue(newSliderValue);
    
    // Check if we need to unlock high range
    const newViewLimit = calculateViewLimit(newSliderValue, highRangeUnlocked);
    
    // Unlock high range if needed
    if (!highRangeUnlocked && newViewLimit >= 1000) {
      setHighRangeUnlocked(true);
      
      // Set to exactly 1000 when transitioning
      setViewLimit(1000);
      
      // Set to exactly position 70 (start of 1000-10000 range)
      setSliderValue(70);
      
      // Set flag to ignore mouse movements until mouse is released and clicked again
      setIgnoreMouseMove(true);
      return;
    }
    
    setViewLimit(newViewLimit);
  };
  
  // Handle mouse down on slider
  const handleSliderMouseDown = () => {
    setIsDragging(true);
  };
  
  // Handle mouse up on slider
  const handleSliderMouseUp = () => {
    setIsDragging(false);
    // If we're currently ignoring mouse movements, keep ignoring until clicked again
  };
  
  // Handle click on slider
  const handleSliderClick = () => {
    // When the user clicks after unlocking, start responding to mouse movements again
    if (ignoreMouseMove) {
      setIgnoreMouseMove(false);
    }
  };

  // Update slider and view limit when manually entering a value
  const handleManualInputChange = (e) => {
    const inputValue = e.target.value;
    setManualInputValue(inputValue);
    
    // Only process valid numbers
    if (inputValue === '' || isNaN(parseInt(inputValue))) {
      return;
    }
    
    const numValue = parseInt(inputValue);
    
    // Unlock high range if needed
    if (!highRangeUnlocked && numValue > 1000) {
      setHighRangeUnlocked(true);
    }
    
    // Set the view limit
    setViewLimit(numValue);
    
    // Update slider value based on the new view limit
    setSliderValue(calculateSliderValue(numValue, highRangeUnlocked));
  };
  
  // Handle manual input blur to validate the final value
  const handleManualInputBlur = () => {
    if (manualInputValue === '' || isNaN(parseInt(manualInputValue))) {
      // Reset to current viewLimit if invalid
      setManualInputValue(viewLimit.toString());
      return;
    }
    
    let numValue = parseInt(manualInputValue);
    
    // Enforce min/max range
    numValue = Math.max(1, Math.min(10000, numValue));
    
    // Update all states with the final validated value
    setViewLimit(numValue);
    setManualInputValue(numValue.toString());
  };

  // Update manual input value when viewLimit changes
  useEffect(() => {
    setManualInputValue(viewLimit.toString());
  }, [viewLimit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Allow empty content if a file is attached
    if (!content.trim() && !fileAttached) {
      setError('Please add text or attach a file');
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
      
      // Create form data if there's a file
      let requestData;
      let headers = { 'Content-Type': 'application/json' };
      
      if (fileAttached && fileInputRef.current.files.length > 0) {
        // Use FormData to handle file upload
        const formData = new FormData();
        formData.append('content', content);
        formData.append('viewLimit', viewLimit);
        formData.append('file', fileInputRef.current.files[0]);
        
        requestData = formData;
        // Let axios set the correct content type with boundary
        headers = {};
        
        console.log('Uploading with file:', fileInputRef.current.files[0].name);
      } else {
        // Regular JSON submission without file
        requestData = {
          content,
          viewLimit
        };
      }
      
      // Use the full URL to ensure it goes to the right place
      const response = await axios.post(`${API_BASE_URL}/api/posts`, requestData, {
        headers: headers
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

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFileAttached(true);
      setFileName(e.target.files[0].name);
      // Here you would typically upload the file to your server
      // For this example, we're just tracking that a file was selected
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const handleContentChange = (e) => {
    setContent(e.target.value);
  };

  return (
    <div className="card">
      <div style={{ 
        fontSize: '0.9rem', 
        margin: '0 0 1rem 0', 
        color: '#000',
        lineHeight: '1.4',
        fontWeight: 'normal',
        position: 'relative'
      }}>
        <div style={{ 
          backgroundColor: '#f0f0f0',
          padding: '0.75rem',
          paddingTop: '0.5rem',
          borderRadius: '8px',
          marginBottom: '0.75rem',
          border: '1px solid #ddd',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end'
        }}>
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column',
            width: '100%'
          }}>
            <div className={`view-limit-slider-container ${ignoreMouseMove ? 'locked-input' : ''}`}>
              <input
                ref={sliderRef}
                type="range"
                min="0"
                max="100"
                value={sliderValue}
                onChange={handleSliderChange}
                onMouseDown={handleSliderMouseDown}
                onMouseUp={handleSliderMouseUp}
                onClick={handleSliderClick}
                className={`view-limit-slider ${highRangeUnlocked ? 'unlocked' : 'locked'}`}
                aria-label="Set view limit"
              />
            </div>
            <div className="view-limit-value">
              <div style={{
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                transition: 'transform 0.3s ease',
                transform: isMobile
                  ? `translateX(${Math.min(70, sliderValue)}%)`
                  : `translateX(${Math.min(77, sliderValue)}%)`,
                whiteSpace: 'nowrap',
                width: '100%'
              }}>
                <input
                  type="text"
                  value={manualInputValue}
                  onChange={handleManualInputChange}
                  onBlur={handleManualInputBlur}
                  className="view-limit-input"
                  aria-label="Manually enter view limit"
                />
                <span className="view-limit-label">views</span>
              </div>
            </div>
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
        <div style={{ marginBottom: '1rem', position: 'relative' }}>
          <textarea
            ref={textareaRef}
            placeholder={`Share text or a file with up to ${viewLimit} people...`}
            value={content}
            onChange={handleContentChange}
            autoFocus
            autoComplete="off"
            autoCorrect="on"
            spellCheck="true"
            className={`text-input ${content ? '' : 'empty-textarea'}`}
            style={{ 
              paddingBottom: isTyping ? '65px' : '115px', 
              paddingLeft: '20px', 
              paddingRight: '20px',
              paddingTop: '20px',
              boxSizing: 'border-box'
            }}
          />
          
          <div className="buttons-container">
            <div className="button-wrapper">
              <input 
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <button 
                type="button"
                onClick={triggerFileInput}
                className={`file-upload-button ${isTyping ? 'shrink' : 'large'}`}
                title="Upload a file (can be posted without text)"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                style={{ opacity: 0.85, color: 'white', fontSize: '0.9rem' }}
              >
                File
              </button>
              {fileAttached && <span className="file-name">{fileName}</span>}
              {showTooltip && !fileAttached && (
                <div className="file-tooltip">
                  Upload a file - text is optional!
                </div>
              )}
            </div>
            
            {(content.trim().length > 0 || fileAttached) && (
              <div className="button-wrapper">
                <button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="post-button"
                  aria-label={isSubmitting ? 'Posting...' : 'Post'}
                >
                  {isSubmitting ? 'Posting...' : 'Post'}
                </button>
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default Home; 