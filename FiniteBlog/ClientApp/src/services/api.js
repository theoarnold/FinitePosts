import axios from 'axios';
import fingerprintService from './fingerprint';

const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
  ? 'http://localhost:5206' 
  : window.location.origin;

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true
});

// Helper function to determine if a request needs fingerprinting
const needsFingerprint = (config) => {
  const { method, url } = config;
  
  // Only GET and POST requests to posts endpoints need fingerprinting
  if (!url || !url.includes('/posts/')) {
    return false;
  }
  
  // POST requests for view counting always need fingerprinting
  if (method === 'post' && url.includes('/view')) {
    return true;
  }
  
  // GET requests for individual posts need fingerprinting (for view counting)
  if (method === 'get' && url.includes('/posts/') && !url.includes('/data')) {
    return true;
  }
  
  // Feed requests and data-only requests don't need fingerprinting
  return false;
};

api.interceptors.request.use(
  async (config) => {
    if (needsFingerprint(config)) {
      try {
        const deviceFingerprint = await fingerprintService.getFingerprint();
        config.params = config.params || {};
        config.params.deviceFingerprint = deviceFingerprint;
      } catch (error) {
        console.warn('Failed to get fingerprint:', error);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const postService = {
  getPost: async (slug, signal) => {
    try {
      const response = await api.get(`/posts/${slug}`, { signal });
      return { data: response.data, error: null };
    } catch (error) {
      if (error.name === 'CanceledError' || error.name === 'AbortError') {
        return { data: null, error: null };
      }

      if (error.response?.status === 404) {
        return { data: null, error: 'NOT_FOUND' };
      }

      return { 
        data: null, 
        error: error.message || 'An error occurred while fetching the post'
      };
    }
  },

  getPostData: async (slug, signal) => {
    try {
      const response = await api.get(`/posts/${slug}/data`, { signal });
      return { data: response.data, error: null };
    } catch (error) {
      if (error.name === 'CanceledError' || error.name === 'AbortError') {
        return { data: null, error: null };
      }

      if (error.response?.status === 404) {
        return { data: null, error: 'NOT_FOUND' };
      }

      return { 
        data: null, 
        error: error.message || 'An error occurred while fetching the post data'
      };
    }
  },

  processPostView: async (slug, signal) => {
    try {
      const response = await api.post(`/posts/${slug}/view`, {}, { signal });
      return { data: response.data, error: null };
    } catch (error) {
      if (error.name === 'CanceledError' || error.name === 'AbortError') {
        return { data: null, error: null };
      }

      if (error.response?.status === 404) {
        return { data: null, error: 'NOT_FOUND' };
      }

      return { 
        data: null, 
        error: error.message || 'An error occurred while processing the view'
      };
    }
  }
};

export const createPost = async (postData) => {
  const formData = new FormData();
  formData.append('content', postData.content || '');
  formData.append('viewLimit', postData.viewLimit.toString());
  
  if (postData.file) {
    formData.append('file', postData.file);
  }

  const response = await api.post('/posts', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const getViewCount = async (slug) => {
  const response = await api.get(`/posts/${slug}/view-count`);
  return response.data;
};

export const getRandomPostsForFeed = async (count = 5) => {
  const url = `/posts?count=${count}`;
  
  const response = await api.get(url);
  return response.data;
};

export default api; 