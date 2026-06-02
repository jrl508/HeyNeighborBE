/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("neighborhood_requests", (table) => {
    table.increments("id").primary();
    table.integer("user_id").unsigned().notNullable();
    table.string("tool_name").notNullable();
    table.text("description");
    table.date("needed_by");
    table.string("zip_code").notNullable();
    table.decimal("lat", 10, 7).notNullable();
    table.decimal("lng", 10, 7).notNullable();
    table.string("status").defaultTo("active"); // active, fulfilled, cancelled
    table.timestamps(true, true);

    table.foreign("user_id").references("users.id").onDelete("CASCADE");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable("neighborhood_requests");
};
