const express = require("express");
const router = express.Router();
const ToolController = require("../controllers/toolController");
const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/fileUploadMiddleware");

router.post(
  "/",
  authMiddleware,
  upload.single("tool_image"),
  ToolController.createTool
); // Add a new tool
router.get("/", authMiddleware, ToolController.getUserTools); // Get tools for the logged-in user
router.patch("/:id", authMiddleware, ToolController.updateTool); // Update a tool
router.delete("/:id", authMiddleware, ToolController.deleteTool); // Delete a tool

module.exports = router;
