import React, { useEffect, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useRoomConnection } from '../hooks/useRoomConnection';
import Controls from '../components/Controls';
import { MAX_RECONNECT_ATTEMPTS } from '../utils/socketConfig';

export default function Room() {
  const { id: roomId } = useParams();
  const [searchParams] = useSearchParams();
  const isCreator = !!searchParams.get('creator');
  const navigate = useNavigate();

  const localVideoRef = useRef();
  const remoteVideoRef = useRef();

  const {
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
    handleRetry
  } = useRoomConnection(localVideoRef, remoteVideoRef, roomId, isCreator);

  useEffect(() => {
    start();
    return () => {
      endCall();
      navigate('/');
    };
    // eslint-disable-next-line
  }, []);

  const handleEndCall = () => {
    endCall();
    navigate('/');
  };

  const copyRoomId = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      alert('Room ID copied');
    } catch (e) {
      alert('Copy failed: ' + e.message);
    }
  };

  return (
    <div className="room-container">
      <div className="room-header">
        <div className="room-title-section">
          <h2 className="room-title">Room</h2>
          <span className="room-id">{roomId}</span>
        </div>
        <button className="copy-button" onClick={copyRoomId}>
          Copy Room ID
        </button>
      </div>

      <div className="status-section">
        <span className="status-label">Status:</span>
        <span className={`status-badge status-${status}`}>{status}</span>
        {reconnecting && (
          <div className="reconnecting-indicator">
            <div className="spinner"></div>
            <span className="reconnecting-text">
              Reconnecting... (Attempt {retryCount}/{MAX_RECONNECT_ATTEMPTS})
            </span>
          </div>
        )}
      </div>

      {error && (
        <div className="error-section" style={{
          padding: '15px',
          margin: '15px 0',
          backgroundColor: '#fee',
          border: '1px solid #fcc',
          borderRadius: '8px',
          color: '#c33'
        }}>
          <div style={{ marginBottom: '10px', fontWeight: 'bold' }}>⚠️ Error</div>
          <div style={{ marginBottom: '10px' }}>{error}</div>
          <button 
            onClick={handleRetry}
            style={{
              padding: '8px 16px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            Retry Connection
          </button>
        </div>
      )}

      <div className="videos-container">
        <div className="video-wrapper">
          <p className="video-label">Local</p>
          <video ref={localVideoRef} autoPlay playsInline muted className="video-element" />
          {(muted || videoOff) && (
            <div className="video-overlay">
              {muted && <span>🔇 Muted</span>}
              {muted && videoOff && <span> • </span>}
              {videoOff && <span>📹 Camera Off</span>}
            </div>
          )}
        </div>
        <div className="video-wrapper">
          <p className="video-label">Remote</p>
          <video ref={remoteVideoRef} autoPlay playsInline className="video-element" />
          {status === 'disconnected' && !reconnecting && (
            <div className="video-overlay error">Connection Lost</div>
          )}
          {reconnecting && (
            <div className="video-overlay warning">Reconnecting...</div>
          )}
        </div>
      </div>

      <Controls
        muted={muted}
        videoOff={videoOff}
        onToggleMute={toggleMute}
        onToggleVideo={toggleVideo}
        onEndCall={handleEndCall}
      />
    </div>
  );
}
