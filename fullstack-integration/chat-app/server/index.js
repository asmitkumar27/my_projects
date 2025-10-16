// server/index.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors()); // Use cors middleware

const server = http.createServer(app);

// Initialize Socket.IO server and attach it to the HTTP server
// Add CORS configuration to allow connections from your React app's origin
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // The address of your React client
    methods: ["GET", "POST"],
  },
});

// Listen for a connection event
io.on('connection', (socket) => {
  console.log(`✅ User Connected: ${socket.id}`);

  // Listen for a 'send_message' event from a client
  socket.on('send_message', (data) => {
    // Broadcast the received message to all connected clients
    io.emit('receive_message', data);
  });

  // Listen for a disconnect event
  socket.on('disconnect', () => {
    console.log(`❌ User Disconnected: ${socket.id}`);
  });
});

const PORT = 4000;
server.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});