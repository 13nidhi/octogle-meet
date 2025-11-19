/**
 * Home Component - Landing Page
 * 
 * This is the entry point of the application where users can:
 * - Create a new video call room
 * - Join an existing room using a room ID
 * 
 * @component
 * @returns {JSX.Element} The home page with room creation and joining options
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

export default function Home() {
  const [joinId, setJoinId] = useState('');
  const navigate = useNavigate();

  const createRoom = () => {
    const id = uuidv4();
    navigate(`/room/${id}?creator=1`);
  };

  const joinRoom = () => {
    if (!joinId.trim()) return alert('Enter room ID');
    navigate(`/room/${joinId.trim()}`);
  };

  return (
    <div className="home">
      <div className="heading-section">
        <h1>Octogle Meet for everyone</h1>
        <p className="subtitle">Connect, collaborate and celebrate from anywhere</p>
      </div>

      <div className="card">
        <button className="primary" onClick={createRoom}>Create Room</button>
        <div className="join">
          <input
            placeholder="Enter room ID to join"
            value={joinId}
            onChange={(e) => setJoinId(e.target.value)}
          />
          <button onClick={joinRoom}>Join Room</button>
        </div>
      </div>
    </div>
  );
}
