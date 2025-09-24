import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import PostForm from './PostForm/PostForm';
import RecaptchaModal from '../components/common/RecaptchaModal';

// API base URL for direct calls
const API_BASE_URL = 'https://wypriback-hdcta5aregafawbq.uksouth-01.azurewebsites.net';

const Write = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [pendingPostData, setPendingPostData] = useState(null);
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

    // Trigger captcha flow first
    setError('');
    setPendingPostData(postData);
    setShowCaptcha(true);
  };

  const handleCaptchaCancel = () => {
    setShowCaptcha(false);
    setPendingPostData(null);
  };

  const handleCaptchaVerified = async (captchaToken) => {
    if (!pendingPostData) return;
    setShowCaptcha(false);
    setIsSubmitting(true);

    try {
      // Create form data if there's a file
      let requestData;
      let headers = { 'Content-Type': 'application/json' };
      
      if (pendingPostData.file) {
        // Use FormData to handle file upload
        const formData = new FormData();
        formData.append('content', pendingPostData.content);
        formData.append('viewLimit', pendingPostData.viewLimit);
        formData.append('file', pendingPostData.file);
        formData.append('captchaToken', captchaToken);
        
        requestData = formData;
        // Let axios set the correct content type with boundary
        headers = {};
      } else {
        // Regular JSON submission without file
        requestData = {
          content: pendingPostData.content,
          viewLimit: pendingPostData.viewLimit,
          captchaToken
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
    setPendingPostData(null);
  };

  return (
    <>
      <PostForm 
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        error={error}
      />
      <RecaptchaModal 
        isVisible={showCaptcha}
        onClose={handleCaptchaCancel}
        onVerified={handleCaptchaVerified}
        siteKey={"6Le5-NErAAAAADDoM6TL3hKn6kWABYaID2g50286"}
      />
    </>
  );
};

export default Write; 