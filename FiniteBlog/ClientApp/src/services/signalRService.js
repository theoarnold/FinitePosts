import * as signalR from '@microsoft/signalr';

const API_BASE_URL = 'http://localhost:5206';

class SignalRService {
  constructor() {
    this.connection = null;
    this.subscribers = new Map();
    this.joinedGroups = new Set();
    this.pendingJoins = new Map();
    this.isConnecting = false;
    this.reconnectTimeout = null;
    this.currentSlug = null;
  }

  async getConnection() {
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      return this.connection;
    }

    if (this.isConnecting) {
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
      // Get device fingerprint for connection
      let deviceFingerprint = '';
      try {
        const { default: fingerprintService } = await import('./fingerprint');
        deviceFingerprint = await fingerprintService.getFingerprint();
      } catch (err) {
        console.warn('Could not get device fingerprint for SignalR connection:', err);
      }

      const connectionUrl = deviceFingerprint 
        ? `${API_BASE_URL}/posthub?deviceFingerprint=${encodeURIComponent(deviceFingerprint)}`
        : `${API_BASE_URL}/posthub`;

      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(connectionUrl, { withCredentials: true })
        .withAutomaticReconnect()
        .configureLogging(signalR.LogLevel.Error)
        .build();

      this.connection.on("ReceiveViewUpdate", (data) => {
        const targetSlug = data.slug || this.currentSlug;
        if (targetSlug && this.subscribers.has(targetSlug)) {
          this.subscribers.get(targetSlug).forEach(callback => {
            callback('viewUpdate', data);
          });
        }
      });

      this.connection.on("ReceiveViewerCount", (data) => {
        const targetSlug = data.slug || this.currentSlug;
        if (targetSlug && this.subscribers.has(targetSlug)) {
          this.subscribers.get(targetSlug).forEach(callback => {
            callback('viewerCount', data);
          });
        }
      });

      this.connection.on("ReceiveTextAnnotation", (data) => {
        const targetSlug = data.slug || this.currentSlug;
        if (targetSlug && this.subscribers.has(targetSlug)) {
          this.subscribers.get(targetSlug).forEach(callback => {
            callback('annotationUpdate', data);
          });
        }
      });

      await this.connection.start();
      this.isConnecting = false;
      return this.connection;
    } catch (err) {
      this.isConnecting = false;
      this.reconnectTimeout = setTimeout(() => this.setupConnection(), 5000);
      return null;
    }
  }

  subscribeImmediate(slug, callback) {
    if (!this.subscribers.has(slug)) {
      this.subscribers.set(slug, new Set());
    }
    this.subscribers.get(slug).add(callback);

    this.currentSlug = slug;

    this.joinGroup(slug);

    return () => {
      if (this.subscribers.has(slug)) {
        this.subscribers.get(slug).delete(callback);
        
        if (this.currentSlug === slug) {
          this.currentSlug = null;
        }
        
        if (this.subscribers.get(slug).size === 0) {
          this.subscribers.delete(slug);
          this.leaveGroup(slug);
        }
      }
    };
  }

  async joinGroup(slug) {
    const connection = await this.getConnection();
    if (!connection || this.joinedGroups.has(slug)) {
      return;
    }

    try {
      await connection.invoke("JoinPostGroup", slug);
      this.joinedGroups.add(slug);
    } catch (err) {
      console.error('Error joining group:', slug, err);
    }
  }

  async leaveGroup(slug) {
    if (!this.connection || !this.joinedGroups.has(slug)) {
      return;
    }

    try {
      await this.connection.invoke("LeavePostGroup", slug);
      this.joinedGroups.delete(slug);
    } catch (err) {
      console.error('Error leaving group:', slug, err);
    }
  }

  async requestViewerCount(slug) {
    const connection = await this.getConnection();
    if (connection?.state === signalR.HubConnectionState.Connected) {
      try {
        await connection.invoke("RequestViewerCount", slug);
      } catch (err) {
      }
    }
  }

  async sendTextAnnotation(slug, text, positionX, positionY) {
    const connection = await this.getConnection();
    if (connection?.state === signalR.HubConnectionState.Connected) {
      try {
        await connection.invoke("SendTextAnnotation", slug, text, positionX, positionY);
      } catch (err) {
        console.error('Error sending text annotation:', err);
        throw err;
      }
    } else {
      throw new Error('Not connected to SignalR hub');
    }
  }

  async cleanup() {
    if (this.connection) {
      await this.connection.stop();
      this.connection = null;
    }
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    this.subscribers.clear();
    this.joinedGroups.clear();
    this.pendingJoins.clear();
  }
}

const signalRService = new SignalRService();
export default signalRService; 