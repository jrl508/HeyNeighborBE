const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/", authMiddleware, notificationController.getNotifications);
router.get("/unread-count", authMiddleware, notificationController.getUnreadCount);
router.patch("/:id/read", authMiddleware, notificationController.markAsRead);
router.patch("/read-all", authMiddleware, notificationController.markAllAsRead);
router.delete("/clear-all", authMiddleware, notificationController.clearAll);
router.delete("/:id", authMiddleware, notificationController.deleteNotification);

module.exports = router;
