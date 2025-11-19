/**
 * Error Message Utilities
 * 
 * Provides user-friendly error messages for various error types
 */

/**
 * Format error message based on error type
 * @param {Error} err - The error object
 * @param {string} defaultMessage - Default error message if no specific match
 * @returns {string} User-friendly error message
 */
export const formatErrorMessage = (err, defaultMessage = 'An error occurred while starting the connection.') => {
  if (!err) return defaultMessage;
  
  // Provide more specific error messages
  if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
    return 'Camera and microphone access was denied. Please allow access in your browser settings and try again.';
  } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
    return 'No camera or microphone found. Please connect a camera and microphone and try again.';
  } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
    return 'Camera or microphone is already in use by another application. Please close other applications and try again.';
  } else if (err.name === 'OverconstrainedError' || err.name === 'ConstraintNotSatisfiedError') {
    return 'Camera or microphone does not support the required settings. Please try again.';
  } else if (err.name === 'TypeError' && err.message.includes('getUserMedia')) {
    return 'Your browser does not support camera/microphone access. Please use a modern browser like Chrome, Firefox, or Edge.';
  } else if (err.message) {
    return `Error: ${err.message}`;
  }
  
  return defaultMessage;
};

/**
 * Format socket connection error message
 * @param {Error} error - The socket error object
 * @param {string} serverUrl - The signaling server URL
 * @returns {string} User-friendly error message
 */
export const formatSocketError = (error, serverUrl) => {
  return `Failed to connect to server: ${error.message || 'Connection error'}. Please check if the server is running at ${serverUrl} and your network connection.`;
};

