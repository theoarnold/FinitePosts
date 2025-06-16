<<<<<<< HEAD
import React from 'react';
import PostFeed from './Home/PostFeed';

const Home = () => {
  return <PostFeed />;
=======
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import PostForm from './Home/PostForm';

// API base URL for direct calls
const API_BASE_URL = 'http://127.0.0.1:5206';

const Home = () => {
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
      console.log(`Submitting post to ${API_BASE_URL}/api/posts`);
      
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
        
        console.log('Uploading with file:', postData.file.name);
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
      
      console.log('Response:', response.data);
      
      if (response.data && response.data.slug) {
        // Navigate to the post page
        navigate(`/${response.data.slug}`);
      } else {
        console.error('Invalid response format - missing slug:', response.data);
        setError('Received an invalid response from the server');
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error('Error creating post:', err);
      
      if (err.response) {
        console.error('Error response:', err.response);
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        setError(typeof err.response.data === 'string' 
          ? err.response.data 
          : `Server error: ${err.response.status}`);
      } else if (err.request) {
        // The request was made but no response was received
        console.error('No response received:', err.request);
        setError('No response received from server. Please check your connection.');
      } else {
        // Something happened in setting up the request that triggered an Error
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
>>>>>>> 5bcf2bdd885fff5f229a1603fbc60bc31a1a4a62
};

export default Home; 