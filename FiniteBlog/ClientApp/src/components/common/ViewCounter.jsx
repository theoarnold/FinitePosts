import React, { useState, useEffect, useRef } from 'react';
import * as signalR from '@microsoft/signalr';
import './ViewCounter.css';

const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
  ? 'http://localhost:5206' 
  : window.location.origin;

const ViewCounter = ({ slug, viewLimit, initialViews = 0 }) => {
  const [currentViews, setCurrentViews] = useState(initialViews);
  const [activeViewers, setActiveViewers] = useState(0);
  const [viewerNumber, setViewerNumber] = useState(null);
  const [hasFetched, setHasFetched] = useState(false);
  const connectionRef = useRef(null);

  useEffect(() => {
    // Set viewer number from localStorage
    const storageKey = `viewer-number-${slug}`;
    const savedViewerNumber = localStorage.getItem(storageKey);
    
    if (savedViewerNumber) {
      setViewerNumber(parseInt(savedViewerNumber));
    } else {
      localStorage.setItem(storageKey, initialViews.toString());
      setViewerNumber(initialViews);
    }

    // Set up SignalR connection
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${API_BASE_URL}/posthub`, { withCredentials: true })
      .withAutomaticReconnect()
      .build();
    
    connectionRef.current = connection;
    
    connection.on("ReceiveViewUpdate", (data) => {
      if (data.currentViews !== undefined) {
        setCurrentViews(data.currentViews);
      }
      if (data.activeViewers !== undefined) {
        setActiveViewers(data.activeViewers);
      }
    });

    const pollViewerCount = () => {
      if (connection.state === signalR.HubConnectionState.Connected) {
        connection.invoke("RequestViewerCount", slug)
          .catch(err => console.error("Error requesting viewer count:", err));
      }
    };

    connection.start()
      .then(() => connection.invoke("JoinPostGroup", slug))
      .then(() => {
        pollViewerCount();
        const intervalId = setInterval(pollViewerCount, 30000);
        connection.intervalId = intervalId;
        setHasFetched(true);
      })
      .catch(err => console.error("SignalR connection error:", err));

    return () => {
      if (connection.state === signalR.HubConnectionState.Connected) {
        if (connection.intervalId) {
          clearInterval(connection.intervalId);
        }
        connection.invoke("LeavePostGroup", slug)
          .then(() => connection.stop())
          .catch(err => console.error("Error during cleanup:", err));
      }
    };
  }, [slug, initialViews]);

  return (
    <div className="post-header">
      <div className="post-stats">
        <div className="view-counter">
          <span className="view-count">{currentViews}</span>
          <span className="view-limit">/{viewLimit}</span>
          <span className="views-label">views</span>
        </div>
        
        {activeViewers > 0 && hasFetched && (
          <div className="active-viewers-counter">
            <span className="active-viewers-count">{activeViewers}</span>
            <span className="active-viewers-label">{activeViewers === 1 ? 'person' : 'people'} viewing now</span>
          </div>
        )}
      </div>
      
      {viewerNumber && (
        <div className="viewer-number">
          <span>You are viewer #{viewerNumber}</span>
        </div>
      )}
    </div>
  );
};

export default ViewCounter; 