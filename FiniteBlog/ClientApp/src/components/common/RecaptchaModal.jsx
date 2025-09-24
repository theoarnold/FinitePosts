import React, { useRef, useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import ReCAPTCHA from 'react-google-recaptcha';

// Props:
// - isVisible: boolean
// - onClose: () => void
// - onVerified: (token: string) => void
// - siteKey: string
// - theme?: 'light' | 'dark'
const RecaptchaModal = ({ isVisible, onClose, onVerified, siteKey, theme = 'light' }) => {
  const [isClosing, setIsClosing] = useState(false);
  const recaptchaRef = useRef(null);

  const handleCancel = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 200);
  }, [onClose]);

  useEffect(() => {
    if (!isVisible) return;
    const onEsc = (e) => {
      if (e.key === 'Escape') {
        handleCancel();
      }
    };
    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [isVisible, handleCancel]);

  if (!isVisible && !isClosing) return null;

  const handleBackdrop = () => {
    handleCancel();
  };

  const handleChange = (token) => {
    if (token) {
      onVerified(token);
    }
  };

  const content = (
    <div className={`popup-overlay ${isClosing ? 'closing' : ''}`} onClick={handleBackdrop}>
      <div className="popup-container" onClick={(e) => e.stopPropagation()}>
        <div className="popup-content recaptcha-modal">
          <div className="recaptcha-header">
            <h3>Verification</h3>
          </div>
          <div className="recaptcha-body">
            <ReCAPTCHA
              ref={recaptchaRef}
              sitekey={siteKey}
              onChange={handleChange}
              theme={theme}
            />
          </div>
          <div className="recaptcha-actions">
            <button className="close-button" onClick={handleCancel}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
};

export default RecaptchaModal;


