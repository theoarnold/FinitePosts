import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import FeedPost from './FeedPost';
import FeedState from './FeedState';
import { formatTimeAgo } from '../../utils/timeUtils';
import { useVisiblePosts } from '../../hooks/useVisiblePosts';
import { useFeedSignalR } from '../../hooks/useFeedSignalR';

// API base URL for direct calls
const API_BASE_URL = 'http://localhost:5206';

const PostFeed = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const feedRef = useRef(null);
  const navigate = useNavigate();
  const scrollIntervalRef = useRef(null);
  const scrollTimeoutRef = useRef(null);
  const isUserScrollingRef = useRef(false);
  const isAutoScrollingRef = useRef(false);
  const lastFetchTime = useRef(0);
  const isFetchingRef = useRef(false);
  const autoScrollStarted = useRef(false);

  // Track visible posts for SignalR subscriptions
  const { visiblePosts, registerPostElement, unregisterPostElement } = useVisiblePosts(posts, 0.7);
  
  // Handle view count updates from SignalR
  const handleViewCountUpdate = useCallback((slug, updateData) => {
    setPosts(currentPosts => 
      currentPosts.map(post => 
        post.slug === slug 
          ? { 
              ...post, 
              currentViews: updateData.currentViews ?? post.currentViews,
              activeViewers: updateData.activeViewers ?? post.activeViewers
            }
          : post
      )
    );
  }, []);

  // Set up SignalR for visible posts
  useFeedSignalR(visiblePosts, handleViewCountUpdate);

  // Function to fetch random posts
  const fetchPosts = async (append = false) => {
    // Prevent multiple simultaneous fetches
    if (isFetchingRef.current) {
      return;
    }
    
    // Add minimum delay between fetches (2 seconds)
    const now = Date.now();
    if (now - lastFetchTime.current < 2000) {
      console.log('[PostFeed] Fetch throttled - too soon since last fetch');
      return;
    }
    
    isFetchingRef.current = true;
    console.log('[PostFeed] Fetching posts, append:', append);
    
    try {
      // Fetch fewer posts at once to reduce load
      const response = await axios.get(`${API_BASE_URL}/api/posts?count=5`);
      
      console.log('[PostFeed] API response received:', response.data);
      console.log('[PostFeed] Response data length:', response.data?.length);
      
      if (append) {
        setPosts(prevPosts => {
          const newPosts = [...prevPosts, ...response.data];
          // Update sessionStorage with new posts
          sessionStorage.setItem('feedPosts', JSON.stringify(newPosts));
          console.log('[PostFeed] Appended posts, total now:', newPosts.length);
          return newPosts;
        });
      } else {
        setPosts(response.data);
        // Save posts to sessionStorage for persistence
        sessionStorage.setItem('feedPosts', JSON.stringify(response.data));
        console.log('[PostFeed] Set initial posts:', response.data.length);
      }
      
      setError('');
      lastFetchTime.current = Date.now();
    } catch (err) {
      console.error('[PostFeed] Error fetching posts:', err);
      setError('Failed to load posts');
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  };

    // Auto-scroll functionality with post management
  const startAutoScroll = () => {
    if (!feedRef.current) {
      return;
    }
    
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
    }
    
    // Reset user scrolling flag to ensure auto-scroll can start
    isUserScrollingRef.current = false;
    autoScrollStarted.current = true;
    
    scrollIntervalRef.current = setInterval(() => {
      if (feedRef.current) {
        const feedElement = feedRef.current;
        
        if (!isUserScrollingRef.current) {
          // Mark that we're auto-scrolling to ignore the scroll event
          isAutoScrollingRef.current = true;
          
          // Scroll down slower - 0.5 pixel instead of 1 pixel for smoother experience
          feedElement.scrollTop += 0.5;
          
          // Reset auto-scrolling flag after a brief delay
          setTimeout(() => {
            isAutoScrollingRef.current = false;
          }, 20);
          
          // Check if we're near the bottom and need more posts
          const distanceFromBottom = feedElement.scrollHeight - feedElement.scrollTop - feedElement.clientHeight;
          
          // Reduce threshold to 500px instead of 2000px - only fetch when actually near bottom
          if (distanceFromBottom < 500 && !isFetchingRef.current) {
            console.log('[PostFeed] Near bottom, fetching more posts. Distance:', distanceFromBottom);
            fetchPosts(true);
          }
          
          // Save current scroll position less frequently
          if (Math.floor(feedElement.scrollTop) % 10 === 0) {
            sessionStorage.setItem('feedScrollPosition', feedElement.scrollTop.toString());
          }
          
          // Clean up old posts less aggressively - only when we have 30+ posts
          if (posts.length > 30) {
            cleanupOldPosts();
          }
        }
      } else {
        clearInterval(scrollIntervalRef.current);
      }
    }, 50); // Reduced frequency from 33ms to 50ms (20fps instead of 30fps)
  };

  const stopAutoScroll = () => {
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }
  };

  // Clean up old posts from the top to manage memory
  const cleanupOldPosts = () => {
    if (!feedRef.current || posts.length <= 15) {
      return;
    }
    
    console.log('[PostFeed] Cleaning up old posts, current count:', posts.length);
    
    const feedElement = feedRef.current;
    const scrollTop = feedElement.scrollTop;
    const beforeHeight = feedElement.scrollHeight;
    
    setPosts(prev => {
      const newPosts = prev.slice(3);
      
      // Update sessionStorage with cleaned posts
      sessionStorage.setItem('feedPosts', JSON.stringify(newPosts));
      
      console.log('[PostFeed] Cleaned up posts, new count:', newPosts.length);
      
      // Adjust scroll position after removal to maintain visual continuity
      setTimeout(() => {
        if (feedRef.current) {
          const afterHeight = feedRef.current.scrollHeight;
          const heightDiff = beforeHeight - afterHeight;
          const newScrollTop = Math.max(0, scrollTop - heightDiff);
          feedRef.current.scrollTop = newScrollTop;
        }
      }, 10);
      
      return newPosts;
    });
  };

  // Handle manual scroll
  const handleScroll = (event) => {
    // Ignore scroll events that we triggered during auto-scroll
    if (isAutoScrollingRef.current) {
      return;
    }
    
    // Only block auto-scroll if this is a real user scroll event AND auto-scroll is running
    if (event.isTrusted && autoScrollStarted.current) {
      // Mark that user is scrolling
      isUserScrollingRef.current = true;
      
      // Clear any existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      // Set timeout to resume auto-scroll after user stops scrolling
      scrollTimeoutRef.current = setTimeout(() => {
        isUserScrollingRef.current = false;
      }, 500); // Resume after 0.5 seconds of no scrolling
    }
    
    // Always save scroll position (but don't log programmatic saves)
    if (feedRef.current && event.isTrusted) {
      sessionStorage.setItem('feedScrollPosition', feedRef.current.scrollTop.toString());
    }
  };

  // Initialize component
  useEffect(() => {
    const savedPosts = sessionStorage.getItem('feedPosts');
    const savedScrollPosition = sessionStorage.getItem('feedScrollPosition');
    
    // If we have saved state, restore it (sessionStorage automatically clears on browser close)
    if (savedPosts) {
      try {
        const parsedPosts = JSON.parse(savedPosts);
        setPosts(parsedPosts);
        setLoading(false);
        
        // Restore scroll position after a brief delay to ensure DOM is ready
        if (savedScrollPosition) {
          setTimeout(() => {
            if (feedRef.current) {
              feedRef.current.scrollTop = parseInt(savedScrollPosition, 10);
            }
          }, 100);
        }
        
        // Start auto-scroll for restored posts
        setTimeout(() => {
          if (feedRef.current) {
            startAutoScroll();
          }
        }, 500);
      } catch (err) {
        // If parsing fails, clear saved state and start fresh
        sessionStorage.clear();
        fetchPosts();
      }
          } else {
        // No saved state - fresh session (browser was closed or first visit)
        fetchPosts();
      }

    // Start auto-scroll with multiple attempts to ensure it works
    const tryStartAutoScroll = (attempt) => {
      if (feedRef.current) {
        startAutoScroll();
      } else if (attempt < 5) {
        setTimeout(() => tryStartAutoScroll(attempt + 1), 200);
      }
    };
    
    // Try starting auto-scroll with multiple attempts
    setTimeout(() => tryStartAutoScroll(1), 100);
    setTimeout(() => tryStartAutoScroll(2), 500);
    setTimeout(() => tryStartAutoScroll(3), 1000);
    
    // Refresh posts every 2 minutes (but only if we don't have saved posts or they're old)
    const refreshInterval = setInterval(() => {
      const lastFetch = sessionStorage.getItem('feedLastFetch');
      const now = Date.now();
      
      // Only refresh if it's been more than 2 minutes since last fetch
      if (!lastFetch || (now - parseInt(lastFetch, 10)) > 120000) {
        fetchPosts();
        sessionStorage.setItem('feedLastFetch', now.toString());
      }
    }, 120000); // 2 minutes
    
          // Cleanup function - this runs when component unmounts (user navigates away)
      return () => {
        stopAutoScroll();
        clearInterval(refreshInterval);
        
        // Clear scroll timeout
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
        
        // Save final scroll position and posts when leaving
        if (feedRef.current) {
          sessionStorage.setItem('feedScrollPosition', feedRef.current.scrollTop.toString());
          sessionStorage.setItem('feedPosts', JSON.stringify(posts));
        }
      };
  }, []);

  // Add scroll event listener
  useEffect(() => {
    const feedElement = feedRef.current;
    if (feedElement) {
      feedElement.addEventListener('scroll', handleScroll, { passive: true });
      
      return () => {
        feedElement.removeEventListener('scroll', handleScroll);
      };
    }
  }, [posts]); // Re-add listener when posts change

  // Restore scroll position when posts change
  useEffect(() => {
    if (posts.length > 0 && feedRef.current) {
      const savedScrollPosition = sessionStorage.getItem('feedScrollPosition');
      if (savedScrollPosition) {
        setTimeout(() => {
          if (feedRef.current) {
            feedRef.current.scrollTop = parseInt(savedScrollPosition, 10);
          }
        }, 50);
      }
    }
  }, [posts]);

  const handlePostClick = useCallback((slug) => {
    // Save current state before navigating (sessionStorage persists until browser/tab closes)
    if (feedRef.current) {
      sessionStorage.setItem('feedScrollPosition', feedRef.current.scrollTop.toString());
    }
    sessionStorage.setItem('feedPosts', JSON.stringify(posts));
    
    navigate(`/${slug}`);
  }, [posts, navigate]);



  // Handle loading, error, and empty states
  if (loading || error || posts.length === 0) {
    return (
      <FeedState 
        loading={loading} 
        error={error} 
        posts={posts} 
        onRetry={() => fetchPosts()} 
      />
    );
  }

  return (
    <div className="feed-container">
      <div className="feed-header">
        <button 
          className="write-post-button" 
          onClick={() => navigate('/write')}
        >
          Write a post
        </button>
      </div>
      <div 
        ref={feedRef}
        className="post-feed"
      >
        {posts.map((post, index) => (
          <FeedPost
            key={`${post.slug}-${index}`}
            post={post}
            onPostClick={handlePostClick}
            formatTimeAgo={formatTimeAgo}
            onRegisterElement={registerPostElement}
            onUnregisterElement={unregisterPostElement}
          />
        ))}
      </div>
    </div>
  );
};

export default PostFeed; 