const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const db = require("../database/db");
const Payment = require("../models/paymentModel");

/**
 * Checks and releases any security deposit holds on bookings
 * completed more than 48 hours ago without active claims.
 */
const processExpiredDepositHolds = async () => {
  try {
    // Find payments where deposit_status is 'authorized' and the associated booking
    // has been completed for at least 48 hours
    const expiredPayments = await db("payments")
      .join("bookings", "payments.booking_id", "bookings.id")
      .where("payments.deposit_status", "authorized")
      .where("bookings.status", "completed")
      .whereNotNull("payments.stripe_deposit_intent_id")
      .whereRaw("bookings.completed_at <= NOW() - INTERVAL '48 hours'")
      .select(
        "payments.id as payment_id",
        "payments.stripe_deposit_intent_id",
        "payments.booking_id",
        "bookings.completed_at"
      );

    if (expiredPayments.length === 0) return;

    console.log(
      `[DepositScheduler] Found ${expiredPayments.length} deposit hold(s) ready for automatic release.`
    );

    for (const p of expiredPayments) {
      try {
        if (p.stripe_deposit_intent_id) {
          try {
            await stripe.paymentIntents.cancel(p.stripe_deposit_intent_id);
          } catch (stripeErr) {
            // If already canceled in Stripe, proceed with database sync
            if (!stripeErr.message.includes("already been canceled")) {
              throw stripeErr;
            }
          }
        }
        await Payment.updateDepositStatus(p.payment_id, "released");
        console.log(
          `[DepositScheduler] Automatically released deposit hold for booking ${p.booking_id}`
        );
      } catch (err) {
        console.error(
          `[DepositScheduler] Error releasing deposit for payment ${p.payment_id}:`,
          err.message
        );
      }
    }
  } catch (error) {
    console.error(
      "[DepositScheduler] Error checking expired deposit holds:",
      error.message
    );
  }
};

/**
 * Starts periodic scheduler to release expired holds every hour and checks on startup.
 * @param {number} intervalMs - interval between checks in milliseconds (default 1 hour)
 */
const startDepositScheduler = (intervalMs = 60 * 60 * 1000) => {
  // Run check on startup
  processExpiredDepositHolds();

  // Run periodic check
  return setInterval(processExpiredDepositHolds, intervalMs);
};

module.exports = {
  processExpiredDepositHolds,
  startDepositScheduler,
};
