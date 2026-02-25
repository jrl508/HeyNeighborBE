exports.up = async function (knex) {
  // Update bookings table status enum to include 'returning'
  await knex.raw(`
    ALTER TABLE "bookings" DROP CONSTRAINT "bookings_status_check";
    ALTER TABLE "bookings" ADD CONSTRAINT "bookings_status_check" 
    CHECK (status IN ('pending_payment', 'requested', 'confirmed', 'active', 'returning', 'completed', 'cancelled', 'disputed'));
  `);
};

exports.down = async function (knex) {
  // Revert bookings table status enum
  await knex.raw(`
    ALTER TABLE "bookings" DROP CONSTRAINT "bookings_status_check";
    ALTER TABLE "bookings" ADD CONSTRAINT "bookings_status_check" 
    CHECK (status IN ('pending_payment', 'requested', 'confirmed', 'active', 'completed', 'cancelled', 'disputed'));
  `);
};
