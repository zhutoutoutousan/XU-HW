import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';

export const socket = io(SOCKET_URL, {
	autoConnect: true,
	transports: ['websocket', 'polling'],
	timeout: 20000,
	reconnection: true,
	reconnectionAttempts: 5,
	reconnectionDelay: 1000,
	reconnectionDelayMax: 5000,
});

// Socket event handlers
socket.on('connect', () => {
	console.log('Connected to server via WebSocket');
});

socket.on('disconnect', () => {
	console.log('Disconnected from server');
});

socket.on('connect_error', (error) => {
	console.error('Socket connection error:', error);
});

socket.on('reconnect', (attemptNumber) => {
	console.log(`Reconnected to server after ${attemptNumber} attempts`);
});

socket.on('reconnect_error', (error) => {
	console.error('Socket reconnection error:', error);
});

socket.on('reconnect_failed', () => {
	console.error('Socket reconnection failed');
});

export default socket; 