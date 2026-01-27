import { useState, useRef, useCallback } from 'react';
import { formatErrorMessage } from '../utils/errorMessages';

/**
 * Custom hook for managing media stream (camera and microphone)
 * @param {React.RefObject} localVideoRef - Ref to the local video element
 * @returns {Object} Media stream state and controls
 */
export const useMediaStream = (localVideoRef) => {
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const [error, setError] = useState(null);
  const localStreamRef = useRef(null);

  /**
   * Request access to user's camera and microphone
   * @returns {Promise<MediaStream>} The media stream
   */
  const getUserMedia = useCallback(async () => {
    try {
      console.log('[useMediaStream] Requesting camera/microphone access...');
      console.log('[useMediaStream] Browser:', navigator.userAgent);
      console.log('[useMediaStream] MediaDevices available:', !!navigator.mediaDevices);
      console.log('[useMediaStream] getUserMedia available:', !!navigator.mediaDevices?.getUserMedia);
      
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }, 
          audio: true 
        });
        console.log('[useMediaStream] ✓ Camera/microphone access granted');
        console.log('[useMediaStream] Stream tracks:', stream.getTracks().map(t => ({ kind: t.kind, enabled: t.enabled, readyState: t.readyState })));
      } catch (mediaError) {
        console.error('[useMediaStream] ✗ getUserMedia error details:', {
          name: mediaError.name,
          message: mediaError.message,
          constraint: mediaError.constraint
        });
        // Try with simpler constraints if the first attempt failed
        console.log('[useMediaStream] Retrying with simpler constraints...');
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          console.log('[useMediaStream] ✓ Camera/microphone access granted (with fallback constraints)');
        } catch (fallbackError) {
          console.error('[useMediaStream] ✗ Fallback getUserMedia also failed:', fallbackError);
          throw fallbackError; // Re-throw to be caught by outer catch
        }
      }
      // Stores the MediaStream object
      // Used to add tracks to WebRTC, toggle mute/video, stop tracks
      // Not for display
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        //Set the local video element to media stream
        localVideoRef.current.srcObject = stream;
        console.log('[useMediaStream] ✓ Local video element updated');
      } else {
        console.warn('[useMediaStream] ⚠ Local video ref not available');
      }

      setError(null);
      return stream;
    } catch (err) {
      console.error('[useMediaStream] ✗ getUserMedia error:', err);
      const errorMessage = formatErrorMessage(err);
      setError(errorMessage);
      throw err;
    }
  }, [localVideoRef]);

  /**
   * Toggle mute/unmute audio
   */
  const toggleMute = useCallback(() => {
    const s = localStreamRef.current;
    if (!s) return;
    s.getAudioTracks().forEach((t) => (t.enabled = !t.enabled));
    setMuted((m) => !m);
  }, []);

  /**
   * Toggle video on/off
   */
  const toggleVideo = useCallback(() => {
    const s = localStreamRef.current;
    if (!s) return;
    s.getVideoTracks().forEach((t) => (t.enabled = !t.enabled));
    setVideoOff((v) => !v);
  }, []);

  /**
   * Stop all media tracks and clean up
   */
  const stopStream = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    setMuted(false);
    setVideoOff(false);
    setError(null);
  }, [localVideoRef]);

  return {
    stream: localStreamRef.current,
    streamRef: localStreamRef,
    muted,
    videoOff,
    error,
    getUserMedia,
    toggleMute,
    toggleVideo,
    stopStream
  };
};

