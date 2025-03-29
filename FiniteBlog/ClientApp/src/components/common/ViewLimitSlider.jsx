import React, { useRef, useState, useEffect } from 'react';
import './ViewLimitSlider.css';

const ViewLimitSlider = ({ value, onChange }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [ignoreMouseMove, setIgnoreMouseMove] = useState(false);
  const [highRangeUnlocked, setHighRangeUnlocked] = useState(false);
  const [manualInputValue, setManualInputValue] = useState(value.toString());
  const sliderRef = useRef(null);

  useEffect(() => {
    // Check if device is mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    setManualInputValue(value.toString());
  }, [value]);

  const handleSliderChange = (e) => {
    const newValue = parseInt(e.target.value);
    setManualInputValue(newValue.toString());
    onChange(newValue);
  };

  const handleSliderMouseDown = () => {
    setIgnoreMouseMove(true);
  };

  const handleSliderMouseUp = () => {
    setIgnoreMouseMove(false);
  };

  const handleSliderClick = (e) => {
    const rect = sliderRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    const newValue = Math.round(percentage);
    setManualInputValue(newValue.toString());
    onChange(newValue);
  };

  const handleManualInputChange = (e) => {
    const newValue = e.target.value;
    setManualInputValue(newValue);
  };

  const handleManualInputBlur = () => {
    const newValue = parseInt(manualInputValue);
    if (isNaN(newValue) || newValue < 0) {
      setManualInputValue('0');
      onChange(0);
    } else if (newValue > 100) {
      setManualInputValue('100');
      onChange(100);
    } else {
      onChange(newValue);
    }
  };

  return (
    <div className="view-limit-container">
      <div className="view-limit-box">
        <div className="view-limit-content">
          <div className={`view-limit-slider-container ${ignoreMouseMove ? 'locked-input' : ''}`}>
            <input
              ref={sliderRef}
              type="range"
              min="0"
              max="100"
              value={value}
              onChange={handleSliderChange}
              onMouseDown={handleSliderMouseDown}
              onMouseUp={handleSliderMouseUp}
              onClick={handleSliderClick}
              className={`view-limit-slider ${highRangeUnlocked ? 'unlocked' : 'locked'}`}
              aria-label="Set view limit"
            />
          </div>
          <div className="view-limit-value">
            <div className="view-limit-input-container" style={{
              transform: isMobile
                ? `translateX(${Math.min(70, value)}%)`
                : `translateX(${Math.min(77, value)}%)`
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
  );
};

export default ViewLimitSlider; 