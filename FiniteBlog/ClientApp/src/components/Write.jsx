import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import PostForm from './PostForm/PostForm';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';

// API base URL for direct calls
const API_BASE_URL = 'https://wypriback-hdcta5aregafawbq.uksouth-01.azurewebsites.net';

const Write = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [pendingPostData, setPendingPostData] = useState(null);
  const { executeRecaptcha } = useGoogleReCaptcha();

  if (!process.env.REACT_APP_RECAPTCHA_SITE_KEY) {
    // eslint-disable-next-line no-console
    console.warn('REACT_APP_RECAPTCHA_SITE_KEY is not set. reCAPTCHA v3 will not load.');
  }

  // removed retry loop; we now execute immediately and fail fast if not ready

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

    setError('');
    setPendingPostData(postData);
    if (!executeRecaptcha) {
      // eslint-disable-next-line no-console
      if (!(window && window.grecaptcha)) {
        console.warn('grecaptcha global not present. Check that the script loaded and site key is valid.');
      }
      setError('reCAPTCHA not ready. Please reload and try again.');
      setPendingPostData(null);
      return;
    }

    try {
      const captchaToken = await executeRecaptcha('create_post');
      await handleCaptchaVerified(captchaToken);
    } catch (err) {
      setError('Failed to run reCAPTCHA. Please try again.');
      setPendingPostData(null);
    }
  };

  const handleCaptchaVerified = async (captchaToken) => {
    if (!pendingPostData) return;
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
    </>
  );
};

export default Write; 