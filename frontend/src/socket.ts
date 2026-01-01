import { io } from 'socket.io-client';

const URL = import.meta.env.VITE_API_URL || 'http://192.168.1.180:3000';

export const socket = io(URL, {
    autoConnect: true,
});
