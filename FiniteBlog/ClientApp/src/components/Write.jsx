import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import PostForm from './PostForm/PostForm';

// API base URL for direct calls
const API_BASE_URL = 'https://wypriback-hdcta5aregafawbq.uksouth-01.azurewebsites.net';

const Write = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (postData, validationError) => {
    // Handle validation errors
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!postData) {
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Create form data if there's a file
      let requestData;
      let headers = { 'Content-Type': 'application/json' };
      
      if (postData.file) {
        // Use FormData to handle file upload
        const formData = new FormData();
        formData.append('content', postData.content);
        formData.append('viewLimit', postData.viewLimit);
        formData.append('file', postData.file);
        
        requestData = formData;
        // Let axios set the correct content type with boundary
        headers = {};
      } else {
        // Regular JSON submission without file
        requestData = {
          content: postData.content,
          viewLimit: postData.viewLimit
        };
      }
      
      // Use the full URL to ensure it goes to the right place
      const response = await axios.post(`${API_BASE_URL}/api/posts`, requestData, {
        headers: headers
      });
      
      if (response.data && response.data.slug) {
        // Navigate to the post page
        navigate(`/${response.data.slug}`);
      } else {
        setError('Received an invalid response from the server');
        setIsSubmitting(false);
      }
    } catch (err) {
      if (err.response) {
        setError(typeof err.response.data === 'string' ? err.response.data : `Server error: ${err.response.status}`);
      } else if (err.request) {
        setError('No response received from server. Please check your connection.');
      } else {
        setError('An error occurred while creating the post: ' + err.message);
      }
      setIsSubmitting(false);
    }
  };

  return (
    <PostForm 
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      error={error}
    />
  );
};

export default Write; 