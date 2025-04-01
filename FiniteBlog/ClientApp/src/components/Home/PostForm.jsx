import React, { useState, useRef } from 'react';
import ViewLimitSlider from './ViewLimitSlider';
import PostTextArea from './PostTextArea';

const PostForm = ({ onSubmit, isSubmitting, error }) => {
  const [content, setContent] = useState('');
  const [viewLimit, setViewLimit] = useState(15);
  const fileInputRef = useRef(null);

  const handleSubmit = () => {
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
  };

  const handleViewLimitChange = (newViewLimit) => {
    setViewLimit(newViewLimit);
  };

  const handleContentChange = (newContent) => {
    setContent(newContent);
  };

  return (
    <div className="card">
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
};

export default PostForm; 