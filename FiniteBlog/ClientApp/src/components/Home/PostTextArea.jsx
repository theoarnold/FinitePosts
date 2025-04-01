import React, { useState, useRef, useEffect } from 'react';

const PostTextArea = ({ 
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
  const [showTooltip, setShowTooltip] = useState(false);
  
  const textareaRef = useRef(null);
  
  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      // Reset height to get the correct scrollHeight
      textareaRef.current.style.height = 'auto';
      // Set the height to scrollHeight to expand the textarea
      textareaRef.current.style.height = `${Math.max(200, textareaRef.current.scrollHeight)}px`;
    }
    
    // Set typing state based on content
    setIsTyping(content.length > 0);
  }, [content]);

  const handleContentChange = (e) => {
    onContentChange(e.target.value);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFileAttached(true);
      setFileName(e.target.files[0].name);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="textarea-container">
        <textarea
          ref={textareaRef}
          placeholder={`Share text or a file with up to ${viewLimit} people...`}
          value={content}
          onChange={handleContentChange}
          autoFocus
          autoComplete="off"
          autoCorrect="on"
          spellCheck="true"
          className={`text-input ${content ? '' : 'empty-textarea'} ${isTyping ? 'typing' : 'not-typing'}`}
        />

        <div className="buttons-container">
          <div className="button-wrapper">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <button
              type="button"
              onClick={triggerFileInput}
              className={`file-upload-button ${isTyping ? 'shrink' : 'large'}`}
              title="Upload a file (can be posted without text)"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
            >
              File
            </button>
            {fileAttached && <span className="file-name">{fileName}</span>}
            {showTooltip && !fileAttached && (
              <div className="file-tooltip">
                Upload a file - text is optional!
              </div>
            )}
          </div>

          {(content.trim().length > 0 || fileAttached) && (
            <div className="button-wrapper">
              <button
                type="submit"
                disabled={isSubmitting}
                className="post-button"
                aria-label={isSubmitting ? 'Posting...' : 'Post'}
              >
                {isSubmitting ? 'Posting...' : 'Post'}
              </button>
            </div>
          )}
        </div>
      </div>
    </form>
  );
};

export default PostTextArea; 