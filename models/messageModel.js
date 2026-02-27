const db = require("../database/db");

const Message = {
  // Create a new conversation (optionally linked to a booking)
  createConversation: async (bookingId = null, participantIds = []) => {
    return await db.transaction(async (trx) => {
      const [conversation] = await trx("conversations")
        .insert({ booking_id: bookingId })
        .returning("*");

      const participants = participantIds.map((userId) => ({
        conversation_id: conversation.id,
        user_id: userId,
      }));

      await trx("conversation_participants").insert(participants);
      return conversation;
    });
  },

  // Find an existing conversation between participants (and optionally a booking)
  findConversation: async (participantIds, bookingId = null) => {
    const query = db("conversation_participants as cp")
      .join("conversations as c", "cp.conversation_id", "c.id")
      .whereIn("cp.user_id", participantIds)
      .groupBy("c.id")
      .havingRaw("COUNT(DISTINCT cp.user_id) = ?", [participantIds.length])
      .select("c.*");

    if (bookingId) {
      query.andWhere("c.booking_id", bookingId);
    }

    return query.first();
  },

  // Get all conversations for a user with last message and unread count
  // Optionally include archived conversations
  getUserConversations: async (userId, includeArchived = false) => {
    let query = db("conversations as c")
      // First, join with the requesting user's participation record
      .join("conversation_participants as my_cp", "c.id", "my_cp.conversation_id")
      .where("my_cp.user_id", userId) // Ensure we're looking at THIS user's participation

      // Then, join with the other user's participation record (for their info)
      .join("conversation_participants as other_cp", "c.id", "other_cp.conversation_id")
      .where("other_cp.user_id", "!=", userId) // Exclude the requesting user's participation from "other_cp" for display info

      .leftJoin("messages as m", function () {
        this.on("c.id", "=", "m.conversation_id").andOn(
          "m.id",
          "=",
          db.raw(
            "(SELECT id FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1)",
          ),
        );
      })
      .leftJoin("users as u", "other_cp.user_id", "u.id") // Use other_cp for joining to users table
      .select(
        "c.*",
        "m.content as last_message",
        "m.created_at as last_message_at",
        "u.id as other_user_id",
        "u.first_name as other_user_first_name",
        "u.last_name as other_user_last_name",
        "u.profile_image as other_user_image",
        "my_cp.archived_at", // Select my_cp.archived_at to display in frontend
        db.raw(
          "(SELECT COUNT(*) FROM messages WHERE conversation_id = c.id AND sender_id != ? AND read_at IS NULL) as unread_count",
          [userId],
        ),
      )
      .orderBy("m.created_at", "desc");

    if (!includeArchived) {
      query = query.where("my_cp.archived_at", null); // Filter based on THIS user's archived_at
    }
    return query;
  },

  // Check if a user is part of a conversation
  isParticipant: async (conversationId, userId) => {
    const participant = await db("conversation_participants")
      .where({ conversation_id: conversationId, user_id: userId })
      .first();
    return !!participant;
  },

  // Create a message
  createMessage: async (messageData) => {
    const [message] = await db("messages").insert(messageData).returning("*");

    // Update the conversation's updated_at timestamp
    await db("conversations")
      .where({ id: messageData.conversation_id })
      .update({ updated_at: db.fn.now() });

    return message;
  },

  // Get messages for a conversation (paginated)
  getMessages: async (conversationId, limit = 50, offset = 0) => {
    return db("messages")
      .where({ conversation_id: conversationId })
      .orderBy("created_at", "desc")
      .limit(limit)
      .offset(offset);
  },

  // Mark messages as read
  markAsRead: async (conversationId, userId) => {
    return db("messages")
      .where({ conversation_id: conversationId })
      .andWhereNot({ sender_id: userId })
      .andWhere({ read_at: null })
      .update({ read_at: db.fn.now() });
  },

  // Archive a conversation for a specific user
  archiveConversation: async (conversationId, userId) => {
    return db("conversation_participants")
      .where({ conversation_id: conversationId, user_id: userId })
      .update({ archived_at: db.fn.now() });
  },

  // Unarchive a conversation for a specific user
  unarchiveConversation: async (conversationId, userId) => {
    return db("conversation_participants")
      .where({ conversation_id: conversationId, user_id: userId })
      .update({ archived_at: null });
  },
};

module.exports = Message;
