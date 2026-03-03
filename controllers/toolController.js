const Tool = require("../models/toolModel");

const ToolController = {
  createTool: async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "No File Uploaded" });
    }
    try {
      const toolImagePath = `${req.protocol}://${req.get("host")}/uploads/${
        req.file.filename
      }`;
      const toolData = {
        ...req.body,
        user_id: req.user.id,
        image_url: toolImagePath,
      };
      const newTool = await Tool.create(toolData);
      res.status(201).json(newTool);
    } catch (error) {
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
      const updates = { ...req.body };

      // If a new image was uploaded, update the image_url
      if (req.file) {
        updates.image_url = `${req.protocol}://${req.get("host")}/uploads/${
          req.file.filename
        }`;
      }

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

  // Get tools by location and radius (with pagination)
  getTools: async (req, res) => {
    try {
      const { zip, radius, limit = 20, offset = 0 } = req.query;
      if (!zip) {
        return res.status(400).json({ message: "ZIP code is required" });
      }
      const maxDistance = radius ? Number(radius) : 10;
      const pageLimit = Math.min(Number(limit), 100); // Max 100 per page
      const pageOffset = Number(offset);
      const requestingUserId = req.user.id; // Get the ID of the user making the request

      // Get total count
      const countResult = await Tool.countAvailableByZip(zip, maxDistance, requestingUserId);
      const total = countResult[0]?.count || 0;

      // Get paginated results
      const tools = await Tool.findAvailableByZip(
        zip,
        maxDistance,
        pageLimit,
        pageOffset,
        requestingUserId, // Pass requestingUserId to filter blocked users' tools
      );

      res.status(200).json({
        tools,
        pagination: {
          limit: pageLimit,
          offset: pageOffset,
          total,
          pages: Math.ceil(total / pageLimit),
        },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: error.message || "Error fetching tools by location",
      });
    }
  },

  // Get tool availability (blocked date ranges)
  getToolAvailability: async (req, res) => {
    try {
      const { id } = req.params;
      const ToolAvailability = require("../models/toolAvailabilityModel");
      
      const availability = await ToolAvailability.findByToolId(id);
      
      // Map to a cleaner format if necessary, though select("*") is already pretty clean
      const blockedRanges = availability.map(range => ({
        id: range.id,
        start: range.blocked_start,
        end: range.blocked_end,
        reason: range.reason
      }));

      res.status(200).json(blockedRanges);
    } catch (error) {
      console.error("Error fetching tool availability:", error);
      res.status(500).json({ message: "Error fetching tool availability" });
    }
  },

  // Add tool availability block (owner blackout)
  addToolAvailability: async (req, res) => {
    try {
      const { id } = req.params;
      const { start_date, end_date, reason, notes } = req.body;
      const owner_id = req.user.id;
      const ToolAvailability = require("../models/toolAvailabilityModel");

      // Verify ownership
      const tool = await Tool.findById(id);
      if (!tool || tool.user_id !== owner_id) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const [newBlock] = await ToolAvailability.create({
        tool_id: id,
        blocked_start: start_date,
        blocked_end: end_date,
        reason: reason || "owner_unavailable",
        notes: notes || "Manual owner blackout",
      });

      res.status(201).json(newBlock);
    } catch (error) {
      console.error("Error adding tool availability:", error);
      res.status(500).json({ message: "Error adding tool availability" });
    }
  },

  // Delete tool availability block
  deleteToolAvailability: async (req, res) => {
    try {
      const { id } = req.params; // availability block ID
      const owner_id = req.user.id;
      const ToolAvailability = require("../models/toolAvailabilityModel");

      // Find the block first to check ownership of the tool
      const availability = await ToolAvailability.findById(id);
      if (!availability) {
        return res.status(404).json({ message: "Availability block not found" });
      }

      const tool = await Tool.findById(availability.tool_id);
      if (!tool || tool.user_id !== owner_id) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      await ToolAvailability.delete(id);
      res.status(200).json({ message: "Availability block deleted" });
    } catch (error) {
      console.error("Error deleting tool availability:", error);
      res.status(500).json({ message: "Error deleting tool availability" });
    }
  },
};

module.exports = ToolController;
