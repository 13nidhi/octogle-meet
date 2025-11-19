/**
 * Controls Component - Video Call Controls
 * 
 * Provides UI controls for managing the video call:
 * - Toggle microphone mute/unmute
 * - Toggle camera on/off
 * - End call button
 * 
 * @component
 * @param {Object} props - Component props
 * @param {boolean} props.muted - Current mute state of microphone
 * @param {boolean} props.videoOff - Current state of camera (on/off)
 * @param {Function} props.onToggleMute - Callback function to toggle mute
 * @param {Function} props.onToggleVideo - Callback function to toggle video
 * @param {Function} props.onEndCall - Callback function to end the call
 * @returns {JSX.Element} Control buttons for video call
 */

import React from 'react';

export default function Controls({ muted, videoOff, onToggleMute, onToggleVideo, onEndCall }) {
  return (
    <div className="controls">
      <button onClick={onToggleMute} title={muted ? 'Unmute' : 'Mute'}>
        {muted ? (
          <svg className="control-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
          </svg>
        ) : (
          <svg className="control-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        )}
      </button>
      <button onClick={onToggleVideo} title={videoOff ? 'Video On' : 'Video Off'}>
        {videoOff ? (
          <svg className="control-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
          </svg>
        ) : (
          <svg className="control-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        )}
      </button>
      <button className="danger" onClick={onEndCall}>End Call</button>
    </div>
  );
}
