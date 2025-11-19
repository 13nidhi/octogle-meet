/**
 * WebRTC Signaling Server
 * Handles signaling messages between clients for peer-to-peer connections
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);

// Initialize Socket.io server with CORS configuration
// Allows connections from any origin (configure appropriately for production)
const io = new Server(server, {
  cors: { origin: '*' }
});

const PORT = process.env.PORT || 4000;

// In-memory room storage: { roomId: Set<socketId> }
// Each room supports up to 2 participants (1-on-1 video calls)
const rooms = {};

io.on('connection', (socket) => {
  console.log('socket connected', socket.id);

  /**
   * Create a new room
   * @param {string} roomId - Unique identifier for the room
   * @param {Function} cb - Callback function to return result
   * @returns {Object} { ok: boolean, reason?: string }
   */
  socket.on('create-room', (roomId, cb) => {
    if (rooms[roomId]) {
      cb && cb({ ok: false, reason: 'ROOM_ALREADY_EXISTS' });
      return;
    }
    
    // Create new room with creator as first participant
    rooms[roomId] = new Set([socket.id]);
    socket.join(roomId);
    cb && cb({ ok: true });
    console.log(`room created ${roomId} by ${socket.id}`);
  });

  /**
   * Join an existing room
   * Allows a second participant to join a room created by another user
   */
  socket.on('join-room', (roomId, cb) => {
    const room = rooms[roomId];
    
    if (!room) {
      cb && cb({ ok: false, reason: 'ROOM_NOT_FOUND' });
      return;
    }
    
    // Max 2 participants for 1-on-1 calls
    if (room.size >= 2) {
      cb && cb({ ok: false, reason: 'ROOM_FULL' });
      return;
    }
    
    // Add participant to room
    room.add(socket.id);
    socket.join(roomId);
    cb && cb({ ok: true });
    
    // Notify existing participants to start WebRTC connection
    socket.to(roomId).emit('peer-joined', { socketId: socket.id });
    console.log(`${socket.id} joined room ${roomId}`);
  });

  /**
   * Forward WebRTC signaling messages (offer, answer, ICE candidates)
   * @param {Object} data - { roomId, type, payload }
   */
  socket.on('signal', ({ roomId, type, payload }) => {
    // Forward signaling message to other participants in the room
    // This enables WebRTC offer/answer exchange and ICE candidate negotiation
    socket.to(roomId).emit('signal', { from: socket.id, type, payload });
  });

  /**
   * Handle explicit room leave request
   * @param {string} roomId - Room identifier
   */
  socket.on('leave-room', (roomId) => {
    leaveRoom(socket, roomId);
  });

  /**
   * Handle socket disconnection - automatically removes from all rooms
   */
  socket.on('disconnect', () => {
    console.log('socket disconnected', socket.id);
    for (const rid of Object.keys(rooms)) {
      if (rooms[rid].has(socket.id)) {
        leaveRoom(socket, rid);
      }
    }
  });

  /**
   * Remove socket from room and notify other participants
   * @param {Socket} socket - The socket instance
   * @param {string} roomId - Room identifier
   */
  function leaveRoom(socket, roomId) {
    if (!rooms[roomId]) return;
    
    rooms[roomId].delete(socket.id);
    socket.leave(roomId);
    
    // Notify remaining participants that a peer has left
    socket.to(roomId).emit('peer-left', { socketId: socket.id });
    
    // Clean up empty rooms to prevent memory leaks
    if (rooms[roomId].size === 0) delete rooms[roomId];
    
    console.log(`${socket.id} left room ${roomId}`);
  }
});

app.get('/', (req, res) => res.send('Signaling server running'));

server.listen(PORT, () => console.log(`Signaling server listening on ${PORT}`));
