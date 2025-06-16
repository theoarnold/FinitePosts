import React, { useState, useEffect, useRef } from 'react';
import signalRService from '../../services/signalRService';

const ViewCounter = ({ slug, viewLimit, initialViews = 0 }) => {
  const [currentViews, setCurrentViews] = useState(initialViews);
  const [activeViewers, setActiveViewers] = useState(0);
  const unsubscribeRef = useRef(null);
  const pollIntervalRef = useRef(null);

  useEffect(() => {
    if (!slug) return;

    const handleSignalRUpdate = (eventType, data) => {
      if (eventType === 'viewUpdate') {
        setCurrentViews(data.currentViews);
        if (data.activeViewers !== undefined) {
          setActiveViewers(data.activeViewers);
        }
      } else if (eventType === 'viewerCount') {
        setActiveViewers(data.activeViewers);
      }
    };

    // Subscribe immediately for ViewCounter
    unsubscribeRef.current = signalRService.subscribeImmediate(slug, handleSignalRUpdate);

    // Poll for viewer count every 30 seconds
    pollIntervalRef.current = setInterval(() => {
      signalRService.requestViewerCount(slug);
    }, 30000);

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [slug]);

  return (
    <div className="view-counter">
      <div>Views: {currentViews}/{viewLimit}</div>
      {activeViewers > 0 && <div>Active viewers: {activeViewers}</div>}
    </div>
  );
};

export default ViewCounter; 