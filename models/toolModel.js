const db = require("../database/db");

const Tool = {
  create: (toolData) => db("tools").insert(toolData).returning("*"),
  findById: (id) => db("tools").where({ id }).first(),
  findByUserId: (userId) => db("tools").where({ user_id: userId }),
  update: (id, updates) =>
    db("tools").where({ id }).update(updates).returning("*"),
  delete: (id) => db("tools").where({ id }).del(),
};

module.exports = Tool;
