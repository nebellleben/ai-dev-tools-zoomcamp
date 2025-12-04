const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Configure CORS for Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// In-memory storage for rooms
const rooms = new Map();

// REST API Routes
app.post('/api/rooms', (req, res) => {
  try {
    let roomId;
    if (req.body && req.body.roomId) {
      roomId = req.body.roomId;
    } else {
      roomId = crypto.randomUUID();
    }
    const room = {
      roomId,
      createdAt: new Date().toISOString(),
      userCount: 0,
      code: '',
      language: 'javascript',
    };
    rooms.set(roomId, room);
    res.status(201).json(room);
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({ message: 'Error creating room', error: error.message });
  }
});

app.get('/api/rooms/:roomId', (req, res) => {
  const { roomId } = req.params;
  const room = rooms.get(roomId);
  
  if (!room) {
    return res.status(404).json({ 
      message: 'Room not found',
      code: 'ROOM_NOT_FOUND' 
    });
  }
  
  res.json(room);
});

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-room', (roomId) => {
    if (!roomId) {
      socket.emit('error', { message: 'Room ID is required' });
      return;
    }

    // Leave previous room if any
    if (socket.roomId) {
      socket.leave(socket.roomId);
      const prevRoom = rooms.get(socket.roomId);
      if (prevRoom) {
        prevRoom.userCount = Math.max(0, prevRoom.userCount - 1);
        io.to(socket.roomId).emit('user-left', { userCount: prevRoom.userCount });
      }
    }

    // Join new room
    socket.roomId = roomId;
    socket.join(roomId);

    // Initialize room if it doesn't exist
    if (!rooms.has(roomId)) {
      rooms.set(roomId, {
        roomId,
        createdAt: new Date().toISOString(),
        userCount: 0,
        code: '',
        language: 'javascript',
      });
    }

    const room = rooms.get(roomId);
    room.userCount += 1;

    // Send current room state to the new user
    socket.emit('code-update', {
      code: room.code,
      language: room.language,
    });

    // Notify all users in the room
    io.to(roomId).emit('user-joined', { userCount: room.userCount });

    console.log(`User ${socket.id} joined room ${roomId} (${room.userCount} users)`);
  });

  socket.on('code-update', ({ roomId, code, language }) => {
    if (!roomId || !socket.roomId || socket.roomId !== roomId) {
      return;
    }

    const room = rooms.get(roomId);
    if (!room) {
      return;
    }

    // Update room state
    room.code = code || '';
    if (language) {
      room.language = language;
    }

    // Broadcast to all users in the room except the sender
    socket.to(roomId).emit('code-update', {
      code: room.code,
      language: room.language,
    });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);

    if (socket.roomId) {
      const room = rooms.get(socket.roomId);
      if (room) {
        room.userCount = Math.max(0, room.userCount - 1);
        io.to(socket.roomId).emit('user-left', { userCount: room.userCount });

        // Clean up empty rooms after a delay (optional)
        // Store timeout ID so we can clear it in tests
        if (room.userCount === 0) {
          const timeoutId = setTimeout(() => {
            const currentRoom = rooms.get(socket.roomId);
            if (currentRoom && currentRoom.userCount === 0) {
              rooms.delete(socket.roomId);
              if (process.env.NODE_ENV !== 'test') {
                console.log(`Room ${socket.roomId} deleted (empty)`);
              }
            }
          }, 60000); // Delete after 1 minute of being empty
          // Store timeout ID on room for cleanup if needed
          room._cleanupTimeout = timeoutId;
        }
      }
    }
  });
});

// Export for testing
module.exports = { app, server, io, rooms };

// Only start server if this file is run directly
if (require.main === module) {
  const PORT = process.env.PORT || 3001;
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`WebSocket server ready for connections`);
  });
}

