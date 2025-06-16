import { useEffect, useRef, useCallback } from 'react';
import signalRService from '../services/signalRService';

export const useFeedSignalR = (visiblePosts, onViewCountUpdate) => {
  const subscribersRef = useRef(new Map()); // Map of slug -> unsubscribe function
  const callbackRef = useRef(onViewCountUpdate);
  const previousVisibleSlugsRef = useRef(new Set());

  // Keep callback ref up to date
  useEffect(() => {
    callbackRef.current = onViewCountUpdate;
  }, [onViewCountUpdate]);

  // Create stable callback that uses the latest onViewCountUpdate
  const stableCallback = useCallback((eventType, data) => {
    if (eventType === 'viewUpdate' && callbackRef.current) {
      callbackRef.current(data.slug, {
        currentViews: data.currentViews,
        activeViewers: data.activeViewers
      });
    }
  }, []);

  // Update subscriptions based on visible posts
  useEffect(() => {
    const currentSubscriptions = subscribersRef.current;
    const visibleSlugs = new Set(visiblePosts.map(post => post.slug));
    const previousVisibleSlugs = previousVisibleSlugsRef.current;

    // Check if there are actually any changes
    const hasChanges = 
      visibleSlugs.size !== previousVisibleSlugs.size ||
      [...visibleSlugs].some(slug => !previousVisibleSlugs.has(slug)) ||
      [...previousVisibleSlugs].some(slug => !visibleSlugs.has(slug));

    if (!hasChanges) {
      return;
    }

    // Unsubscribe from posts no longer visible
    const toUnsubscribe = [...previousVisibleSlugs].filter(slug => !visibleSlugs.has(slug));
    const toSubscribe = [...visibleSlugs].filter(slug => !previousVisibleSlugs.has(slug));

    console.log('[useFeedSignalR] Subscription changes - Unsubscribe:', toUnsubscribe, 'Subscribe:', toSubscribe);

    // Unsubscribe from posts no longer visible
    toUnsubscribe.forEach(slug => {
      const unsubscribe = currentSubscriptions.get(slug);
      if (unsubscribe) {
        unsubscribe();
        currentSubscriptions.delete(slug);
      }
    });

    // Subscribe to newly visible posts
    toSubscribe.forEach(slug => {
      if (!currentSubscriptions.has(slug)) {
        const unsubscribe = signalRService.subscribe(slug, stableCallback);
        currentSubscriptions.set(slug, unsubscribe);
      }
    });

    // Update the previous visible slugs
    previousVisibleSlugsRef.current = new Set(visibleSlugs);
  }, [visiblePosts]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('[useFeedSignalR] Cleaning up all subscriptions');
      // Unsubscribe from all posts
      for (const unsubscribe of subscribersRef.current.values()) {
        unsubscribe();
      }
      subscribersRef.current.clear();
      previousVisibleSlugsRef.current.clear();
    };
  }, []);
}; 