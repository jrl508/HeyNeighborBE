const Notification = require("../models/notificationModel");
const { getIO } = require("../socket");

/**
 * Creates a notification in the DB and emits it via Socket.io
 * @param {Object} params
 * @param {number} params.user_id - Recipient ID
 * @param {number} params.actor_id - Triggering user ID
 * @param {string} params.type - Notification type
 * @param {string} params.entity_type - Related entity (booking, message, etc.)
 * @param {number} params.entity_id - Related entity ID
 * @param {string} params.content - Human readable snippet
 */
const createNotification = async ({ user_id, actor_id, type, entity_type, entity_id, content }) => {
  try {
    const [notification] = await Notification.create({
      user_id,
      actor_id,
      type,
      entity_type,
      entity_id,
      content
    });

    // Emit via Socket.io
    try {
      const io = getIO();
      io.to(`user_${user_id}`).emit("notification_received", notification);
    } catch (socketErr) {
      console.warn("[notificationUtils] Socket emission failed:", socketErr.message);
    }

    return notification;
  } catch (err) {
    console.error("[notificationUtils] Error creating notification:", err);
  }
};

module.exports = { createNotification };
