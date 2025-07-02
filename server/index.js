import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);

// Production-ready CORS configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:4173',
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL
].filter(Boolean);

const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? allowedOrigins : "*",
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000
});

app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? allowedOrigins : "*",
  credentials: true
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, '../dist')));

// Store waiting users and active chats
let waitingUsers = [];
let activeChats = new Map();
let userSockets = new Map();
let totalConnections = 0;
let totalChatsCreated = 0;

// Generate random room ID
function generateRoomId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Get random country/location
function getRandomLocation() {
  const locations = [
    'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 
    'France', 'Japan', 'Brazil', 'India', 'Mexico', 'Italy', 'Spain',
    'Netherlands', 'Sweden', 'Norway', 'South Korea', 'Singapore', 'Russia',
    'Argentina', 'Chile', 'South Africa', 'Egypt', 'Turkey', 'Poland',
    'Belgium', 'Switzerland', 'Austria', 'Denmark', 'Finland', 'Ireland',
    'New Zealand', 'Portugal', 'Greece', 'Czech Republic', 'Hungary',
    'Thailand', 'Malaysia', 'Philippines', 'Indonesia', 'Vietnam',
    'Morocco', 'Kenya', 'Nigeria', 'Ghana', 'Israel', 'UAE', 'Saudi Arabia',
    'Colombia', 'Peru', 'Venezuela', 'Ecuador', 'Uruguay', 'Paraguay'
  ];
  return locations[Math.floor(Math.random() * locations.length)];
}

// Clean up inactive connections
function cleanupInactiveConnections() {
  const now = Date.now();
  
  // Remove inactive waiting users (older than 5 minutes)
  const initialWaitingCount = waitingUsers.length;
  waitingUsers = waitingUsers.filter(user => {
    const socket = io.sockets.sockets.get(user.id);
    return socket && socket.connected && (now - user.joinTime) < 300000;
  });
  
  if (waitingUsers.length !== initialWaitingCount) {
    console.log(`🧹 Cleaned up ${initialWaitingCount - waitingUsers.length} inactive waiting users`);
  }
  
  // Clean up disconnected chats
  const initialChatCount = activeChats.size;
  for (const [roomId, chat] of activeChats.entries()) {
    const activeUsers = chat.users.filter(user => {
      const socket = io.sockets.sockets.get(user.id);
      return socket && socket.connected;
    });
    
    if (activeUsers.length === 0 || (now - chat.startTime.getTime()) > 3600000) { // 1 hour timeout
      activeChats.delete(roomId);
    }
  }
  
  if (activeChats.size !== initialChatCount) {
    console.log(`🧹 Cleaned up ${initialChatCount - activeChats.size} inactive chats`);
  }
}

// Run cleanup every 30 seconds
setInterval(cleanupInactiveConnections, 30000);

// Log stats every 5 minutes
setInterval(() => {
  console.log(`📊 Stats - Connected: ${totalConnections}, Waiting: ${waitingUsers.length}, Active Chats: ${activeChats.size}, Total Chats Created: ${totalChatsCreated}`);
}, 300000);

io.on('connection', (socket) => {
  totalConnections++;
  console.log(`🌍 User connected: ${socket.id} (Total: ${totalConnections})`);

  // Send current stats to new user
  socket.emit('stats-update', {
    onlineUsers: totalConnections,
    activeChats: activeChats.size
  });

  // Handle user joining the waiting queue
  socket.on('find-stranger', (userData) => {
    try {
      const user = {
        id: socket.id,
        username: userData.username || `User${Math.floor(Math.random() * 10000)}`,
        location: userData.location || getRandomLocation(),
        interests: userData.interests || [],
        joinTime: Date.now()
      };

      userSockets.set(socket.id, user);

      // Try to match with someone from waiting list
      if (waitingUsers.length > 0) {
        const partner = waitingUsers.shift();
        const partnerSocket = io.sockets.sockets.get(partner.id);
        
        // Check if partner is still connected
        if (partnerSocket && partnerSocket.connected) {
          const roomId = generateRoomId();
          totalChatsCreated++;

          // Create chat room
          activeChats.set(roomId, {
            users: [user, partner],
            messages: [],
            startTime: new Date(),
            roomId: roomId
          });

          // Join both users to the room
          socket.join(roomId);
          partnerSocket.join(roomId);

          // Notify both users they found a match
          socket.emit('stranger-found', {
            roomId,
            partner: {
              username: partner.username,
              location: partner.location,
              interests: partner.interests
            }
          });

          partnerSocket.emit('stranger-found', {
            roomId,
            partner: {
              username: user.username,
              location: user.location,
              interests: user.interests
            }
          });

          console.log(`✅ Match #${totalChatsCreated}: ${user.username} (${user.location}) ↔ ${partner.username} (${partner.location}) in room ${roomId}`);
        } else {
          // Partner disconnected, add current user to waiting list
          waitingUsers.push(user);
          socket.emit('waiting-for-stranger');
          console.log(`⏳ ${user.username} added to waiting list (partner disconnected)`);
        }
      } else {
        // Add to waiting list
        waitingUsers.push(user);
        socket.emit('waiting-for-stranger');
        console.log(`⏳ ${user.username} (${user.location}) added to waiting list`);
      }

      // Broadcast updated stats
      io.emit('stats-update', {
        onlineUsers: totalConnections,
        activeChats: activeChats.size
      });

    } catch (error) {
      console.error('Error in find-stranger:', error);
      socket.emit('error', { message: 'Failed to find stranger' });
    }
  });

  // Handle sending messages
  socket.on('send-message', (data) => {
    try {
      const { roomId, message, timestamp } = data;
      const chat = activeChats.get(roomId);
      
      if (chat && message && message.trim()) {
        const user = userSockets.get(socket.id);
        if (user) {
          const messageData = {
            id: Date.now() + Math.random(),
            username: user.username,
            message: message.trim().substring(0, 500), // Limit message length
            timestamp: timestamp || new Date().toISOString(),
            senderId: socket.id
          };

          chat.messages.push(messageData);
          
          // Keep only last 100 messages per chat
          if (chat.messages.length > 100) {
            chat.messages = chat.messages.slice(-100);
          }
          
          // Send message to all users in the room
          io.to(roomId).emit('new-message', messageData);
          
          console.log(`💬 Message in ${roomId}: ${user.username}: ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}`);
        }
      }
    } catch (error) {
      console.error('Error in send-message:', error);
    }
  });

  // Handle user typing
  socket.on('typing', (data) => {
    try {
      const { roomId, isTyping } = data;
      const user = userSockets.get(socket.id);
      
      if (user && roomId) {
        socket.to(roomId).emit('user-typing', {
          username: user.username,
          isTyping: Boolean(isTyping)
        });
      }
    } catch (error) {
      console.error('Error in typing:', error);
    }
  });

  // Handle ending chat
  socket.on('end-chat', (roomId) => {
    try {
      const chat = activeChats.get(roomId);
      
      if (chat) {
        console.log(`🔚 Chat ended in room ${roomId}`);
        
        // Notify all users in the room that chat ended
        io.to(roomId).emit('chat-ended');
        
        // Remove users from room
        chat.users.forEach(user => {
          const userSocket = io.sockets.sockets.get(user.id);
          if (userSocket) {
            userSocket.leave(roomId);
          }
        });
        
        // Delete the chat
        activeChats.delete(roomId);

        // Broadcast updated stats
        io.emit('stats-update', {
          onlineUsers: totalConnections,
          activeChats: activeChats.size
        });
      }
    } catch (error) {
      console.error('Error in end-chat:', error);
    }
  });

  // Handle disconnect
  socket.on('disconnect', (reason) => {
    totalConnections = Math.max(0, totalConnections - 1);
    console.log(`👋 User disconnected: ${socket.id} (Reason: ${reason}) (Total: ${totalConnections})`);
    
    try {
      // Remove from waiting list
      const waitingIndex = waitingUsers.findIndex(user => user.id === socket.id);
      if (waitingIndex !== -1) {
        const removedUser = waitingUsers.splice(waitingIndex, 1)[0];
        console.log(`🗑️ Removed ${removedUser.username} from waiting list`);
      }
      
      // Handle active chats
      for (const [roomId, chat] of activeChats.entries()) {
        const userInChat = chat.users.find(user => user.id === socket.id);
        
        if (userInChat) {
          console.log(`💔 Partner disconnected from room ${roomId}`);
          
          // Notify other users in the room
          socket.to(roomId).emit('partner-disconnected');
          
          // Remove all users from the room
          chat.users.forEach(user => {
            const userSocket = io.sockets.sockets.get(user.id);
            if (userSocket && user.id !== socket.id) {
              userSocket.leave(roomId);
            }
          });
          
          // Clean up the chat
          activeChats.delete(roomId);
          break;
        }
      }
      
      // Remove from user sockets
      userSockets.delete(socket.id);

      // Broadcast updated stats
      io.emit('stats-update', {
        onlineUsers: totalConnections,
        activeChats: activeChats.size
      });

    } catch (error) {
      console.error('Error in disconnect handler:', error);
    }
  });

  // Handle connection errors
  socket.on('error', (error) => {
    console.error(`Socket error for ${socket.id}:`, error);
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    connections: totalConnections,
    waitingUsers: waitingUsers.length,
    activeChats: activeChats.size,
    totalChatsCreated: totalChatsCreated,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Stats endpoint
app.get('/stats', (req, res) => {
  res.json({
    totalConnections,
    waitingUsers: waitingUsers.length,
    activeChats: activeChats.size,
    totalChatsCreated,
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API endpoint for frontend stats
app.get('/api/stats', (req, res) => {
  res.json({
    onlineUsers: totalConnections,
    activeChats: activeChats.size,
    totalChatsCreated: totalChatsCreated
  });
});

// Serve React app for all other routes (SPA support)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 World Wide Stranger Chat Server running on port ${PORT}`);
  console.log(`🌍 Ready to connect strangers from around the world!`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📈 Stats: http://localhost:${PORT}/stats`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`🛑 ${signal} received, shutting down gracefully`);
  
  // Stop accepting new connections
  server.close(() => {
    console.log('✅ HTTP server closed');
    
    // Close all socket connections
    io.close(() => {
      console.log('✅ Socket.IO server closed');
      process.exit(0);
    });
  });

  // Force close after 10 seconds
  setTimeout(() => {
    console.error('❌ Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('UNHANDLED_REJECTION');
});