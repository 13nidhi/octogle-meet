import { useState, useCallback, useEffect, useRef } from 'react';
import { useMediaStream } from './useMediaStream';
import { useSocketConnection } from './useSocketConnection';
import { usePeerConnection } from './usePeerConnection';

/**
 * Custom hook that orchestrates all room connection logic
 * Combines media stream, socket connection, and peer connection
 * @param {React.RefObject} localVideoRef - Ref to local video element
 * @param {React.RefObject} remoteVideoRef - Ref to remote video element
 * @param {string} roomId - The room ID
 * @param {boolean} isCreator - Whether this user is the room creator
 * @returns {Object} Room connection state and methods
 */
export const useRoomConnection = (localVideoRef, remoteVideoRef, roomId, isCreator) => {
  const [status, setStatus] = useState('idle'); // idle | waiting | connecting | connected | disconnected
  const [error, setError] = useState(null);
  const [reconnecting, setReconnecting] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Media stream hook
  const {
    streamRef: localStreamRef,
    muted,
    videoOff,
    error: mediaError,
    getUserMedia,
    toggleMute,
    toggleVideo,
    stopStream
  } = useMediaStream(localVideoRef);

  // Socket connection hook
  const {
    isConnected: socketConnected,
    error: socketError,
    reconnecting: socketReconnecting,
    retryCount: socketRetryCount,
    connect: connectSocket,
    joinRoom: joinSocketRoom,
    sendSignal,
    disconnect: disconnectSocket
  } = useSocketConnection(roomId, isCreator);

  // Create a ref to store peer connection methods for use in callbacks
  const peerConnectionRef = useRef(null);

  // Peer connection state change handler
  const handlePeerConnectionStateChange = useCallback((state) => {
    if (state === 'connected') {
      setStatus('connected');
      setReconnecting(false);
    } else if (state === 'disconnected' || state === 'failed') {
      setStatus('disconnected');
      // Attempt to reconnect if socket is still connected
      if (socketConnected && peerConnectionRef.current) {
        setReconnecting(true);
        const reconnected = peerConnectionRef.current.attemptReconnection(() => {
          // On reconnect: creator creates offer, joiner waits for offer
          peerConnectionRef.current.reconnect(isCreator, isCreator ? peerConnectionRef.current.createOffer : null);
        });
        if (!reconnected) {
          setReconnecting(false);
        }
      }
    } else if (state === 'connecting' || state === 'checking') {
      setStatus('connecting');
    }
  }, [socketConnected, isCreator]);

  // Peer connection hook
  const peerConnection = usePeerConnection(
    remoteVideoRef,
    localStreamRef,
    (signalData) => sendSignal(signalData),
    handlePeerConnectionStateChange
  );

  // Store peer connection in ref for use in callbacks
  useEffect(() => {
    peerConnectionRef.current = peerConnection;
  }, [peerConnection]);

  // Handle socket connection
  const handleSocketConnect = useCallback(() => {
    console.log('[useRoomConnection] Socket connected, joining room...');
    joinSocketRoom(
      () => {
        // On success
        setError(null);
        // If peer connection exists and was connected, try to reconnect
        if (peerConnection.peerConnectionRef.current && 
            (peerConnection.peerConnectionRef.current.connectionState === 'connected' || 
             peerConnection.peerConnectionRef.current.connectionState === 'disconnected')) {
          // On reconnect: creator creates offer, joiner waits for offer
          peerConnection.reconnect(isCreator, isCreator ? peerConnection.createOffer : null);
        } else if (!peerConnection.peerConnectionRef.current) {
          // If peer connection doesn't exist, create it
          peerConnection.initPeerConnection();
          setStatus('connecting');
          // Creator waits for peer-joined event to create offer
          // Joiner waits for offer signal to create answer
        } else if (peerConnection.peerConnectionRef.current.connectionState !== 'connected') {
          // If peer connection exists but not connected, try to reconnect
          peerConnection.reconnect(isCreator, isCreator ? peerConnection.createOffer : null);
        }
      },
      (errorMsg) => {
        // On error
        setError(errorMsg);
        setStatus('disconnected');
      }
    );
  }, [joinSocketRoom, peerConnection, isCreator]);

  // Handle peer joined event
  const handlePeerJoined = useCallback(() => {
    if (isCreator) {
      // Creator: Initialize peer connection and create offer when peer joins
      if (!peerConnection.peerConnectionRef.current) {
        peerConnection.initPeerConnection();
      }
      setStatus('connecting');
      // Creator creates and sends offer to the joiner
      peerConnection.createOffer();
    }
  }, [isCreator, peerConnection]);

  // Handle peer left event
  const handlePeerLeft = useCallback(() => {
    setStatus('disconnected');
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
  }, [remoteVideoRef]);

  // Handle signaling messages (offer, answer, ICE candidates)
  const handleSignal = useCallback(async ({ type, payload }) => {
    if (!peerConnection.peerConnectionRef.current) {
      peerConnection.initPeerConnection();
    }
    await peerConnection.handleSignal({ type, payload });
  }, [peerConnection]);

  // Start the connection process
  const start = useCallback(async () => {
    try {
      setStatus('waiting');
      setError(null);
      console.log('[useRoomConnection] Starting connection process...');
      console.log('[useRoomConnection] Room ID:', roomId);
      console.log('[useRoomConnection] Is Creator:', isCreator);

      // Step 1: Get user media
      console.log('[useRoomConnection] Step 1: Requesting camera/microphone access...');
      await getUserMedia();

      // Step 2: Connect to socket server
      console.log('[useRoomConnection] Step 2: Connecting to socket server...');
      await connectSocket(handleSocketConnect, handleSignal, handlePeerJoined, handlePeerLeft);
    } catch (err) {
      console.error('[useRoomConnection] ✗ Start function error:', err);
      console.error('[useRoomConnection] Error details:', {
        name: err.name,
        message: err.message,
        stack: err.stack
      });
      
      // Error is already set by the respective hooks
      const finalError = mediaError || socketError || err.message || 'An error occurred while starting the connection.';
      setError(finalError);
      setStatus('disconnected');
    }
  }, [roomId, isCreator, getUserMedia, connectSocket, handleSocketConnect, handleSignal, handlePeerJoined, handlePeerLeft, mediaError, socketError]);

  // End the call
  const endCall = useCallback(() => {
    console.log('[useRoomConnection] Ending call...');
    
    // Stop media stream
    stopStream();
    
    // Close peer connection
    peerConnection.close();
    
    // Disconnect socket
    disconnectSocket();
    
    setStatus('disconnected');
    setReconnecting(false);
    setRetryCount(0);
    setError(null);
  }, [stopStream, peerConnection, disconnectSocket]);

  // Handle retry
  const handleRetry = useCallback(() => {
    console.log('[useRoomConnection] Retry button clicked - cleaning up and restarting...');
    setError(null);
    setStatus('waiting');
    setReconnecting(false);
    setRetryCount(0);
    
    // Clean up existing connections
    endCall();
    
    // Small delay before restarting to ensure cleanup is complete
    setTimeout(() => {
      console.log('[useRoomConnection] Restarting connection...');
      start();
    }, 500);
  }, [endCall, start]);

  // Update reconnecting state based on socket reconnection
  useEffect(() => {
    setReconnecting(socketReconnecting);
    setRetryCount(socketRetryCount);
  }, [socketReconnecting, socketRetryCount]);

  // Update error state
  useEffect(() => {
    const finalError = mediaError || socketError;
    if (finalError) {
      setError(finalError);
    }
  }, [mediaError, socketError]);

  return {
    status,
    error,
    reconnecting,
    retryCount,
    muted,
    videoOff,
    toggleMute,
    toggleVideo,
    start,
    endCall,
    handleRetry,
    copyRoomId: () => roomId
  };
};

