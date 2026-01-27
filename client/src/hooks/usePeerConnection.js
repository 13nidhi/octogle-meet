import { useRef, useCallback, useState } from 'react';
import { ICE_SERVERS, MAX_RECONNECT_ATTEMPTS, INITIAL_RECONNECT_DELAY } from '../utils/socketConfig';

/**
 * Custom hook for managing WebRTC peer connection
 * @param {React.RefObject} remoteVideoRef - Ref to the remote video element
 * @param {React.RefObject} localStreamRef - Ref to the local media stream
 * @param {Function} onSendSignal - Function to send signaling messages
 * @param {Function} onConnectionStateChange - Callback when connection state changes
 * @returns {Object} Peer connection state and methods
 */
export const usePeerConnection = (remoteVideoRef, localStreamRef, onSendSignal, onConnectionStateChange) => {
  const pcRef = useRef(null);
  const [connectionState, setConnectionState] = useState('new'); // new | connecting | connected | disconnected | failed | closed
  const peerReconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef(null);

  /**
   * Initialize the peer connection
   */
  const initPeerConnection = useCallback(() => {
    if (pcRef.current) return;
    
    console.log('[usePeerConnection] Initializing peer connection...');
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    //stores the RTCPeerConnection instance
    pcRef.current = pc;

    // Add local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => pc.addTrack(t, localStreamRef.current));
    }

    pc.ontrack = (event) => {
      console.log('[usePeerConnection] Received remote track');
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
      setConnectionState('connected');
      if (onConnectionStateChange) {
        onConnectionStateChange('connected');
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && onSendSignal) {
        onSendSignal({ type: 'ice-candidate', payload: event.candidate });
      }
    };

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      console.log('[usePeerConnection] Peer connection state changed:', state);
      setConnectionState(state);
      
      if (onConnectionStateChange) {
        onConnectionStateChange(state);
      }
      
      if (state === 'connected') {
        peerReconnectAttemptsRef.current = 0; // Reset retry count on successful connection
      } else if (state === 'disconnected' || state === 'failed') {
        // Attempt to reconnect if needed
        // Note: Reconnection logic is handled by useRoomConnection
      }
    };

    // Handle ICE connection state changes
    pc.oniceconnectionstatechange = () => {
      const iceState = pc.iceConnectionState;
      console.log('[usePeerConnection] ICE connection state changed:', iceState);
      
      if (iceState === 'failed' || iceState === 'disconnected') {
        // If needed, try to restart ICE or reconnect
        // Note: Reconnection logic is handled by useRoomConnection
      }
    };

    // Handle errors
    pc.onerror = (error) => {
      console.error('[usePeerConnection] Peer connection error:', error);
      // Note: Reconnection logic is handled by useRoomConnection
    };
  }, [remoteVideoRef, localStreamRef, onSendSignal, onConnectionStateChange]);

  /**
   * Create and send an offer
   * Creator creates offer and sends it to joiner
   */
  const createOffer = useCallback(async () => {
    try {
      if (!pcRef.current) {
        console.warn('[usePeerConnection] Peer connection not initialized, initializing now...');
        initPeerConnection();
      }
      
      const pc = pcRef.current;
      console.log('[usePeerConnection] Creating offer...');
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      //send offer 
      if (onSendSignal) {
        onSendSignal({ type: 'offer', payload: pc.localDescription });
      }
    } catch (err) {
      console.error('[usePeerConnection] createOffer error', err);
      throw err;
    }
  }, [initPeerConnection, onSendSignal]);

  /**
   * Handle incoming offer
   * Joiner receives offer from creator and creates/sends answer
   */
  const handleOffer = useCallback(async (offer) => {
    try {
      if (!pcRef.current) {
        initPeerConnection();
      }
      
      const pc = pcRef.current;
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      
      if (onSendSignal) {
        onSendSignal({ type: 'answer', payload: pc.localDescription });
      }
    } catch (err) {
      console.error('[usePeerConnection] handleOffer error', err);
      throw err;
    }
  }, [initPeerConnection, onSendSignal]);

  /**
   * Handle incoming answer
   */
  const handleAnswer = useCallback(async (answer) => {
    try {
      if (!pcRef.current) {
        console.warn('[usePeerConnection] Peer connection not initialized');
        return;
      }
      
      const pc = pcRef.current;
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
    } catch (err) {
      console.error('[usePeerConnection] handleAnswer error', err);
      throw err;
    }
  }, []);

  /**
   * Handle incoming ICE candidate
   */
  const handleIceCandidate = useCallback(async (candidate) => {
    try {
      if (!pcRef.current) {
        console.warn('[usePeerConnection] Peer connection not initialized');
        return;
      }
      
      const pc = pcRef.current;
      await pc.addIceCandidate(candidate);
    } catch (err) {
      console.warn('[usePeerConnection] Error adding ICE candidate', err);
    }
  }, []);

  /**
   * Handle incoming signal (offer, answer, or ice-candidate) from socket
   */
  const handleSignal = useCallback(async ({ type, payload }) => {
    if (type === 'offer') {
      await handleOffer(payload);
    } else if (type === 'answer') {
      await handleAnswer(payload);
    } else if (type === 'ice-candidate') {
      await handleIceCandidate(payload);
    }
  }, [handleOffer, handleAnswer, handleIceCandidate]);

  /**
   * Attempt to reconnect peer connection with exponential backoff
   */
  const attemptReconnection = useCallback((onReconnect) => {
    // Check if we've exceeded max attempts
    if (peerReconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
      console.log('[usePeerConnection] Max peer reconnection attempts reached');
      return false;
    }

    // Increment retry count
    peerReconnectAttemptsRef.current += 1;

    // Calculate exponential backoff delay
    const delay = Math.min(
      INITIAL_RECONNECT_DELAY * Math.pow(2, peerReconnectAttemptsRef.current - 1),
      16000 // Max 16 seconds
    );

    console.log(`[usePeerConnection] Attempting peer reconnection (attempt ${peerReconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS}) in ${delay}ms`);

    // Clear any existing timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    // Schedule reconnection attempt
    reconnectTimeoutRef.current = setTimeout(() => {
      if (onReconnect) {
        onReconnect();
      }
    }, delay);

    return true;
  }, []);

  /**
   * Reconnect peer connection
   */
  const reconnect = useCallback((isCreator, createOfferFn) => {
    // Close existing peer connection if any
    if (pcRef.current) {
      try {
        pcRef.current.close();
      } catch (e) {
        console.warn('[usePeerConnection] Error closing peer connection:', e);
      }
      pcRef.current = null;
    }

    // Reinitialize peer connection
    if (localStreamRef.current) {
      initPeerConnection();
      
      // Creator creates offer on reconnect, joiner waits for offer
      if (isCreator && createOfferFn) {
        createOfferFn();
      }
    }
  }, [initPeerConnection, localStreamRef]);

  /**
   * Close the peer connection
   */
  const close = useCallback(() => {
    // Clear any pending reconnection attempts
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    // Reset peer reconnection attempts
    peerReconnectAttemptsRef.current = 0;
    
    if (pcRef.current) {
      try {
        pcRef.current.close();
      } catch (e) {
        console.warn('[usePeerConnection] Error closing peer connection:', e);
      }
      pcRef.current = null;
    }
    
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    
    setConnectionState('closed');
  }, [remoteVideoRef]);

  return {
    peerConnection: pcRef.current,
    peerConnectionRef: pcRef,
    connectionState,
    initPeerConnection,
    createOffer,
    handleSignal,
    attemptReconnection,
    reconnect,
    close
  };
};

