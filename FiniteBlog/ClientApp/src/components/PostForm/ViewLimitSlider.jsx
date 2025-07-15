import React, { useRef, useState, useEffect, useCallback, memo } from 'react';

// Configuration for different view ranges
const VIEW_RANGES = {
  locked: [
    { min: 1, max: 100, sliderStart: 0, sliderEnd: 50, type: 'linear' },
    { min: 100, max: 1000, sliderStart: 50, sliderEnd: 100, type: 'exponential' }
  ],
  unlocked: [
    { min: 1, max: 100, sliderStart: 0, sliderEnd: 40, type: 'linear' },
    { min: 100, max: 1000, sliderStart: 40, sliderEnd: 70, type: 'exponential' },
    { min: 1000, max: 9999, sliderStart: 70, sliderEnd: 100, type: 'exponential' }
  ]
};

// Function to convert slider value (0-100) to view limit using a custom scale
const calculateViewLimit = (sliderValue, highRangeUnlocked) => {
  const ranges = VIEW_RANGES[highRangeUnlocked ? 'unlocked' : 'locked'];
  
  for (const range of ranges) {
    if (sliderValue >= range.sliderStart && sliderValue <= range.sliderEnd) {
      const progress = (sliderValue - range.sliderStart) / (range.sliderEnd - range.sliderStart);
      
      if (range.type === 'linear') {
        return Math.round(range.min + (progress * (range.max - range.min)));
      } else {
        // Exponential scaling for larger ranges
        const exponentialValue = range.min * Math.pow(range.max / range.min, progress);
        return range.min >= 1000 
          ? Math.min(range.max, Math.round(exponentialValue / 100) * 100) // Round to nearest 100 for 1000+ range
          : Math.round(exponentialValue / 10) * 10; // Round to nearest 10 for 100-1000 range
      }
    }
  }
  
  // Fallback (shouldn't happen)
  return 1;
};

// Function to convert view limit to slider position
const calculateSliderValue = (viewLimit, highRangeUnlocked) => {
  const ranges = VIEW_RANGES[highRangeUnlocked ? 'unlocked' : 'locked'];
  
  for (const range of ranges) {
    if (viewLimit >= range.min && viewLimit <= range.max) {
      if (range.type === 'linear') {
        const progress = (viewLimit - range.min) / (range.max - range.min);
        return Math.round(range.sliderStart + (progress * (range.sliderEnd - range.sliderStart)));
      } else {
        // Inverse exponential scaling
        const progress = Math.log(viewLimit / range.min) / Math.log(range.max / range.min);
        return Math.round(range.sliderStart + (progress * (range.sliderEnd - range.sliderStart)));
      }
    }
  }
  
  // Fallback (shouldn't happen)
  return 0;
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