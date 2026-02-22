exports.up = function (knex) {
  return knex.schema.createTable("payments", (table) => {
    table.increments("id").primary();
    table.integer("booking_id").unsigned().notNullable();
    table.string("stripe_payment_intent_id").nullable(); // Will be populated when Stripe integrated
    table.enum("status", [
      "requires_payment_method",
      "processing",
      "succeeded",
      "failed",
      "refunded",
    ]).defaultTo("requires_payment_method");
    table.decimal("amount", 10, 2).notNullable();
    table.string("currency", 3).defaultTo("USD");
    table.text("error_message").nullable(); // Store error details if payment fails
    table.timestamps(true, true);
    table.foreign("booking_id").references("bookings.id").onDelete("CASCADE");
    table.index("booking_id");
    table.index("stripe_payment_intent_id");
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("payments");
};
