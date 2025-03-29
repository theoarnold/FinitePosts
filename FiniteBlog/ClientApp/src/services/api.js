import axios from 'axios';

// API base URL for direct calls - adjust based on environment
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
  ? 'http://localhost:5206' 
  : window.location.origin;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Accept': 'application/json'
  },
  withCredentials: true
});

export const postService = {
  getPost: async (slug, signal) => {
    try {
      const response = await api.get(`/api/posts/${slug}`, { signal });
      return { data: response.data, error: null };
    } catch (error) {
      if (error.name === 'CanceledError') {
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
  }
}; 