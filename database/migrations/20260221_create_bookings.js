exports.up = function (knex) {
  return knex.schema.createTable("bookings", (table) => {
    table.increments("id").primary();
    table.integer("tool_id").unsigned().notNullable();
    table.integer("renter_id").unsigned().notNullable();
    table.integer("owner_id").unsigned().notNullable();
    table.date("start_date").notNullable();
    table.date("end_date").notNullable();
    table
      .enum("status", [
        "requested",
        "confirmed",
        "active",
        "completed",
        "cancelled",
        "disputed",
      ])
      .defaultTo("requested");
    table.decimal("price_per_day", 10, 2).notNullable();
    table.decimal("total_amount", 10, 2).notNullable();
    table.boolean("delivery_required").defaultTo(false);
    table.decimal("delivery_fee", 10, 2).defaultTo(0);
    table.decimal("deposit_amount", 10, 2).defaultTo(0);
    table.string("cancelled_by").nullable(); // "renter" or "owner"
    table.string("cancellation_reason").nullable();
    table.timestamps(true, true); // created_at, updated_at
    table.foreign("tool_id").references("tools.id").onDelete("CASCADE");
    table.foreign("renter_id").references("users.id").onDelete("CASCADE");
    table.foreign("owner_id").references("users.id").onDelete("CASCADE");
    table.index("tool_id");
    table.index("renter_id");
    table.index("owner_id");
    table.index("status");
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("bookings");
};
