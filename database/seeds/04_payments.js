/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  // Deletes ALL existing entries
  await knex("payments").del();

  // Get bookings from the database
  const bookings = await knex("bookings")
    .select("id", "total_amount", "status")
    .orderBy("id");

  if (bookings.length === 0) {
    console.log("No bookings found. Skipping payment seeds.");
    return;
  }

  // Map booking status to payment status
  const statusMap = {
    requested: "requires_payment_method",
    confirmed: "processing",
    active: "succeeded",
    completed: "succeeded",
    cancelled: "refunded",
  };

  const payments = bookings.map((booking) => ({
    booking_id: booking.id,
    stripe_payment_intent_id: null, // Will be populated when Stripe integrated
    status: statusMap[booking.status] || "requires_payment_method",
    amount: booking.total_amount,
    currency: "USD",
    error_message: null,
  }));

  await knex("payments").insert(payments);
};
