import React, { useState, useRef, useCallback, memo } from 'react';
import ViewLimitSlider from './ViewLimitSlider';
import PostTextArea from './TextArea';

const PostForm = memo(({ onSubmit, isSubmitting, error }) => {
  const [content, setContent] = useState('');
  const [viewLimit, setViewLimit] = useState(15);
  const fileInputRef = useRef(null);

  const handleSubmit = useCallback(() => {
    // Allow empty content if a file is attached
    if (!content.trim() && !fileInputRef.current.files.length) {
      // Display error in parent component
      onSubmit(null, 'Please add text or attach a file');
      return;
    }

    if (viewLimit <= 0) {
      onSubmit(null, 'View limit must be greater than 0');
      return;
    }

    // Create post data
    const postData = {
      content: content.trim(),
      viewLimit: viewLimit,
      file: fileInputRef.current.files[0] || null
    };

    // Submit to parent component
    onSubmit(postData);
  }, [content, viewLimit, onSubmit]);

  const handleViewLimitChange = useCallback((newViewLimit) => {
    setViewLimit(newViewLimit);
  }, []);

  const handleContentChange = useCallback((newContent) => {
    setContent(newContent);
  }, []);

  return (
    <div className="card post-form">
      <ViewLimitSlider 
        viewLimit={viewLimit} 
        onViewLimitChange={handleViewLimitChange} 
      />
      
      {error && <div className="error-message">{error}</div>}
      
      <PostTextArea 
        content={content}
        onContentChange={handleContentChange}
        viewLimit={viewLimit}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
        fileInputRef={fileInputRef}
      />
    </div>
  );
});

PostForm.displayName = 'PostForm';

export default PostForm; 