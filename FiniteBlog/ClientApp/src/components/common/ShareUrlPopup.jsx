import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';

const ShareUrlPopup = ({ isVisible, onClose, postSlug }) => {
  const [copied, setCopied] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [currentView, setCurrentView] = useState('share'); // 'share' or 'qr'
  const qrCanvasRef = useRef(null);
  
  if (!isVisible && !isClosing) return null;

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      setCurrentView('share'); // Reset to share view for next time
      onClose();
    }, 300); // Match the animation duration
  };

  const handleDownloadQR = () => {
    if (qrCanvasRef.current) {
      const canvas = qrCanvasRef.current;
      const link = document.createElement('a');
      link.download = `qr-code-${postSlug}.png`;
      link.href = canvas.toDataURL();
      link.click();
    }
  };
  
  const fullUrl = `wypri.com/${postSlug}`;
  const title = "Check out this disappearing post on Wypri!";
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = fullUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSocialShare = (platform) => {
    switch (platform) {
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(fullUrl)}&text=${encodeURIComponent(title)}`, '_blank');
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}`, '_blank');
        break;
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(fullUrl)}`, '_blank');
        break;
      case 'email':
        window.open(`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent('Check out this post that will disappear after being viewed: ' + fullUrl)}`, '_blank');
        break;
      case 'instagram':
        // Copy URL to clipboard and try to open Instagram story camera
        navigator.clipboard.writeText(fullUrl).then(() => {
          // Try to open Instagram app to story camera first
          const instagramAppLink = 'instagram://story-camera';
          const instagramWebLink = 'https://www.instagram.com/stories/camera/';
          
          // Create a temporary link to test if Instagram app is available
          const tempLink = document.createElement('a');
          tempLink.href = instagramAppLink;
          
          // Try app first, fallback to web
          try {
            window.location.href = instagramAppLink;
            // Fallback to web after a short delay if app doesn't open
            setTimeout(() => {
              window.open(instagramWebLink, '_blank');
            }, 1000);
          } catch (err) {
            window.open(instagramWebLink, '_blank');
          }
        }).catch(() => {
          // Still try to open Instagram even if copy failed
          try {
            window.location.href = 'instagram://story-camera';
            setTimeout(() => {
              window.open('https://www.instagram.com/stories/camera/', '_blank');
            }, 1000);
          } catch (err) {
            window.open('https://www.instagram.com/stories/camera/', '_blank');
          }
        });
        break;
      default:
        break;
    }
  };
  
  const popupContent = (
    <div className={`popup-overlay ${isClosing ? 'closing' : ''}`} onClick={handleClose}>
      <div className="popup-container" onClick={(e) => e.stopPropagation()}>
        <div className="popup-content">
          {currentView === 'share' ? (
            // Share View
            <>
              <p>Share this link to let others view your post:</p>
              
              <div className="url-container">
                <div className="url-display">
                  {fullUrl}
                </div>
                <button 
                  onClick={handleCopy}
                  className={`copy-button ${copied ? 'copied' : ''}`}
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>

              <div className="social-share-buttons">
                <button 
                  onClick={() => handleSocialShare('twitter')}
                  className="social-button twitter"
                >
                  Twitter
                </button>
                <button 
                  onClick={() => handleSocialShare('facebook')}
                  className="social-button facebook"
                >
                  Facebook
                </button>
                <button 
                  onClick={() => handleSocialShare('linkedin')}
                  className="social-button linkedin"
                >
                  LinkedIn
                </button>
                <button 
                  onClick={() => handleSocialShare('instagram')}
                  className="social-button instagram"
                >
                  Instagram
                </button>
                <button 
                  onClick={() => handleSocialShare('email')}
                  className="social-button email"
                >
                  Email
                </button>
                <button 
                  onClick={() => setCurrentView('qr')}
                  className="social-button qr-button"
                >
                  QR Code
                </button>
                <button onClick={handleClose} className="social-button close-button">
                  Close
                </button>
              </div>
            </>
          ) : (
            // QR Code View
            <>
              <div className="qr-container">
                <div className="qr-code-wrapper">
                  <QRCodeSVG 
                    value={fullUrl}
                    size={250}
                    level="M"
                    includeMargin={true}
                    title="Scan to access this post"
                  />
                  {/* Hidden canvas for download functionality */}
                  <QRCodeCanvas 
                    ref={qrCanvasRef}
                    value={fullUrl}
                    size={400}
                    level="M"
                    includeMargin={true}
                    style={{ display: 'none' }}
                  />
                </div>
              </div>
              
              <div className="qr-actions">
                <button 
                  onClick={handleDownloadQR}
                  className="download-button"
                >
                  Download QR Code
                </button>
                <button 
                  onClick={() => setCurrentView('share')}
                  className="back-button"
                >
                  Back
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );

  // Use createPortal to render at document.body level
  return createPortal(popupContent, document.body);
};

export default ShareUrlPopup; 