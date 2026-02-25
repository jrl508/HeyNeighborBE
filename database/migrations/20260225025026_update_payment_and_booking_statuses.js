exports.up = async function (knex) {
  // Update payments table status enum
  // PostgreSQL doesn't allow direct enum modification easily with Knex if defined as enum in createTable
  // We'll drop the check constraint and add it back with new values
  await knex.raw(`
    ALTER TABLE "payments" DROP CONSTRAINT "payments_status_check";
    ALTER TABLE "payments" ADD CONSTRAINT "payments_status_check" 
    CHECK (status IN ('requires_payment_method', 'processing', 'authorized', 'succeeded', 'failed', 'refunded', 'cancelled'));
  `);

  // Update bookings table status enum
  await knex.raw(`
    ALTER TABLE "bookings" DROP CONSTRAINT "bookings_status_check";
    ALTER TABLE "bookings" ADD CONSTRAINT "bookings_status_check" 
    CHECK (status IN ('pending_payment', 'requested', 'confirmed', 'active', 'completed', 'cancelled', 'disputed'));
  `);
};

exports.down = async function (knex) {
  // Revert payments table
  await knex.raw(`
    ALTER TABLE "payments" DROP CONSTRAINT "payments_status_check";
    ALTER TABLE "payments" ADD CONSTRAINT "payments_status_check" 
    CHECK (status IN ('requires_payment_method', 'processing', 'succeeded', 'failed', 'refunded'));
  `);

  // Revert bookings table
  await knex.raw(`
    ALTER TABLE "bookings" DROP CONSTRAINT "bookings_status_check";
    ALTER TABLE "bookings" ADD CONSTRAINT "bookings_status_check" 
    CHECK (status IN ('requested', 'confirmed', 'active', 'completed', 'cancelled', 'disputed'));
  `);
};
