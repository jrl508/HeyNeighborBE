const db = require("../database/db");

const Payment = {
  // Create a new payment record
  create: (paymentData) =>
    db("payments").insert(paymentData).returning("*"),

  // Get payment by ID
  findById: (id) => db("payments").where({ id }).first(),

  // Get payment by booking ID
  findByBookingId: (bookingId) =>
    db("payments").where({ booking_id: bookingId }).first(),

  // Get payment by Stripe payment intent ID
  findByStripeIntentId: (stripeIntentId) =>
    db("payments").where({ stripe_payment_intent_id: stripeIntentId }).first(),

  // Update payment status
  updateStatus: (id, status, errorMessage = null) =>
    db("payments")
      .where({ id })
      .update({
        status,
        error_message: errorMessage,
        updated_at: db.fn.now(),
      })
      .returning("*"),

  // Update with Stripe intent ID (after Stripe integration)
  setStripeIntentId: (id, stripeIntentId) =>
    db("payments")
      .where({ id })
      .update({
        stripe_payment_intent_id: stripeIntentId,
        updated_at: db.fn.now(),
      })
      .returning("*"),

  // Get all payments for a user (as payer or recipient)
  findByUserId: (userId) =>
    db("payments")
      .join("bookings", "payments.booking_id", "bookings.id")
      .where({ renter_id: userId })
      .orWhere({ owner_id: userId })
      .select("payments.*", "bookings.tool_id", "bookings.renter_id", "bookings.owner_id")
      .orderBy("payments.created_at", "desc"),
};

module.exports = Payment;
