# Code Interview Platform - Backend

Express.js backend server with Socket.io for real-time collaboration.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file (see `.env.example`):
```
PORT=3001
FRONTEND_URL=http://localhost:5173
```

3. Start the server:
```bash
npm start
```

Or for development:
```bash
npm run dev
```

## API Endpoints

- `POST /api/rooms` - Create a new room
- `GET /api/rooms/:roomId` - Get room information

## WebSocket Events

### Client -> Server
- `join-room` - Join a room with roomId
- `code-update` - Send code updates to the room

### Server -> Client
- `code-update` - Receive code updates from other users
- `user-joined` - Notification when a user joins
- `user-left` - Notification when a user leaves

## Architecture

The backend uses in-memory storage for rooms. For production, consider using Redis or a database for persistence and scalability.

