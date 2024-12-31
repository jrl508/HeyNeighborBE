const { table } = require("../db");

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema.createTable("users", (table) => {
      table.increments("id").primary(); // Primary key
      table.string("email").notNullable().unique(); // Email (unique)
      table.string("first_name").notNullable(); // First name
      table.string("last_name").notNullable(); // Last name
      table.string("phone_number"); // Phone number
      table.string("password_digest").notNullable(); // Password hash
      table.string("location"); // Location
      table.timestamp("created_at").defaultTo(knex.fn.now()); // Timestamp of creation
      table.timestamp("updated_at").defaultTo(knex.fn.now()); // Timestamp of last update
    });
  };

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema.dropTable("users");
};
