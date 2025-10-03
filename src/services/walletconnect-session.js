/**
 * WalletConnect Session Management Service
 * Handles session persistence, restoration, and lifecycle management
 */

import { getSdkError } from '@walletconnect/utils';

class WalletConnectSessionManager {
  constructor() {
    this.storageKey = 'walletconnect_sessions';
    this.activeSessions = new Map();
    this.sessionCallbacks = new Map();
    this.autoReconnect = true;
    this.sessionTimeout = 24 * 60 * 60 * 1000; // 24 hours
    
    // Initialize from storage
    this.loadSessionsFromStorage();
  }

  /**
   * Load sessions from localStorage
   */
  loadSessionsFromStorage() {
    try {
      const storedSessions = localStorage.getItem(this.storageKey);
      if (storedSessions) {
        const sessions = JSON.parse(storedSessions);
        sessions.forEach(session => {
          if (this.isSessionValid(session)) {
            this.activeSessions.set(session.topic, session);
          }
        });
        console.log(`Loaded ${this.activeSessions.size} sessions from storage`);
      }
    } catch (error) {
      console.error('Error loading sessions from storage:', error);
    }
  }

  /**
   * Save sessions to localStorage
   */
  saveSessionsToStorage() {
    try {
      const sessions = Array.from(this.activeSessions.values());
      localStorage.setItem(this.storageKey, JSON.stringify(sessions));
    } catch (error) {
      console.error('Error saving sessions to storage:', error);
    }
  }

  /**
   * Check if session is valid and not expired
   */
  isSessionValid(session) {
    if (!session || !session.expiry) return false;
    
    const now = Date.now();
    const expiryTime = session.expiry * 1000; // Convert to milliseconds
    
    return expiryTime > now;
  }

  /**
   * Add a new session
   */
  addSession(session, callbacks = {}) {
    if (!session || !session.topic) {
      throw new Error('Invalid session object');
    }

    this.activeSessions.set(session.topic, {
      ...session,
      connectedAt: Date.now(),
      lastActivity: Date.now()
    });

    if (callbacks) {
      this.sessionCallbacks.set(session.topic, callbacks);
    }

    this.saveSessionsToStorage();
    console.log(`Session added: ${session.topic}`);
    
    this.emit('session_added', session);
  }

  /**
   * Remove a session
   */
  removeSession(topic, reason = 'User disconnected') {
    const session = this.activeSessions.get(topic);
    if (session) {
      this.activeSessions.delete(topic);
      this.sessionCallbacks.delete(topic);
      this.saveSessionsToStorage();
      
      console.log(`Session removed: ${topic}, reason: ${reason}`);
      this.emit('session_removed', { session, reason });
    }
  }

  /**
   * Get session by topic
   */
  getSession(topic) {
    return this.activeSessions.get(topic);
  }

  /**
   * Get all active sessions
   */
  getAllSessions() {
    return Array.from(this.activeSessions.values());
  }

  /**
   * Update session activity timestamp
   */
  updateSessionActivity(topic) {
    const session = this.activeSessions.get(topic);
    if (session) {
      session.lastActivity = Date.now();
      this.activeSessions.set(topic, session);
      this.saveSessionsToStorage();
    }
  }

  /**
   * Clean up expired sessions
   */
  cleanupExpiredSessions() {
    const now = Date.now();
    const expiredTopics = [];

    for (const [topic, session] of this.activeSessions.entries()) {
      if (!this.isSessionValid(session)) {
        expiredTopics.push(topic);
      }
    }

    expiredTopics.forEach(topic => {
      this.removeSession(topic, 'Session expired');
    });

    if (expiredTopics.length > 0) {
      console.log(`Cleaned up ${expiredTopics.length} expired sessions`);
    }

    return expiredTopics.length;
  }

  /**
   * Start session cleanup interval
   */
  startCleanupInterval(intervalMs = 60000) { // Default: 1 minute
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredSessions();
    }, intervalMs);
  }

  /**
   * Stop session cleanup interval
   */
  stopCleanupInterval() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Get session statistics
   */
  getSessionStats() {
    const sessions = this.getAllSessions();
    const now = Date.now();
    
    return {
      total: sessions.length,
      active: sessions.filter(s => this.isSessionValid(s)).length,
      expired: sessions.filter(s => !this.isSessionValid(s)).length,
      byChain: this.groupSessionsByChain(sessions),
      avgDuration: this.calculateAverageDuration(sessions),
      oldestSession: sessions.reduce((oldest, session) => {
        return !oldest || session.connectedAt < oldest.connectedAt ? session : oldest;
      }, null)
    };
  }

  /**
   * Group sessions by chain
   */
  groupSessionsByChain(sessions) {
    const chainGroups = {};
    
    sessions.forEach(session => {
      if (session.namespaces && session.namespaces.eip155) {
        const chains = session.namespaces.eip155.chains || [];
        chains.forEach(chain => {
          const chainId = chain.split(':')[1];
          chainGroups[chainId] = (chainGroups[chainId] || 0) + 1;
        });
      }
    });
    
    return chainGroups;
  }

  /**
   * Calculate average session duration
   */
  calculateAverageDuration(sessions) {
    if (sessions.length === 0) return 0;
    
    const now = Date.now();
    const totalDuration = sessions.reduce((sum, session) => {
      const duration = session.lastActivity - session.connectedAt;
      return sum + duration;
    }, 0);
    
    return Math.round(totalDuration / sessions.length);
  }

  /**
   * Restore session with sign client
   */
  async restoreSession(signClient, topic) {
    try {
      const storedSession = this.getSession(topic);
      if (!storedSession || !this.isSessionValid(storedSession)) {
        throw new Error('Session not found or expired');
      }

      // Check if session exists in sign client
      const clientSession = signClient.session.get(topic);
      if (!clientSession) {
        // Session doesn't exist in client, remove from storage
        this.removeSession(topic, 'Session not found in client');
        throw new Error('Session not found in sign client');
      }

      // Update activity
      this.updateSessionActivity(topic);
      
      console.log(`Session restored: ${topic}`);
      this.emit('session_restored', clientSession);
      
      return clientSession;
    } catch (error) {
      console.error(`Error restoring session ${topic}:`, error);
      this.removeSession(topic, 'Restore failed');
      throw error;
    }
  }

  /**
   * Auto-reconnect to stored sessions
   */
  async autoReconnectSessions(signClient) {
    if (!this.autoReconnect || !signClient) {
      return [];
    }

    const reconnectedSessions = [];
    const sessionTopics = Array.from(this.activeSessions.keys());

    for (const topic of sessionTopics) {
      try {
        const session = await this.restoreSession(signClient, topic);
        reconnectedSessions.push(session);
      } catch (error) {
        console.warn(`Failed to restore session ${topic}:`, error.message);
      }
    }

    console.log(`Auto-reconnected ${reconnectedSessions.length} sessions`);
    return reconnectedSessions;
  }

  /**
   * Disconnect all sessions
   */
  async disconnectAllSessions(signClient, reason = 'User requested disconnect') {
    const topics = Array.from(this.activeSessions.keys());
    const results = [];

    for (const topic of topics) {
      try {
        if (signClient) {
          await signClient.disconnect({
            topic,
            reason: getSdkError('USER_DISCONNECTED')
          });
        }
        this.removeSession(topic, reason);
        results.push({ topic, success: true });
      } catch (error) {
        console.error(`Error disconnecting session ${topic}:`, error);
        results.push({ topic, success: false, error: error.message });
      }
    }

    return results;
  }

  /**
   * Export sessions for backup
   */
  exportSessions() {
    return {
      sessions: Array.from(this.activeSessions.values()),
      exportedAt: Date.now(),
      version: '1.0.0'
    };
  }

  /**
   * Import sessions from backup
   */
  importSessions(backup) {
    try {
      if (!backup || !backup.sessions || !Array.isArray(backup.sessions)) {
        throw new Error('Invalid backup format');
      }

      let importedCount = 0;
      backup.sessions.forEach(session => {
        if (this.isSessionValid(session)) {
          this.activeSessions.set(session.topic, session);
          importedCount++;
        }
      });

      this.saveSessionsToStorage();
      console.log(`Imported ${importedCount} sessions from backup`);
      
      return importedCount;
    } catch (error) {
      console.error('Error importing sessions:', error);
      throw error;
    }
  }

  /**
   * Clear all sessions
   */
  clearAllSessions() {
    this.activeSessions.clear();
    this.sessionCallbacks.clear();
    localStorage.removeItem(this.storageKey);
    console.log('All sessions cleared');
    this.emit('all_sessions_cleared');
  }

  /**
   * Event emitter functionality
   */
  eventListeners = new Map();

  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.eventListeners.has(event)) {
      const listeners = this.eventListeners.get(event);
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in session manager event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Get session by peer metadata
   */
  findSessionByPeer(peerName) {
    for (const session of this.activeSessions.values()) {
      if (session.peer && session.peer.metadata && 
          session.peer.metadata.name === peerName) {
        return session;
      }
    }
    return null;
  }

  /**
   * Get sessions by chain ID
   */
  getSessionsByChain(chainId) {
    const chainKey = `eip155:${chainId}`;
    return Array.from(this.activeSessions.values()).filter(session => {
      return session.namespaces && 
             session.namespaces.eip155 && 
             session.namespaces.eip155.chains &&
             session.namespaces.eip155.chains.includes(chainKey);
    });
  }

  /**
   * Cleanup and destroy
   */
  destroy() {
    this.stopCleanupInterval();
    this.clearAllSessions();
    this.eventListeners.clear();
  }
}

// Create and export singleton instance
const sessionManager = new WalletConnectSessionManager();

export default sessionManager;
export { WalletConnectSessionManager };