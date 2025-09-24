import React, { useState, useRef, useEffect, useCallback, memo, startTransition, useMemo } from 'react';

const PostTextArea = memo(({ 
  content, 
  onContentChange, 
  viewLimit, 
  isSubmitting, 
  onSubmit,
  fileInputRef
}) => {
  const [isTyping, setIsTyping] = useState(content.length > 0);
  const [fileAttached, setFileAttached] = useState(false);
  const [fileName, setFileName] = useState('');
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const scrollTimeoutRef = useRef(null);
  const scrollDebounceRef = useRef(null);
  
  const textareaRef = useRef(null);
  const buttonRef = useRef(null);
  
  // Auto-resize textarea based on content with debouncing
  useEffect(() => {
    if (!textareaRef.current) return;
    
    // Clear any existing debounce timeout
    if (scrollDebounceRef.current) {
      clearTimeout(scrollDebounceRef.current);
    }
    
    // Debounce the expensive operations to reduce INP
    scrollDebounceRef.current = setTimeout(() => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      // Reset height to get the correct scrollHeight
      textarea.style.height = 'auto';
      const newHeight = Math.max(200, textarea.scrollHeight);
      textarea.style.height = `${newHeight}px`;

      // Check if caret is truly at the end
      const realCursorPosition = textarea.selectionStart;
      const isActuallyAtEnd = realCursorPosition === content.length && content.length > 0;

      if (!isActuallyAtEnd) {
        // Do not force scroll when not at end (prevents jump back to top)
        return;
      }

      // Pin scroll to bottom after layout has applied
      const doScrollToBottom = () => {
        const scrollingElement = document.scrollingElement || document.documentElement;
        if (!scrollingElement) return;
        scrollingElement.scrollTo({
          top: scrollingElement.scrollHeight,
          behavior: 'auto'
        });
      };

      // Clear any existing scroll timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      // Use rAF to wait for layout, then scroll; do twice for stability
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          doScrollToBottom();
        });
      });

      // On mobile, keyboard animations can shift viewport; follow up with a delayed correction
      if (isMobile) {
        scrollTimeoutRef.current = setTimeout(() => {
          doScrollToBottom();
        }, 250);
      }
    }, 16); // ~60fps debouncing to reduce INP
  }, [content, isMobile]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      if (scrollDebounceRef.current) {
        clearTimeout(scrollDebounceRef.current);
      }
    };
  }, []);

  // Mobile detection and viewport handling
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    // Handle mobile keyboard show/hide events
    const handleViewportChange = () => {
      if (isMobile && textareaRef.current) {
        // Clear any pending scroll operations when viewport changes
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
        if (scrollDebounceRef.current) {
          clearTimeout(scrollDebounceRef.current);
        }
      }
    };
    
    window.addEventListener('resize', handleResize);
    window.addEventListener('resize', handleViewportChange);
    // iOS Safari fires orientationchange when keyboard shows/hides
    window.addEventListener('orientationchange', handleViewportChange);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('orientationchange', handleViewportChange);
    };
  }, [isMobile]);

  const handleContentChange = useCallback((e) => {
    const newValue = e.target.value;
    
    // Immediately update the content for responsive typing
    onContentChange(newValue);
    
    // Use startTransition for non-urgent state updates
    startTransition(() => {
      setIsTyping(newValue.length > 0);
    });
  }, [onContentChange]);

  const handleKeyDown = useCallback((e) => {
    // Handle keyboard shortcuts if needed
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      onSubmit();
    }
  }, [onSubmit]);

  const handleClick = useCallback((e) => {
    // Update cursor position on click
    if (isMobile) {
      // Clear any pending scroll operations on mobile when user taps
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      if (scrollDebounceRef.current) {
        clearTimeout(scrollDebounceRef.current);
      }
    }
  }, [isMobile]);

  const handleFileChange = useCallback((e) => {
    if (e.target.files && e.target.files[0]) {
      setFileAttached(true);
      setFileName(e.target.files[0].name);
    }
  }, []);

  const triggerFileInput = useCallback(() => {
    fileInputRef.current.click();
  }, [fileInputRef]);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    onSubmit();
  }, [onSubmit]);

  const handleMouseMove = useCallback((e) => {
    // Only track mouse when button is in large mode
    if (buttonRef.current && !isTyping) {
      const rect = buttonRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Text dimensions for centering and boundary checking
      const textWidth = 80; // approximate width of "IMAGE/AUDIO" text
      const textHeight = 20; // approximate height of text
      const leftPadding = 20;
      const rightPadding = 45;
      const topPadding = 15;
      const bottomPadding = 10;
      
      // Constrain within button bounds with custom padding
      const constrainedX = Math.max(leftPadding + textWidth/2, Math.min(x, rect.width - rightPadding - textWidth/2));
      const constrainedY = Math.max(topPadding + textHeight/2, Math.min(y, rect.height - bottomPadding - textHeight/2));
      
      setMousePosition({ x: constrainedX, y: constrainedY });
    }
  }, [isTyping]);

  const handleMouseLeave = useCallback(() => {
    setMousePosition({ x: 0, y: 0 });
  }, []);

  // Memoized word counting function
  const getWordCount = useMemo(() => {
    if (!content.trim()) return 0;
    return content.trim().split(/\s+/).length;
  }, [content]);

  return (
    <form onSubmit={handleSubmit}>
      <div className="textarea-container">
        <textarea
          ref={textareaRef}
          placeholder={`Share text with up to ${viewLimit} people...`}
          value={content}
          onChange={handleContentChange}
          onKeyDown={handleKeyDown}
          onClick={handleClick}
          autoFocus
          autoComplete="off"
          autoCorrect="on"
          spellCheck="true"
          inputMode="text"
          enterKeyHint="send"
          className={`text-input ${content ? '' : 'empty-textarea'} ${isTyping ? 'typing' : 'not-typing'}`}
        />

        <div className="buttons-container">
          <div className="button-wrapper">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/jpeg,image/png,image/gif,image/webp,audio/mpeg,audio/wav,audio/ogg,audio/mp4"
              style={{ display: 'none' }}
            />
            <button
              ref={buttonRef}
              type="button"
              onClick={triggerFileInput}
              className={`file-upload-button ${isTyping || (isMobile && fileAttached) ? 'shrink' : 'large'}`}
              title="Upload a file (text is required)"
              onMouseEnter={() => {}}
              onMouseLeave={() => {
                handleMouseLeave();
              }}
              onMouseMove={handleMouseMove}
            >
              <span 
                className="upload-text"
                style={isTyping ? {} : {
                  transform: (mousePosition.x !== 0 || mousePosition.y !== 0)
                    ? `translate(${mousePosition.x - 40}px, ${mousePosition.y - 10}px)` 
                    : 'translate(22px, 8px)'
                }}
              >
                {isMobile && fileAttached ? (
                  <span className="scrolling-filename">{fileName}</span>
                ) : 'IMAGE/AUDIO'}
              </span>
            </button>
            {fileAttached && !isMobile && <span className="file-name">{fileName}</span>}
          </div>

          {content.trim().length > 0 && (
            <div className="button-wrapper">
              {isTyping && (
                <div className="word-counter">
                  <div className="word-counter-content">
                    {getWordCount}{getWordCount < 100 && !isMobile && <span className="word-suffix">&nbsp;word{getWordCount !== 1 ? 's' : ''}</span>}
                  </div>
                </div>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className="post-button"
                aria-label={isSubmitting ? 'Posting...' : 'Post'}
              >
{isSubmitting ? 'POSTING...' : 'POST'}
              </button>
            </div>
          )}
        </div>
      </div>
    </form>
  );
});

PostTextArea.displayName = 'PostTextArea';

export default PostTextArea; 