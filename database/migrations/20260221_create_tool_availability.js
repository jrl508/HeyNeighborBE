exports.up = function (knex) {
  return knex.schema.createTable("tool_availability", (table) => {
    table.increments("id").primary();
    table.integer("tool_id").unsigned().notNullable();
    table.date("blocked_start").notNullable();
    table.date("blocked_end").notNullable();
    table.enum("reason", [
      "maintenance",
      "booking",
      "owner_unavailable",
    ]).defaultTo("owner_unavailable");
    table.text("notes").nullable();
    table.timestamps(true, true);
    table.foreign("tool_id").references("tools.id").onDelete("CASCADE");
    table.index("tool_id");
    table.index(["blocked_start", "blocked_end"]);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("tool_availability");
};
