const express = require("express");
const router = express.Router();
const ToolController = require("../controllers/toolController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/", authMiddleware, ToolController.createTool); // Add a new tool
router.get("/", authMiddleware, ToolController.getUserTools); // Get tools for the logged-in user
router.put("/:id", authMiddleware, ToolController.updateTool); // Update a tool
router.delete("/:id", authMiddleware, ToolController.deleteTool); // Delete a tool

module.exports = router;
