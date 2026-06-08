import { io } from 'socket.io-client';

/**
 * Singleton Socket.io client.
 * - In development: connects to http://localhost:5000
 * - In production:  connects to VITE_BACKEND_URL environment variable
 *   (set this in your Vercel project settings)
 */
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

const socket = io(BACKEND_URL, {
  autoConnect: false,
  transports: ['websocket', 'polling'],
});

export default socket;
