const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const User = require("./models/userModel");

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // JWT Handshake
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error("Authentication error: No token provided"));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = { id: decoded.userId };
      next();
    } catch (err) {
      next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`[Socket] User ${socket.user.id} connected, socket ID: ${socket.id}`);

    // Join a private room for the user
    socket.join(`user_${socket.user.id}`);

    socket.on("join_room", (conversationId) => {
      // In Phase 2, we will add verification that the user belongs to this conversation
      socket.join(`conversation_${conversationId}`);
      console.log(`[Socket] User ${socket.user.id} joined conversation ${conversationId}`);
    });

    socket.on("leave_room", (conversationId) => {
      socket.leave(`conversation_${conversationId}`);
      console.log(`[Socket] User ${socket.user.id} left conversation ${conversationId}`);
    });

    socket.on("send_message", async (data) => {
      const { conversation_id, content, receiver_id } = data;
      const sender_id = socket.user.id;

      try {
        const Message = require("./models/messageModel"); // require here to avoid circular dependency

        // Check for blocks before proceeding
        const blockStatus = await User.isBlocked(sender_id, receiver_id);
        if (blockStatus.isBlocked) {
          return socket.emit("error", { message: "Cannot send message: sender or receiver is blocked" });
        }
        
        // Security check: is user in this conversation?
        const isParticipant = await Message.isParticipant(conversation_id, sender_id);
        if (!isParticipant) {
          return socket.emit("error", { message: "Unauthorized to send to this conversation" });
        }

        const message = await Message.createMessage({
          conversation_id,
          sender_id,
          content
        });

        // Broadcast to the conversation room
        io.to(`conversation_${conversation_id}`).emit("new_message", message);
        
        // Notify receiver's private room for inbox updates
        io.to(`user_${receiver_id}`).emit("inbox_update", { conversation_id });
        
      } catch (err) {
        console.error("[Socket] Error in send_message:", err);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    socket.on("disconnect", () => {
      console.log(`[Socket] User ${socket.user.id} disconnected`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};

module.exports = { initSocket, getIO };
