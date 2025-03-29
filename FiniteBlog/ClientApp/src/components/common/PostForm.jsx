import React, { useRef, useState } from 'react';
import './PostForm.css';

const PostForm = ({ 
  content, 
  onContentChange, 
  onSubmit, 
  isSubmitting, 
  viewLimit,
  onFileAttach 
}) => {
  const [isTyping, setIsTyping] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [fileAttached, setFileAttached] = useState(false);
  const [fileName, setFileName] = useState('');

  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleContentChange = (e) => {
    const newContent = e.target.value;
    onContentChange(newContent);
    setIsTyping(newContent.length > 0);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFileAttached(true);
      setFileName(file.name);
      onFileAttach(file);
    }
  };

  const handleFileRemove = () => {
    setFileAttached(false);
    setFileName('');
    onFileAttach(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (content.trim().length > 0 || fileAttached) {
      onSubmit();
    }
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
          className={`text-input ${content ? '' : 'empty-textarea'}`}
          style={{ 
            paddingBottom: isTyping ? '65px' : '115px'
          }}
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
            {fileAttached && (
              <div className="file-info">
                <span className="file-name">{fileName}</span>
                <button 
                  type="button"
                  onClick={handleFileRemove}
                  className="remove-file-button"
                >
                  ×
                </button>
              </div>
            )}
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

export default PostForm; 