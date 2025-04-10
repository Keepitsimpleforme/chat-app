require('dotenv').config();
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const { Server } = require('socket.io');

// Initialize Express app
const app = express();

// Middleware
app.use(cors({
  origin: [
    process.env.FRONTEND_URL,
    "http://localhost:3000",
    "https://chat-app-gelj.vercel.app",
    "https://chat-app-gelj-dr53ufgs0-keepitsimpleformes-projects.vercel.app"
  ],
  credentials: true
}));
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  const now = new Date().toISOString();
  console.log(`[${now}] ${req.method} ${req.url}`);
  if (req.method === 'POST') {
    console.log('Request body:', req.body);
  }
  next();
});

// DB connection
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/chatApp";
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

// Routes
const authRoutes = require('./routes/authroutes');
const userRoutes = require('./routes/userroutes');
const messageRoutes = require('./routes/messageroutes');

// Middleware
const authMiddleware = require('./middlware/authmiddleware');

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/messages', authMiddleware, messageRoutes);

// Server and Socket.io setup
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      process.env.FRONTEND_URL,
      "http://localhost:3000",
      "https://chat-app-gelj.vercel.app",
      "https://chat-app-gelj-dr53ufgs0-keepitsimpleformes-projects.vercel.app"
    ],
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Initialize socket logic
require('./socket')(io);

// Health check endpoint
app.get("/", (req, res) => {
  res.send("Chat App API is running");
});

// Start server
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));