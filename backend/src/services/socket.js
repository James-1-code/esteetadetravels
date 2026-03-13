const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/auth');

let io = null;

// Initialize Socket.io
const initializeSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 User connected: ${socket.userId}`);

    // Join user-specific room
    socket.join(`user:${socket.userId}`);

    // Join role-based room
    socket.join(`role:${socket.userRole}`);

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`🔌 User disconnected: ${socket.userId}`);
    });
  });

  console.log('✅ Socket.io initialized');
  return io;
};

// Get io instance
const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

// Emit to specific user
const emitToUser = (userId, event, data) => {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, data);
};

// Emit to role
const emitToRole = (role, event, data) => {
  if (!io) return;
  io.to(`role:${role}`).emit(event, data);
};

// Emit to all admins
const emitToAdmins = (event, data) => {
  emitToRole('admin', event, data);
};

// Broadcast to all connected clients
const broadcast = (event, data) => {
  if (!io) return;
  io.emit(event, data);
};

// Notification events
const notifyUser = (userId, notification) => {
  emitToUser(userId, 'notification:new', notification);
};

const notifyApplicationUpdate = (userId, application) => {
  emitToUser(userId, 'application:update', application);
};

const notifyPaymentReceived = (userId, payment) => {
  emitToUser(userId, 'payment:received', payment);
};

const notifyNewApplication = (application) => {
  emitToAdmins('application:new', application);
};

const notifyNewUser = (user) => {
  emitToAdmins('user:new', user);
};

module.exports = {
  initializeSocket,
  getIO,
  emitToUser,
  emitToRole,
  emitToAdmins,
  broadcast,
  notifyUser,
  notifyApplicationUpdate,
  notifyPaymentReceived,
  notifyNewApplication,
  notifyNewUser,
};
