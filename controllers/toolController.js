const Tool = require("../models/toolModel");

const ToolController = {
  createTool: async (req, res) => {
    try {
      const toolData = { ...req.body, user_id: req.user.id }; // Attach user ID from the authenticated user
      const newTool = await Tool.create(toolData);
      res.status(201).json(newTool);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error creating tool" });
    }
  },

  getUserTools: async (req, res) => {
    try {
      const tools = await Tool.findByUserId(req.user.id);
      res.status(200).json(tools);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error fetching user tools" });
    }
  },

  updateTool: async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const updatedTool = await Tool.update(id, updates);
      res.status(200).json(updatedTool);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error updating tool" });
    }
  },

  deleteTool: async (req, res) => {
    try {
      const { id } = req.params;
      await Tool.delete(id);
      res.status(200).json({ message: "Tool deleted successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error deleting tool" });
    }
  },
};

module.exports = ToolController;
