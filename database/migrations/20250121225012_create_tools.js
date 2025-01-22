/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("tools", (table) => {
    table.increments("id").primary(); // Primary key
    table.integer("user_id").unsigned().notNullable(); // Foreign key to users table
    table.string("name").notNullable(); // Tool name
    table.text("description"); // Detailed description
    table.string("category"); // Tool category
    table.decimal("rental_price_per_day", 10, 2).notNullable(); // Rental price
    table.boolean("available").defaultTo(true); // Availability status
    table.string("image_url"); // Tool image URL
    table.timestamps(true, true); // Created at & updated at

    // Foreign key constraint
    table
      .foreign("user_id")
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable("tools");
};
