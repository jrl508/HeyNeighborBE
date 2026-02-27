const express = require("express");
const router = express.Router();
const messageController = require("../controllers/messageController");
const authenticate = require("../middleware/authMiddleware");
const { canAccessConversation } = require("../middleware/messageAuth");

// All messaging routes require authentication
router.use(authenticate);

// Get inbox
router.get("/conversations", messageController.getConversations);

// Send message (can create conversation if not exists)
router.post("/messages", messageController.sendMessage);

// Get messages for conversation (requires participation check)
router.get("/conversations/:conversationId/messages", canAccessConversation, messageController.getMessages);

// Mark as read
router.patch("/conversations/:conversationId/read", canAccessConversation, messageController.markAsRead);

// Archive a conversation
router.patch("/conversations/:conversationId/archive", canAccessConversation, messageController.archiveConversation);

// Unarchive a conversation
router.patch("/conversations/:conversationId/unarchive", canAccessConversation, messageController.unarchiveConversation);

// Block a user
router.post("/block", messageController.blockUser);

// Unblock a user
router.delete("/block/:userIdToUnblock", messageController.unblockUser);

// Get block status between two users
router.get("/block-status/:otherUserId", messageController.getBlockStatus);

module.exports = router;
