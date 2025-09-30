import React, { useRef, useImperativeHandle, forwardRef, memo, useState, useEffect } from 'react';

const TextAnnotationCanvas = forwardRef(({ isVisible, onAnnotationChange, targetElementRef }, ref) => {
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [isAddingText, setIsAddingText] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [clickPosition, setClickPosition] = useState({ x: 0, y: 0, percentX: 0, percentY: 0 });
  const [pendingAnnotation, setPendingAnnotation] = useState(null);
  const textInputRef = useRef(null);

  useImperativeHandle(ref, () => ({
    clear: () => {
      setIsAddingText(false);
      setTextInput('');
      setPendingAnnotation(null);
    },
    getAnnotationData: () => {
      return pendingAnnotation;
    },
    loadAnnotationData: (data) => {
      // This component doesn't need to load data, it's for creating new annotations
    },
    undo: () => {
      setIsAddingText(false);
      setTextInput('');
      setPendingAnnotation(null);
    }
  }));

  // Update canvas size based on target element
  useEffect(() => {
    if (isVisible && targetElementRef?.current) {
      const updateSize = () => {
        const rect = targetElementRef.current.getBoundingClientRect();
        setCanvasSize({
          width: rect.width,
          height: rect.height
        });
      };

      updateSize();
      window.addEventListener('resize', updateSize);
      return () => window.removeEventListener('resize', updateSize);
    }
  }, [isVisible, targetElementRef]);

  // Focus text input when it appears
  useEffect(() => {
    if (isAddingText && textInputRef.current) {
      textInputRef.current.focus();
    }
  }, [isAddingText]);

  const handleCanvasClick = (event) => {
    if (isAddingText) return; // Don't place new annotations while editing

    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Convert to percentages for responsive positioning
    const percentX = (x / canvasSize.width) * 100;
    const percentY = (y / canvasSize.height) * 100;

    setClickPosition({ x, y, percentX, percentY });
    setIsAddingText(true);
    setTextInput('');
  };

  const handleTextSubmit = () => {
    if (textInput.trim()) {
      const annotation = {
        text: textInput.trim(),
        positionX: clickPosition.percentX,
        positionY: clickPosition.percentY
      };

      setPendingAnnotation(annotation);
      onAnnotationChange && onAnnotationChange(annotation);
    }
    
    setIsAddingText(false);
    setTextInput('');
  };

  const handleTextCancel = () => {
    setIsAddingText(false);
    setTextInput('');
  };

  if (!isVisible) return null;

  return (
    <div className="text-annotation-canvas-overlay">
      <div
        className="annotation-canvas"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: canvasSize.width,
          height: canvasSize.height,
          zIndex: 5,
          cursor: isAddingText ? 'default' : 'crosshair',
          pointerEvents: 'auto',
          background: 'transparent',
          overflow: 'hidden'
        }}
        onClick={handleCanvasClick}
      >


        {/* Inline text input - appears directly where annotation will be */}
        {isAddingText && (
          <input
            ref={textInputRef}
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                handleTextSubmit();
              } else if (event.key === 'Escape') {
                event.preventDefault();
                handleTextCancel();
              }
            }}
            onBlur={handleTextCancel}
            placeholder="Type annotation..."
            autoComplete="off"
            style={{
              position: 'absolute',
              left: `${clickPosition.percentX}%`,
              top: `${clickPosition.percentY}%`,
              transform: 'translate(0%, -50%)',
              border: 'none',
              outline: 'none',
              background: 'transparent',
              color: '#a8263a',
              fontWeight: 'bold',
              fontSize: window.innerWidth <= 768 ? '19px' : '24px',
              textShadow: '2px 2px 4px rgba(255,255,255,0.9)',
              opacity: 0.85,
              zIndex: 99999,
              width: `${Math.min(60, 100 - clickPosition.percentX - 2)}%`,
              maxWidth: `${100 - clickPosition.percentX - 2}%`,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'clip',
              boxSizing: 'border-box'
            }}
            maxLength={20}
          />
        )}

        {/* Removed pending preview to prevent flashing duplicate text after submit */}
      </div>
    </div>
  );
});

TextAnnotationCanvas.displayName = 'TextAnnotationCanvas';

export default memo(TextAnnotationCanvas); 