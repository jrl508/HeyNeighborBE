const db = require("../database/db");
const { lookupZip } = require("../utils/zipHelper");

const Tool = {
  create: (toolData) => db("tools").insert(toolData).returning("*"),

  findById: (id) => db("tools").where({ id }).first(),

  findByUserId: (userId) => db("tools").where({ user_id: userId }),

  update: (id, updates) =>
    db("tools").where({ id }).update(updates).returning("*"),

  delete: (id) => db("tools").where({ id }).del(),

  /**
   * Count available tools by distance from a zip code
   */
  countAvailableByZip: async (zip, radius = 10) => {
    const origin = lookupZip(zip);
    if (!origin) throw new Error("Invalid ZIP code");

    return db("tools")
      .join("users", "tools.user_id", "users.id")
      .where("tools.available", true)
      .whereRaw(
        `
        (3959 * acos(
          cos(radians(?)) * cos(radians(users.lat)) *
          cos(radians(users.lng) - radians(?)) +
          sin(radians(?)) * sin(radians(users.lat))
        )) <= ?
        `,
        [origin.lat, origin.lng, origin.lat, radius],
      )
      .count("tools.id as count");
  },

  /**
   * Find available tools by distance from a zip code (with pagination)
   */
  findAvailableByZip: async (zip, radius = 10, limit = 20, offset = 0) => {
    const origin = lookupZip(zip);
    if (!origin) throw new Error("Invalid ZIP code");

    return db("tools")
      .join("users", "tools.user_id", "users.id")
      .where("tools.available", true)
      .whereRaw(
        `
        (3959 * acos(
          cos(radians(?)) * cos(radians(users.lat)) *
          cos(radians(users.lng) - radians(?)) +
          sin(radians(?)) * sin(radians(users.lat))
        )) <= ?
        `,
        [origin.lat, origin.lng, origin.lat, radius],
      )
      .select(
        "tools.*",
        db.raw(
          `
          (3959 * acos(
            cos(radians(?)) * cos(radians(users.lat)) *
            cos(radians(users.lng) - radians(?)) +
            sin(radians(?)) * sin(radians(users.lat))
          )) as distance
          `,
          [origin.lat, origin.lng, origin.lat],
        ),
      )
      .orderBy("distance")
      .limit(limit)
      .offset(offset);
  },
};

module.exports = Tool;
