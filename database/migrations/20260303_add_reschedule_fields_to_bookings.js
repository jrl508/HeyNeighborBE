exports.up = async function (knex) {
  // Add new_start_date and new_end_date columns to bookings
  await knex.schema.table("bookings", (table) => {
    table.date("new_start_date").nullable();
    table.date("new_end_date").nullable();
  });

  // Update status enum to include reschedule_pending
  await knex.raw(`
    ALTER TABLE "bookings" DROP CONSTRAINT "bookings_status_check";
    ALTER TABLE "bookings" ADD CONSTRAINT "bookings_status_check" 
    CHECK (status IN ('pending_payment', 'requested', 'confirmed', 'active', 'completed', 'cancelled', 'disputed', 'reschedule_pending'));
  `);
};

exports.down = async function (knex) {
  // Remove columns
  await knex.schema.table("bookings", (table) => {
    table.dropColumn("new_start_date");
    table.dropColumn("new_end_date");
  });

  // Revert status enum
  await knex.raw(`
    ALTER TABLE "bookings" DROP CONSTRAINT "bookings_status_check";
    ALTER TABLE "bookings" ADD CONSTRAINT "bookings_status_check" 
    CHECK (status IN ('pending_payment', 'requested', 'confirmed', 'active', 'completed', 'cancelled', 'disputed'));
  `);
};
