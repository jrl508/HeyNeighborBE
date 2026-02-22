const db = require("../database/db");

const ToolAvailability = {
  // Create a blocked availability range
  create: (availabilityData) =>
    db("tool_availability").insert(availabilityData).returning("*"),

  // Get all blocked periods for a tool
  findByToolId: (toolId) =>
    db("tool_availability")
      .where({ tool_id: toolId })
      .select("*")
      .orderBy("blocked_start"),

  // Check if dates overlap with existing blocked ranges
  hasConflict: async (toolId, startDate, endDate) => {
    const conflict = await db("tool_availability")
      .where({ tool_id: toolId })
      .where((builder) => {
        builder
          .whereBetween("blocked_start", [startDate, endDate])
          .orWhereBetween("blocked_end", [startDate, endDate])
          .orWhere((subBuilder) => {
            subBuilder
              .where("blocked_start", "<=", startDate)
              .where("blocked_end", ">=", endDate);
          });
      })
      .first();

    return !!conflict;
  },

  // Remove a blocked period
  delete: (id) => db("tool_availability").where({ id }).del(),

  // Update a blocked period
  update: (id, updates) =>
    db("tool_availability")
      .where({ id })
      .update(updates)
      .returning("*"),
};

module.exports = ToolAvailability;
