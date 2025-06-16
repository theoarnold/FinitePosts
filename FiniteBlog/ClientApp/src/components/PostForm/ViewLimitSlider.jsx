import React, { useRef, useState, useEffect, useCallback, memo } from 'react';

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

const ViewLimitSlider = memo(({ viewLimit, onViewLimitChange }) => {
  const [highRangeUnlocked, setHighRangeUnlocked] = useState(false);
  const [sliderValue, setSliderValue] = useState(calculateSliderValue(viewLimit, false));
  const [ignoreMouseMove, setIgnoreMouseMove] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [manualInputValue, setManualInputValue] = useState(viewLimit.toString());
  
  const sliderRef = useRef(null);

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

  // Auto-reset ignoreMouseMove after a short delay (fallback for mobile)
  useEffect(() => {
    if (ignoreMouseMove) {
      const timer = setTimeout(() => {
        setIgnoreMouseMove(false);
      }, 1000); // Reset after 1 second if user doesn't click
      
      return () => clearTimeout(timer);
    }
  }, [ignoreMouseMove]);

  // Update manual input value when viewLimit changes
  useEffect(() => {
    setManualInputValue(viewLimit.toString());
  }, [viewLimit]);

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
      onViewLimitChange(1000);
      
      // Set to exactly position 70 (start of 1000-10000 range)
      setSliderValue(70);
      
      // Set flag to ignore mouse movements until mouse is released and clicked again
      setIgnoreMouseMove(true);
      return;
    }
    
    onViewLimitChange(newViewLimit);
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

  // Handle touch events for mobile
  const handleSliderTouch = () => {
    // Same as click - reset ignoreMouseMove on touch
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
    onViewLimitChange(numValue);
    
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
    onViewLimitChange(numValue);
    setManualInputValue(numValue.toString());
  };

  return (
    <div className="content-container">
      <div className="slider-wrapper">
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
            onTouchStart={handleSliderTouch}
            onTouchEnd={handleSliderTouch}
            className={`view-limit-slider ${highRangeUnlocked ? 'unlocked' : 'locked'}`}
            aria-label="Set view limit"
          />
        </div>
        <div className="view-limit-value">
          <div className={`view-limit-track ${isMobile ? 'mobile' : 'desktop'}`}
            style={{
              transform: isMobile
                ? `translateX(${Math.min(55, sliderValue)}%)`
                : `translateX(${Math.min(77, sliderValue)}%)`
            }}
          >
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
  );
});

ViewLimitSlider.displayName = 'ViewLimitSlider';

export default ViewLimitSlider; 