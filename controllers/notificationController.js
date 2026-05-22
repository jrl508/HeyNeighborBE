const Notification = require("../models/notificationModel");

const notificationController = {
  getNotifications: async (req, res) => {
    try {
      const { limit, offset } = req.query;
      const notifications = await Notification.findByUserId(req.user.id, limit, offset);
      res.json(notifications);
    } catch (err) {
      console.error("[notificationController] Error fetching notifications:", err);
      res.status(500).json({ message: "Error fetching notifications" });
    }
  },

  getUnreadCount: async (req, res) => {
    try {
      const result = await Notification.getUnreadCount(req.user.id);
      res.json({ count: parseInt(result.count) });
    } catch (err) {
      console.error("[notificationController] Error fetching unread count:", err);
      res.status(500).json({ message: "Error fetching unread count" });
    }
  },

  markAsRead: async (req, res) => {
    const { id } = req.params;
    try {
      const [notification] = await Notification.markAsRead(id, req.user.id);
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }
      res.json(notification);
    } catch (err) {
      console.error("[notificationController] Error marking as read:", err);
      res.status(500).json({ message: "Error marking notification as read" });
    }
  },

  markAllAsRead: async (req, res) => {
    try {
      await Notification.markAllAsRead(req.user.id);
      res.json({ message: "All notifications marked as read" });
    } catch (err) {
      console.error("[notificationController] Error marking all as read:", err);
      res.status(500).json({ message: "Error marking all notifications as read" });
    }
  },

  clearAll: async (req, res) => {
    try {
      await Notification.deleteAll(req.user.id);
      res.json({ message: "All notifications cleared" });
    } catch (err) {
      console.error("[notificationController] Error clearing notifications:", err);
      res.status(500).json({ message: "Error clearing notifications" });
    }
  },

  deleteNotification: async (req, res) => {
    const { id } = req.params;
    try {
      const deleted = await Notification.delete(id, req.user.id);
      if (!deleted) {
        return res.status(404).json({ message: "Notification not found" });
      }
      res.json({ message: "Notification deleted" });
    } catch (err) {
      console.error("[notificationController] Error deleting notification:", err);
      res.status(500).json({ message: "Error deleting notification" });
    }
  }
};

module.exports = notificationController;
