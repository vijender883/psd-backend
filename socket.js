// socket.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

// Create Express app and HTTP server
const app = express();
const server = http.createServer(app);

// Create Socket.IO server with CORS configuration
const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:3000',
      'http://localhost:3002',
      'https://devui.alumnx.com',
      'https://alumnx.com',
      'https://psd-ui-omega.vercel.app',
      'https://practicalsystemdesign.com'
    ],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Handle socket connections
io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);
  
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

module.exports = { app, server, io };