exports.up = async function (knex) {
  // Fix bookings table status enum to include BOTH 'returning' and 'reschedule_pending'
  await knex.raw(`
    ALTER TABLE "bookings" DROP CONSTRAINT "bookings_status_check";
    ALTER TABLE "bookings" ADD CONSTRAINT "bookings_status_check" 
    CHECK (status IN ('pending_payment', 'requested', 'confirmed', 'active', 'returning', 'completed', 'cancelled', 'disputed', 'reschedule_pending'));
  `);
};

exports.down = async function (knex) {
  // Revert to the state before this fix, which only had reschedule_pending (incorrectly)
  await knex.raw(`
    ALTER TABLE "bookings" DROP CONSTRAINT "bookings_status_check";
    ALTER TABLE "bookings" ADD CONSTRAINT "bookings_status_check" 
    CHECK (status IN ('pending_payment', 'requested', 'confirmed', 'active', 'completed', 'cancelled', 'disputed', 'reschedule_pending'));
  `);
};
