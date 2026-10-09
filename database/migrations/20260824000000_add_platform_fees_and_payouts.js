/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  // 1. Add platform fee fields to payments table
  await knex.schema.alterTable("payments", (table) => {
    table.decimal("renter_fee", 10, 2).defaultTo(0);
    table.decimal("owner_commission", 10, 2).defaultTo(0);
    table.decimal("platform_total_fee", 10, 2).defaultTo(0);
    table.decimal("owner_payout_amount", 10, 2).defaultTo(0);
    table.string("stripe_transfer_id").nullable();
  });

  // 2. Add platform fee and payout fields to bookings table
  await knex.schema.alterTable("bookings", (table) => {
    table.decimal("renter_fee", 10, 2).defaultTo(0);
    table.decimal("owner_commission", 10, 2).defaultTo(0);
    table.decimal("payout_amount", 10, 2).defaultTo(0);
  });

  // 3. Add Stripe Connect payout fields to users table
  await knex.schema.alterTable("users", (table) => {
    table.string("stripe_connect_account_id").nullable();
    table.boolean("payouts_enabled").defaultTo(false);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.alterTable("users", (table) => {
    table.dropColumn("stripe_connect_account_id");
    table.dropColumn("payouts_enabled");
  });

  await knex.schema.alterTable("bookings", (table) => {
    table.dropColumn("renter_fee");
    table.dropColumn("owner_commission");
    table.dropColumn("payout_amount");
  });

  await knex.schema.alterTable("payments", (table) => {
    table.dropColumn("renter_fee");
    table.dropColumn("owner_commission");
    table.dropColumn("platform_total_fee");
    table.dropColumn("owner_payout_amount");
    table.dropColumn("stripe_transfer_id");
  });
};
