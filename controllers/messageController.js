const Message = require("../models/messageModel");
const User = require("../models/userModel");
const { getIO } = require("../socket");

const messageController = {
  // Get all conversations for the logged-in user
  getConversations: async (req, res) => {
    try {
      const conversations = await Message.getUserConversations(req.user.id);
      res.json(conversations);
    } catch (err) {
      console.error("[messageController] Error fetching conversations:", err);
      res.status(500).json({ message: "Error fetching conversations" });
    }
  },

  // Get messages for a specific conversation
  getMessages: async (req, res) => {
    const { conversationId } = req.params;
    const { limit, offset } = req.query;

    try {
      const messages = await Message.getMessages(conversationId, limit, offset);
      // Messages are returned newest first for pagination, but UI usually wants oldest first
      res.json(messages.reverse());
    } catch (err) {
      console.error("[messageController] Error fetching messages:", err);
      res.status(500).json({ message: "Error fetching messages" });
    }
  },

  // Send a new message (used as a fallback or initial message)
  sendMessage: async (req, res) => {
    const { conversation_id, content, receiver_id, booking_id } = req.body;
    const sender_id = req.user.id;

    try {
      let conversationId = conversation_id;

      // Check for blocks before proceeding
      const blockStatus = await User.isBlocked(sender_id, receiver_id);
      if (blockStatus.isBlocked) {
        return res.status(403).json({ message: "Cannot send message: sender or receiver is blocked" });
      }

      // If no conversation_id, try to find or create one
      if (!conversationId) {
        if (!receiver_id) {
          return res.status(400).json({ message: "conversation_id or receiver_id is required" });
        }
        
        let conversation = await Message.findConversation([sender_id, receiver_id], booking_id);
        
        if (!conversation) {
          conversation = await Message.createConversation(booking_id, [sender_id, receiver_id]);
        }
        conversationId = conversation.id;
      }

      const message = await Message.createMessage({
        conversation_id: conversationId,
        sender_id,
        content,
      });

      // Emit via socket if possible
      try {
        const io = getIO();
        io.to(`conversation_${conversationId}`).emit("new_message", message);
        // Also notify the user's private room for inbox updates
        io.to(`user_${receiver_id}`).emit("inbox_update", { conversationId });
      } catch (socketErr) {
        console.warn("[messageController] Socket emission failed, message persisted though.");
      }

      res.status(201).json(message);
    } catch (err) {
      console.error("[messageController] Error sending message:", err);
      res.status(500).json({ message: "Error sending message" });
    }
  },

  // Mark messages in a conversation as read
  markAsRead: async (req, res) => {
    const { conversationId } = req.params;
    try {
      await Message.markAsRead(conversationId, req.user.id);
      res.json({ message: "Messages marked as read" });
    } catch (err) {
      res.status(500).json({ message: "Error marking messages as read" });
    }
  },

  // Archive a conversation for the user
  archiveConversation: async (req, res) => {
    const { conversationId } = req.params;
    try {
      await Message.archiveConversation(conversationId, req.user.id);
      res.status(200).json({ message: "Conversation archived" });
    } catch (err) {
      console.error("[messageController] Error archiving conversation:", err);
      res.status(500).json({ message: "Error archiving conversation" });
    }
  },

  // Unarchive a conversation for the user
  unarchiveConversation: async (req, res) => {
    const { conversationId } = req.params;
    try {
      await Message.unarchiveConversation(conversationId, req.user.id);
      res.status(200).json({ message: "Conversation unarchived" });
    } catch (err) {
      console.error("[messageController] Error unarchiving conversation:", err);
      res.status(500).json({ message: "Error unarchiving conversation" });
    }
  },

  // Block a user
  blockUser: async (req, res) => {
    const { userIdToBlock } = req.body;
    const blockerId = req.user.id;

    if (parseInt(userIdToBlock) === parseInt(blockerId)) {
      return res.status(400).json({ message: "Cannot block yourself" });
    }

    try {
      await User.blockUser(blockerId, userIdToBlock);
      res.status(200).json({ message: "User blocked successfully" });
    } catch (err) {
      if (err.code === '23505') { // Unique violation
        return res.status(409).json({ message: "User already blocked" });
      }
      console.error("[messageController] Error blocking user:", err);
      res.status(500).json({ message: "Error blocking user" });
    }
  },

  // Unblock a user
  unblockUser: async (req, res) => {
    const { userIdToUnblock } = req.params;
    const blockerId = req.user.id;

    try {
      const deleted = await User.unblockUser(blockerId, userIdToUnblock);
      if (deleted) {
        res.status(200).json({ message: "User unblocked successfully" });
      } else {
        res.status(404).json({ message: "Block not found" });
      }
    } catch (err) {
      console.error("[messageController] Error unblocking user:", err);
      res.status(500).json({ message: "Error unblocking user" });
    }
  },

  // Get block status between two users
  getBlockStatus: async (req, res) => {
    const { otherUserId } = req.params;
    const currentUserId = req.user.id;

    try {
      const { isBlocked, isBlockedByMe, isBlockedByOther } = await User.isBlocked(currentUserId, otherUserId);
      res.status(200).json({ isBlocked, isBlockedByMe, isBlockedByOther });
    } catch (err) {
      console.error("[messageController] Error getting block status:", err);
      res.status(500).json({ message: "Error getting block status" });
    }
  },
};

module.exports = messageController;
