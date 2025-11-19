import { useState, useRef, useCallback, useEffect } from 'react';
import io from 'socket.io-client';
import { getSignalingServerUrl, MAX_RECONNECT_ATTEMPTS, INITIAL_RECONNECT_DELAY } from '../utils/socketConfig';
import { formatSocketError } from '../utils/errorMessages';

/**
 * Custom hook for managing Socket.io connection
 * @param {string} roomId - The room ID to join/create
 * @param {boolean} isCreator - Whether this user is the room creator
 * @returns {Object} Socket connection state and methods
 */
export const useSocketConnection = (roomId, isCreator) => {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [reconnecting, setReconnecting] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  
  const socketReconnectAttemptsRef = useRef(0);
  const reconnectIntervalRef = useRef(null);
  const connectionTimeoutRef = useRef(null);

  const SIGNALING_SERVER_URL = getSignalingServerUrl();

  /**
   * Stop monitoring reconnection attempts
   */
  const stopMonitoringReconnection = useCallback(() => {
    if (reconnectIntervalRef.current) {
      clearInterval(reconnectIntervalRef.current);
      reconnectIntervalRef.current = null;
    }
  }, []);

  /**
   * Start monitoring socket reconnection attempts manually
   * This is a fallback in case socket.io events don't fire reliably
   */
  const startMonitoringReconnection = useCallback(() => {
    // Clear any existing interval
    stopMonitoringReconnection();
    
    // Check connection status periodically
    reconnectIntervalRef.current = setInterval(() => {
      if (!socketRef.current) {
        stopMonitoringReconnection();
        return;
      }

      const isConnected = socketRef.current.connected;
      
      if (!isConnected && socketReconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
        // Increment attempt count
        socketReconnectAttemptsRef.current += 1;
        console.log(`Manual reconnection tracking - Attempt ${socketReconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS}`);
        setReconnecting(true);
        setRetryCount(socketReconnectAttemptsRef.current);
      } else if (isConnected) {
        // Connected! Stop monitoring
        stopMonitoringReconnection();
        socketReconnectAttemptsRef.current = 0;
        setReconnecting(false);
        setRetryCount(0);
      } else if (socketReconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
        // Max attempts reached
        stopMonitoringReconnection();
        setReconnecting(false);
        console.log('Max reconnection attempts reached');
      }
    }, INITIAL_RECONNECT_DELAY); // Check every second
  }, [stopMonitoringReconnection]);

  /**
   * Connect to the signaling server
   * @param {Function} onConnect - Callback when socket connects
   * @param {Function} onSignal - Callback for signaling messages
   * @param {Function} onPeerJoined - Callback when peer joins
   * @param {Function} onPeerLeft - Callback when peer leaves
   * @returns {Promise<void>}
   */
  const connect = useCallback((onConnect, onSignal, onPeerJoined, onPeerLeft) => {
    return new Promise((resolve, reject) => {
      console.log('[useSocketConnection] Connecting to signaling server:', SIGNALING_SERVER_URL);
      
      // Configure socket.io with reconnection options
      socketRef.current = io(SIGNALING_SERVER_URL, {
        reconnection: true,
        reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
        reconnectionDelay: INITIAL_RECONNECT_DELAY,
        reconnectionDelayMax: 16000, // Max delay of 16 seconds
        timeout: 10000, // 10 second connection timeout
      });

      // Add connection timeout handler
      connectionTimeoutRef.current = setTimeout(() => {
        if (!socketRef.current || !socketRef.current.connected) {
          console.error('[useSocketConnection] ✗ Socket connection timeout after 10 seconds');
          const errorMsg = 'Connection timeout: Could not connect to server. Please check if the server is running and accessible.';
          setError(errorMsg);
          reject(new Error(errorMsg));
        }
      }, 10000);

      socketRef.current.on('connect', () => {
        // Clear connection timeout
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
          connectionTimeoutRef.current = null;
        }
        // Reset retry count on successful connection
        console.log('[useSocketConnection] ✓ Socket connected successfully');
        console.log('[useSocketConnection] Socket ID:', socketRef.current.id);
        setRetryCount(0);
        setReconnecting(false);
        setError(null); // Clear any previous errors
        socketReconnectAttemptsRef.current = 0; // Reset socket reconnection attempts
        stopMonitoringReconnection(); // Stop monitoring if it was running
        setIsConnected(true);
        
        // Ensure socket is actually connected before proceeding
        if (!socketRef.current || !socketRef.current.connected) {
          console.error('[useSocketConnection] ✗ Socket not actually connected, waiting...');
          return;
        }
        
        // Call the onConnect callback
        if (onConnect) {
          onConnect();
        }
        resolve();
      });

      socketRef.current.on('signal', (data) => {
        if (onSignal) {
          onSignal(data);
        }
      });

      socketRef.current.on('peer-joined', () => {
        if (onPeerJoined) {
          onPeerJoined();
        }
      });

      socketRef.current.on('peer-left', () => {
        if (onPeerLeft) {
          onPeerLeft();
        }
      });

      // Handle socket connection errors
      socketRef.current.on('connect_error', (error) => {
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
          connectionTimeoutRef.current = null;
        }
        console.error('[useSocketConnection] ✗ Socket connection error:', error);
        console.error('[useSocketConnection] Error details:', {
          message: error.message,
          type: error.type,
          description: error.description
        });
        const errorMsg = formatSocketError(error, SIGNALING_SERVER_URL);
        setError(errorMsg);
        setReconnecting(true);
        reject(error);
      });

      // Handle socket disconnection
      socketRef.current.on('disconnect', (reason) => {
        console.log('[useSocketConnection] Socket disconnected:', reason);
        setIsConnected(false);
        // Only attempt reconnection if it's not a manual disconnect
        if (reason === 'io client disconnect') {
          // Client manually disconnected, don't reconnect
          return;
        } else {
          // Server disconnected or network error - socket.io will auto-reconnect
          // Update UI immediately
          setReconnecting(true);
          socketReconnectAttemptsRef.current = 0;
          
          // Start monitoring reconnection attempts manually
          startMonitoringReconnection();
        }
      });

      // Handle when socket.io starts attempting to reconnect
      socketRef.current.on('reconnecting', (attemptNumber) => {
        console.log('[useSocketConnection] Socket.io reconnecting event, attempt:', attemptNumber);
        socketReconnectAttemptsRef.current = attemptNumber;
        setReconnecting(true);
        setRetryCount(attemptNumber);
      });

      // Handle reconnection attempt (fires before each attempt)
      socketRef.current.on('reconnect_attempt', (attemptNumber) => {
        console.log('[useSocketConnection] Reconnection attempt event, attempt:', attemptNumber);
        socketReconnectAttemptsRef.current = attemptNumber;
        setReconnecting(true);
        setRetryCount(attemptNumber);
      });

      // Handle successful reconnection
      socketRef.current.on('reconnect', (attemptNumber) => {
        console.log('[useSocketConnection] Socket reconnected successfully after', attemptNumber, 'attempts');
        socketReconnectAttemptsRef.current = 0;
        stopMonitoringReconnection();
        setIsConnected(true);
      });

      // Handle reconnection failure
      socketRef.current.on('reconnect_failed', () => {
        console.log('[useSocketConnection] Reconnection failed after max attempts');
        setReconnecting(false);
        setError('Failed to reconnect to server. Please refresh the page.');
      });
    });
  }, [SIGNALING_SERVER_URL, startMonitoringReconnection, stopMonitoringReconnection]);

  /**
   * Join or create a room
   * @param {Function} onSuccess - Callback when room join/create succeeds
   * @param {Function} onError - Callback when room join/create fails
   */
  const joinRoom = useCallback((onSuccess, onError) => {
    if (!socketRef.current || !socketRef.current.connected) {
      console.error('[useSocketConnection] ✗ Socket not connected, cannot join room');
      if (onError) onError('Socket not connected');
      return;
    }

    const rejoinRoom = (attempt = 1, maxAttempts = 5) => {
      // Double-check socket is still connected
      if (!socketRef.current || !socketRef.current.connected) {
        console.error('[useSocketConnection] ✗ Socket disconnected before room join');
        const errorMsg = 'Connection lost. Please retry.';
        setError(errorMsg);
        if (onError) onError(errorMsg);
        return;
      }
      
      console.log(`[useSocketConnection] ${isCreator ? 'Creating' : 'Joining'} room (attempt ${attempt}/${maxAttempts})...`);
      
      if (isCreator) {
        socketRef.current.emit('create-room', roomId, (res) => {
          if (!res.ok) {
            console.error('[useSocketConnection] ✗ Create room failed:', res.reason);
            if (attempt < maxAttempts && res.reason === 'ROOM_ALREADY_EXISTS') {
              // Room might have been created by another instance, try to join instead
              console.log(`[useSocketConnection] Retrying as join (attempt ${attempt + 1}/${maxAttempts})`);
              setTimeout(() => {
                socketRef.current.emit('join-room', roomId, (joinRes) => {
                  if (!joinRes.ok) {
                    const errorMsg = `Could not join room: ${joinRes.reason || 'unknown'}. Please check the room ID.`;
                    setError(errorMsg);
                    if (onError) onError(errorMsg);
                  } else {
                    setError(null);
                    if (onSuccess) onSuccess();
                  }
                });
              }, 1000 * attempt); // Exponential backoff
            } else {
              const errorMsg = `Could not create room: ${res.reason || 'unknown'}`;
              setError(errorMsg);
              if (onError) onError(errorMsg);
            }
          } else {
            setError(null);
            if (onSuccess) onSuccess();
          }
        });
      } else {
        socketRef.current.emit('join-room', roomId, (res) => {
          if (!res.ok) {
            console.error('[useSocketConnection] ✗ Join room failed:', res.reason);
            if (attempt < maxAttempts && res.reason === 'ROOM_NOT_FOUND') {
              // Room might not be created yet, retry
              console.log(`[useSocketConnection] Room not found. Retrying join room (attempt ${attempt + 1}/${maxAttempts})`);
              setError(`Room not found. Waiting for room to be created... (${attempt}/${maxAttempts})`);
              setTimeout(() => {
                rejoinRoom(attempt + 1, maxAttempts);
              }, 2000 * attempt); // Exponential backoff: 2s, 4s, 6s, 8s, 10s
            } else {
              console.error('[useSocketConnection] ✗ Failed to join room after all retries');
              const errorMsg = `Could not join room: ${res.reason || 'unknown'}. Please check the room ID and ensure the room creator is connected and has granted camera permissions.`;
              setError(errorMsg);
              if (onError) onError(errorMsg);
            }
          } else {
            console.log('[useSocketConnection] ✓ Successfully joined room');
            setError(null);
            if (onSuccess) onSuccess();
          }
        });
      }
    };

    // Small delay to ensure socket is ready
    setTimeout(() => {
      rejoinRoom();
    }, 100);
  }, [roomId, isCreator]);

  /**
   * Send a signal message
   * @param {Object} data - Signal data to send
   */
  const sendSignal = useCallback((data) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('signal', { roomId, ...data });
    }
  }, [roomId]);

  /**
   * Leave the room
   */
  const leaveRoom = useCallback(() => {
    if (socketRef.current) {
      try {
        socketRef.current.emit('leave-room', roomId);
      } catch (e) {
        console.warn('[useSocketConnection] Error leaving room:', e);
      }
    }
  }, [roomId]);

  /**
   * Disconnect the socket
   */
  const disconnect = useCallback(() => {
    // Clear any pending timeouts
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }
    
    // Stop monitoring reconnection
    stopMonitoringReconnection();
    
    // Reset reconnection attempts
    socketReconnectAttemptsRef.current = 0;
    
    if (socketRef.current) {
      try {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
      } catch (e) {
        console.warn('[useSocketConnection] Error disconnecting socket:', e);
      }
      socketRef.current = null;
    }
    
    setIsConnected(false);
    setReconnecting(false);
    setRetryCount(0);
    setError(null);
  }, [stopMonitoringReconnection]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    socket: socketRef.current,
    socketRef,
    isConnected,
    error,
    reconnecting,
    retryCount,
    connect,
    joinRoom,
    sendSignal,
    leaveRoom,
    disconnect
  };
};

