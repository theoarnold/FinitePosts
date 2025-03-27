import React, { useState, useRef, useEffect } from 'react';
import './ShareOptions.css';

const ShareOptions = ({ slug }) => {
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [copySuccess, setCopySuccess] = useState('');
  const [isExpanding, setIsExpanding] = useState(false);
  const shareDropdownRef = useRef(null);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (shareDropdownRef.current && !shareDropdownRef.current.contains(event.target)) {
        setShowShareOptions(false);
      }
    };

    // Add event listener when dropdown is shown
    if (showShareOptions) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    // Clean up the event listener
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showShareOptions]);

  // Animation effect when showing dropdown
  useEffect(() => {
    if (showShareOptions) {
      setIsExpanding(true);
      const timer = setTimeout(() => setIsExpanding(false), 300);
      return () => clearTimeout(timer);
    }
  }, [showShareOptions]);

  const handleShare = (platform) => {
    const url = window.location.href;
    let shareUrl;

    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent('Check out this post!')}`;
        window.open(shareUrl, '_blank');
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        window.open(shareUrl, '_blank');
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}`;
        window.open(shareUrl, '_blank');
        break;
      case 'email':
        shareUrl = `mailto:?subject=${encodeURIComponent('Check out this post!')}&body=${encodeURIComponent(`I thought you might be interested in this: ${url}`)}`;
        window.location.href = shareUrl;
        break;
      case 'copy':
        navigator.clipboard.writeText(url)
          .then(() => {
            setCopySuccess('Copied!');
            setTimeout(() => setCopySuccess(''), 2000);
          })
          .catch(err => {
            console.error('Could not copy text: ', err);
            setCopySuccess('Failed to copy');
          });
        break;
      default:
        break;
    }
  };

  return (
    <div className="share-container" ref={shareDropdownRef}>
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
            <span className="copy-icon">📋</span>
            {copySuccess && <span className="copy-success">{copySuccess}</span>}
          </div>
        </div>
      )}
    </div>
  );
};

export default ShareOptions; 