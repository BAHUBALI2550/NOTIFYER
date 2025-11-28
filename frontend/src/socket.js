import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

let socket;

export function initSocket(userId) {
  if (!socket) {
    socket = io(SOCKET_URL, { transports: ['websocket'] });
    socket.on('connect', () => {
      socket.emit('auth', { userId });
    });
  } else {
    socket.emit('auth', { userId });
  }
  return socket;
}

export function getSocket() {
  return socket;
}
