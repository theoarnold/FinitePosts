import { useEffect, useState, useRef, useMemo } from 'react';

// Helper function to compare arrays of posts by slug
const arePostArraysEqual = (a, b) => {
  if (a.length !== b.length) return false;
  const aSlugs = new Set(a.map(p => p.slug));
  const bSlugs = new Set(b.map(p => p.slug));
  if (aSlugs.size !== bSlugs.size) return false;
  for (const slug of aSlugs) {
    if (!bSlugs.has(slug)) return false;
  }
  return true;
};

export const useVisiblePosts = (posts, threshold = 0.3) => {
  const [visiblePosts, setVisiblePosts] = useState([]);
  const observerRef = useRef(null);
  const postElementsRef = useRef(new Map());
  const visibilityStateRef = useRef(new Map()); // Track individual element visibility
  const postsRef = useRef(posts);

  // Keep posts ref updated
  useEffect(() => {
    postsRef.current = posts;
  }, [posts]);

  // Memoize posts slugs to prevent unnecessary effect runs
  const postSlugs = useMemo(() => posts.map(post => post.slug), [posts]);

  // Create intersection observer only once (or when threshold changes)
  useEffect(() => {
    console.log('[useVisiblePosts] Creating intersection observer');
    
    // Create intersection observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        let hasChanges = false;
        const changes = [];

        entries.forEach((entry) => {
          const slug = entry.target.dataset.postSlug;
          if (!slug) return;

          const isCurrentlyVisible = entry.isIntersecting && entry.intersectionRatio >= threshold;
          const wasVisible = visibilityStateRef.current.get(slug);

          // Only update if visibility actually changed
          if (isCurrentlyVisible !== wasVisible) {
            visibilityStateRef.current.set(slug, isCurrentlyVisible);
            changes.push(`${slug}: ${wasVisible} -> ${isCurrentlyVisible}`);
            hasChanges = true;
          }
        });

        // Only update state if there were actual visibility changes
        if (hasChanges) {
          console.log('[useVisiblePosts] Visibility changes:', changes);
          
          setVisiblePosts(currentPosts => {
            // Use the current posts from ref, not the stale closure
            const currentPostsArray = postsRef.current;
            const newVisiblePosts = currentPostsArray.filter(post => 
              visibilityStateRef.current.get(post.slug) === true
            );
            
            // Use more robust equality check
            const hasChanged = !arePostArraysEqual(newVisiblePosts, currentPosts);

            if (hasChanged) {
              console.log('[useVisiblePosts] Visible posts updated:', 
                'from', currentPosts.map(p => p.slug), 
                'to', newVisiblePosts.map(p => p.slug)
              );
            }

            return hasChanged ? newVisiblePosts : currentPosts;
          });
        }
      },
      {
        threshold: threshold, // Trigger when 70% of the post is actually visible
        rootMargin: '100px 0px 100px 0px' // Add 100px buffer above and below to reduce flapping
      }
    );

    return () => {
      console.log('[useVisiblePosts] Destroying intersection observer');
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [threshold]); // Only recreate when threshold changes, NOT when posts change

  // Function to register a post element for observation
  const registerPostElement = useMemo(() => (slug, element) => {
    if (!element || !slug) return;

    console.log('[useVisiblePosts] Registering element for post:', slug);

    // Store reference
    postElementsRef.current.set(slug, element);

    // Add data attribute for identification
    element.dataset.postSlug = slug;

    // Start observing
    if (observerRef.current) {
      observerRef.current.observe(element);
    }
  }, []);

  // Function to unregister a post element
  const unregisterPostElement = useMemo(() => (slug) => {
    console.log('[useVisiblePosts] Unregistering element for post:', slug);
    
    const element = postElementsRef.current.get(slug);
    if (element && observerRef.current) {
      observerRef.current.unobserve(element);
      postElementsRef.current.delete(slug);
      visibilityStateRef.current.delete(slug); // Clean up visibility state
    }
  }, []);

  // Clean up when posts change - use memoized slugs
  useEffect(() => {
    const currentSlugs = new Set(postSlugs);
    
    // Remove observers for posts that no longer exist
    for (const [slug, element] of postElementsRef.current.entries()) {
      if (!currentSlugs.has(slug)) {
        console.log('[useVisiblePosts] Cleaning up observer for removed post:', slug);
        unregisterPostElement(slug);
      }
    }

    // Clean up visibility state for posts that no longer exist
    for (const slug of visibilityStateRef.current.keys()) {
      if (!currentSlugs.has(slug)) {
        visibilityStateRef.current.delete(slug);
      }
    }
  }, [postSlugs, unregisterPostElement]);

  return {
    visiblePosts,
    registerPostElement,
    unregisterPostElement
  };
}; 