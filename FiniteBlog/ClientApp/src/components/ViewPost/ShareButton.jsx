import React, { useState, useRef, useEffect, useCallback, memo } from 'react';

const ShareButton = memo(({ slug }) => {
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [copySuccess, setCopySuccess] = useState('');
  const [isExpanding, setIsExpanding] = useState(false);
  const shareDropdownRef = useRef(null);

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
  }, []);

  // Function to trigger expansion animation
  useEffect(() => {
    if (showShareOptions) {
      const timer = setTimeout(() => {
        setIsExpanding(true);
      }, 150);

      return () => clearTimeout(timer);
    } else {
      setIsExpanding(false);
    }
  }, [showShareOptions]);

  const handleShare = useCallback((platform) => {
    const url = window.location.href;
    const title = "Check out this disappearing post on FiniteBlog!";

    switch (platform) {
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
          setTimeout(() => setCopySuccess(''), 2000);
        }, (err) => {
          console.error('Could not copy text: ', err);
        });
        break;
      default:
        break;
    }

    setShowShareOptions(false);
  }, []);

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
            <span role="img" aria-label="copy" className="copy-icon">📋</span>
            {copySuccess && <span className="copy-success">{copySuccess}</span>}
          </div>
        </div>
      )}
    </div>
  );
});

ShareButton.displayName = 'ShareButton';

export default ShareButton; 