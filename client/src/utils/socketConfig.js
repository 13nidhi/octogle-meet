/**
 * Socket Configuration Utilities
 * 
 * Handles signaling server URL detection and WebRTC configuration constants
 */

/**
 * Get signaling server URL from environment variable or auto-detect based on current hostname
 * @returns {string} The signaling server URL
 */
export const getSignalingServerUrl = () => {
  // Check for environment variable first (REACT_APP_SIGNALING_SERVER_URL)
  if (process.env.REACT_APP_SIGNALING_SERVER_URL) {
    return process.env.REACT_APP_SIGNALING_SERVER_URL;
  }
  
  // Auto-detect: if accessing from localhost, use localhost; otherwise use current hostname
  const isLocalhost = window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1' ||
                      window.location.hostname === '';
  
  if (isLocalhost) {
    return 'http://localhost:4000';
  } else {
    // Use the same hostname and protocol, but port 4000 for signaling server
    // This assumes signaling server is on the same host but different port
    const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
    const hostname = window.location.hostname;
    return `${protocol}//${hostname}:4000`;
  }
};

// WebRTC Configuration
export const ICE_SERVERS = [{ urls: 'stun:stun.l.google.com:19302' }];

// Reconnection Configuration
export const MAX_RECONNECT_ATTEMPTS = 5; // Maximum number of reconnection attempts
export const INITIAL_RECONNECT_DELAY = 1000; // Initial delay in milliseconds (1 second)

