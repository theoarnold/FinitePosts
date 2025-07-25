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
      
      // Store current scroll position before any changes
      const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;
      
      // Reset height to get the correct scrollHeight
      textarea.style.height = 'auto';
      // Set the height to scrollHeight to expand the textarea
      const newHeight = Math.max(200, textarea.scrollHeight);
      textarea.style.height = `${newHeight}px`;
      
      // Get real-time cursor position and check if truly at the end
      const realCursorPosition = textarea.selectionStart;
      const isActuallyAtEnd = realCursorPosition === content.length && content.length > 0;
      
      // ONLY scroll if user is definitively typing at the absolute end
      if (isActuallyAtEnd) {
        // Immediate scroll to bottom to maintain 100% position during typing
        window.scrollTo({
          top: document.documentElement.scrollHeight,
          behavior: 'auto' // Instant scroll during typing
        });
        
        // Clear any existing scroll timeout
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
        
        // Debounced smooth scroll for final positioning
        scrollTimeoutRef.current = setTimeout(() => {
          window.scrollTo({
            top: document.documentElement.scrollHeight,
            behavior: 'smooth'
          });
        }, 150);
      } else {
        // When not at the end, restore the original scroll position
        // to prevent browser from auto-scrolling to cursor
        window.scrollTo({
          top: currentScrollTop,
          behavior: 'auto'
        });
      }
    }, 16); // ~60fps debouncing to reduce INP
  }, [content]);

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

  // Mobile detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  }, []);

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