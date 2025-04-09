// lib/socket.ts
import { io } from 'socket.io-client';

const URL = 'http://localhost:5001'; // Replace with your backend URL
export const socket = io(URL, {
  withCredentials: true,
});