/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.alterTable("users", (table) => {
    table.string("google_id").nullable().unique();
    table.string("auth_provider").defaultTo("local");
    table.string("password_digest").nullable().alter();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.alterTable("users", (table) => {
    table.dropColumn("google_id");
    table.dropColumn("auth_provider");
    table.string("password_digest").notNullable().alter();
  });
};
