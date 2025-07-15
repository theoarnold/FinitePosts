import React, { memo, useState, useEffect } from 'react';

const ReceivedAnnotations = memo(({ annotations, targetElementRef, showAnnotations = true }) => {
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [isMobile, setIsMobile] = useState(false);

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Update canvas size when target element changes
  useEffect(() => {
    if (targetElementRef?.current) {
      const updateSize = () => {
        const rect = targetElementRef.current.getBoundingClientRect();
        setCanvasSize({
          width: rect.width || 800,
          height: rect.height || 600
        });
      };

      updateSize();
      window.addEventListener('resize', updateSize);
      return () => window.removeEventListener('resize', updateSize);
    }
  }, [targetElementRef]);

  if (!targetElementRef?.current || annotations.length === 0 || !showAnnotations) {
    return null;
  }

  // Calculate font size: 24px on desktop, 19px on mobile (20% smaller)
  const fontSize = isMobile ? '19px' : '24px';

  return (
    <div className="received-annotations-overlay annotation-fade-in">
      {annotations.map((annotation, index) => (
        <div
          key={`annotation-${index}-${annotation.createdAt || Date.now()}`}
          style={{
            position: 'absolute',
            left: `${annotation.positionX}%`,
            top: `${annotation.positionY}%`,
            transform: 'translate(0%, -50%)',
            color: '#a8263a',
            fontWeight: 'bold',
            fontSize: fontSize,
            textShadow: '2px 2px 6px rgba(255,255,255,1), 1px 1px 2px rgba(255,255,255,1)',
            pointerEvents: 'none',
            zIndex: 3,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'clip',
            opacity: 0.95,
            userSelect: 'none',
            WebkitUserSelect: 'none',
            MozUserSelect: 'none',
            msUserSelect: 'none',
            WebkitTouchCallout: 'none',
            width: `${Math.min(60, 100 - annotation.positionX - 2)}%`,
            maxWidth: `${100 - annotation.positionX - 2}%`,
            boxSizing: 'border-box'
          }}
        >
          {annotation.text}
        </div>
      ))}
    </div>
  );
});

ReceivedAnnotations.displayName = 'ReceivedAnnotations';

export default ReceivedAnnotations; 