import React, { memo } from 'react';

const DrawButton = memo(({ isDrawing, onToggleDrawing, onSubmitDrawing, disabled = false }) => {
  const handleClick = () => {
    if (disabled) return;
    onToggleDrawing && onToggleDrawing();
  };

  return (
    <div className="draw-container">
      <button
        className={`draw-button ${isDrawing ? 'drawing-mode' : ''} ${disabled ? 'disabled' : ''}`}
        onClick={handleClick}
        disabled={disabled}
      >
        Draw
      </button>
    </div>
  );
});

DrawButton.displayName = 'DrawButton';

export default DrawButton; 