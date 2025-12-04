import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.roomId = null;
  }

  connect(roomId) {
    if (this.socket?.connected) {
      return;
    }

    this.roomId = roomId;
    this.socket = io(import.meta.env.VITE_WS_URL || 'http://localhost:3001', {
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      console.log('Connected to server');
      this.socket.emit('join-room', roomId);
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.roomId = null;
    }
  }

  onCodeUpdate(callback) {
    if (this.socket) {
      this.socket.on('code-update', callback);
    }
  }

  onUserJoined(callback) {
    if (this.socket) {
      this.socket.on('user-joined', callback);
    }
  }

  onUserLeft(callback) {
    if (this.socket) {
      this.socket.on('user-left', callback);
    }
  }

  emitCodeUpdate(code, language) {
    if (this.socket) {
      this.socket.emit('code-update', { roomId: this.roomId, code, language });
    }
  }

  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }
}

export default new SocketService();

