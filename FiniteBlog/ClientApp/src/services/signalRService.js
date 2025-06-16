import * as signalR from '@microsoft/signalr';

const API_BASE_URL = 'http://localhost:5206';

class SignalRService {
  constructor() {
    this.connection = null;
    this.subscribers = new Map(); // Map of slug -> Set of callback functions
    this.joinedGroups = new Set();
    this.pendingJoins = new Map(); // Map of slug -> timeout ID
    this.isConnecting = false;
    this.reconnectTimeout = null;
    this.currentSlug = null; // Track the current post being viewed
  }

  async getConnection() {
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      return this.connection;
    }

    if (this.isConnecting) {
      // Wait for existing connection attempt
      return new Promise((resolve) => {
        const checkConnection = () => {
          if (this.connection?.state === signalR.HubConnectionState.Connected) {
            resolve(this.connection);
          } else if (!this.isConnecting) {
            resolve(null);
          } else {
            setTimeout(checkConnection, 100);
          }
        };
        checkConnection();
      });
    }

    return this.setupConnection();
  }

  async setupConnection() {
    if (this.isConnecting) return null;
    
    this.isConnecting = true;

    try {
      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(`${API_BASE_URL}/posthub`, { withCredentials: true })
        .withAutomaticReconnect()
        .configureLogging(signalR.LogLevel.Error) // Only show errors
        .build();

      // Handle view count updates
      this.connection.on("ReceiveViewUpdate", (data) => {
        // For view updates, use the slug from the data or fall back to current slug
        const targetSlug = data.slug || this.currentSlug;
        if (targetSlug && this.subscribers.has(targetSlug)) {
          this.subscribers.get(targetSlug).forEach(callback => {
            callback('viewUpdate', data);
          });
        }
      });

      // Handle viewer count updates
      this.connection.on("ReceiveViewerCount", (data) => {
        // For viewer count updates, use the current slug since the data might not include slug
        const targetSlug = data.slug || this.currentSlug;
        if (targetSlug && this.subscribers.has(targetSlug)) {
          this.subscribers.get(targetSlug).forEach(callback => {
            callback('viewerCount', data);
          });
        }
      });

      await this.connection.start();
      this.isConnecting = false;
      return this.connection;
    } catch (err) {
      this.isConnecting = false;
      // Retry connection after 5 seconds
      this.reconnectTimeout = setTimeout(() => this.setupConnection(), 5000);
      return null;
    }
  }

  subscribe(slug, callback) {
    console.log('[SignalRService] New subscription for:', slug);
    console.log('[SignalRService] Current subscribers for this slug:', this.subscribers.get(slug)?.size || 0);
    
    if (!this.subscribers.has(slug)) {
      this.subscribers.set(slug, new Set());
    }
    this.subscribers.get(slug).add(callback);
    
    console.log('[SignalRService] Subscribers after adding:', this.subscribers.get(slug).size);

    // Schedule joining the group (with delay for feed posts)
    this.scheduleJoinGroup(slug);

    // Return unsubscribe function
    return () => {
      console.log('[SignalRService] Unsubscribing from:', slug);
      if (this.subscribers.has(slug)) {
        this.subscribers.get(slug).delete(callback);
        const remainingCount = this.subscribers.get(slug).size;
        console.log('[SignalRService] Remaining subscribers after removal:', remainingCount);
        
        // If no more subscribers for this slug, leave the group
        if (remainingCount === 0) {
          console.log('[SignalRService] No more subscribers, cleaning up and leaving group:', slug);
          this.subscribers.delete(slug);
          this.leaveGroup(slug);
        }
      }
    };
  }

  subscribeImmediate(slug, callback) {
    if (!this.subscribers.has(slug)) {
      this.subscribers.set(slug, new Set());
    }
    this.subscribers.get(slug).add(callback);

    // Set this as the current slug for ViewPost pages
    this.currentSlug = slug;

    // Join immediately for ViewPost pages
    this.joinGroup(slug);

    // Return unsubscribe function
    return () => {
      if (this.subscribers.has(slug)) {
        this.subscribers.get(slug).delete(callback);
        
        // Clear current slug if this was the current one
        if (this.currentSlug === slug) {
          this.currentSlug = null;
        }
        
        // If no more subscribers for this slug, leave the group
        if (this.subscribers.get(slug).size === 0) {
          this.subscribers.delete(slug);
          this.leaveGroup(slug);
        }
      }
    };
  }

  scheduleJoinGroup(slug) {
    console.log('[SignalRService] Scheduling join for:', slug);
    console.log('[SignalRService] Already joined:', this.joinedGroups.has(slug));
    console.log('[SignalRService] Already pending:', this.pendingJoins.has(slug));
    
    // Don't schedule if already joined or already pending
    if (this.joinedGroups.has(slug) || this.pendingJoins.has(slug)) {
      console.log('[SignalRService] Skipping schedule - already joined or pending:', slug);
      return;
    }

    console.log('[SignalRService] Setting 2-second timeout for joining:', slug);
    // Schedule join after 2 seconds (for feed posts)
    const timeoutId = setTimeout(() => {
      console.log('[SignalRService] Timeout triggered, executing delayed join for:', slug);
      this.pendingJoins.delete(slug);
      this.joinGroupForFeed(slug); // Use feed-specific join method
    }, 2000);

    this.pendingJoins.set(slug, timeoutId);
    console.log('[SignalRService] Pending joins now:', [...this.pendingJoins.keys()]);
  }

  cancelPendingJoin(slug) {
    const timeoutId = this.pendingJoins.get(slug);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.pendingJoins.delete(slug);
    }
  }

  async joinGroup(slug) {
    console.log('[SignalRService] Attempting to join group for:', slug);
    console.log('[SignalRService] Connection state:', this.connection?.state);
    console.log('[SignalRService] Already joined groups:', [...this.joinedGroups]);
    
    const connection = await this.getConnection();
    if (!connection || this.joinedGroups.has(slug)) {
      console.log('[SignalRService] Cannot join group - no connection or already joined:', slug);
      return;
    }

    try {
      console.log('[SignalRService] Invoking JoinPostGroup for:', slug);
      await connection.invoke("JoinPostGroup", slug);
      this.joinedGroups.add(slug);
      console.log('[SignalRService] Successfully joined group:', slug);
    } catch (err) {
      console.error('[SignalRService] Error joining group:', slug, err);
    }
  }

  async joinGroupForFeed(slug) {
    console.log('[SignalRService] Attempting to join feed group for:', slug);
    console.log('[SignalRService] Connection state:', this.connection?.state);
    console.log('[SignalRService] Already joined groups:', [...this.joinedGroups]);
    
    const connection = await this.getConnection();
    if (!connection || this.joinedGroups.has(slug)) {
      console.log('[SignalRService] Cannot join feed group - no connection or already joined:', slug);
      return;
    }

    try {
      console.log('[SignalRService] Invoking JoinPostGroupForFeed for:', slug);
      await connection.invoke("JoinPostGroupForFeed", slug);
      this.joinedGroups.add(slug);
      console.log('[SignalRService] Successfully joined feed group:', slug);
    } catch (err) {
      console.error('[SignalRService] Error joining feed group:', slug, err);
    }
  }

  async leaveGroup(slug) {
    console.log('[SignalRService] Attempting to leave group for:', slug);
    console.log('[SignalRService] Connection state:', this.connection?.state);
    console.log('[SignalRService] Joined groups:', [...this.joinedGroups]);
    
    if (!this.connection || !this.joinedGroups.has(slug)) {
      console.log('[SignalRService] Cannot leave group - no connection or not joined:', slug);
      return;
    }

    // Cancel any pending join
    this.cancelPendingJoin(slug);

    try {
      console.log('[SignalRService] Invoking LeavePostGroup for:', slug);
      await this.connection.invoke("LeavePostGroup", slug);
      this.joinedGroups.delete(slug);
      console.log('[SignalRService] Successfully left group:', slug);
    } catch (err) {
      console.error('[SignalRService] Error leaving group:', slug, err);
    }
  }

  async requestViewerCount(slug) {
    const connection = await this.getConnection();
    if (connection?.state === signalR.HubConnectionState.Connected) {
      try {
        await connection.invoke("RequestViewerCount", slug);
      } catch (err) {
        // Silent error handling
      }
    }
  }

  async cleanup() {
    // Clear reconnect timeout
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    // Clear all pending joins
    for (const timeoutId of this.pendingJoins.values()) {
      clearTimeout(timeoutId);
    }
    this.pendingJoins.clear();

    // Leave all groups and stop connection
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      try {
        // Leave all joined groups
        for (const slug of this.joinedGroups) {
          await this.connection.invoke("LeavePostGroup", slug);
        }
        this.joinedGroups.clear();

        // Stop connection
        await this.connection.stop();
      } catch (err) {
        // Silent error handling
      }
    }

    // Clear all subscribers
    this.subscribers.clear();
    this.currentSlug = null;
  }
}

// Create a singleton instance
const signalRService = new SignalRService();

export default signalRService; 