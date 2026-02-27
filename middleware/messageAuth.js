const Message = require("../models/messageModel");

const canAccessConversation = async (req, res, next) => {
  const conversationId = req.params.conversationId || req.body.conversation_id;
  const userId = req.user.id;

  if (!conversationId) {
    return res.status(400).json({ message: "Conversation ID is required" });
  }

  try {
    const isParticipant = await Message.isParticipant(conversationId, userId);
    if (!isParticipant) {
      return res.status(403).json({ message: "Unauthorized: You are not a participant in this conversation" });
    }
    next();
  } catch (err) {
    res.status(500).json({ message: "Error verifying conversation access" });
  }
};

module.exports = { canAccessConversation };
