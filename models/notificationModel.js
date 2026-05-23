const db = require("../database/db");

const Notification = {
  create: (data) => {
    return db("notifications").insert(data).returning("*");
  },

  findByUserId: (userId, limit = 20, offset = 0) => {
    return db("notifications")
      .where("user_id", userId)
      .orderBy("created_at", "desc")
      .limit(limit)
      .offset(offset);
  },

  getUnreadCount: (userId) => {
    return db("notifications")
      .where({ user_id: userId, is_read: false })
      .count("id as count")
      .first();
  },

  markAsRead: (id, userId) => {
    return db("notifications")
      .where({ id, user_id: userId })
      .update({ is_read: true, read_at: db.fn.now() })
      .returning("*");
  },

  markAllAsRead: (userId) => {
    return db("notifications")
      .where({ user_id: userId, is_read: false })
      .update({ is_read: true, read_at: db.fn.now() });
  },

  delete: (id, userId) => {
    return db("notifications")
      .where({ id, user_id: userId })
      .del();
  },

  deleteAll: (userId) => {
    return db("notifications")
      .where({ user_id: userId })
      .del();
  }
};

module.exports = Notification;
