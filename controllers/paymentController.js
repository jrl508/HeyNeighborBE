const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Payment = require("../models/paymentModel");
const Booking = require("../models/bookingModel");

const PaymentController = {
  // POST /api/payments/intent - Create a Stripe PaymentIntent for a booking
  createPaymentIntent: async (req, res) => {
    try {
      const { booking_id } = req.body;
      const userId = req.user.id;

      if (!booking_id) {
        return res.status(400).json({ message: "booking_id is required" });
      }

      console.log(
        `[POST /payments/intent] user=${userId} booking_id=${booking_id}`,
      );

      // Get the booking
      const booking = await Booking.findById(booking_id);
      if (!booking) {
        console.error(
          `[POST /payments/intent] booking not found: ${booking_id}`,
        );
        return res.status(404).json({ message: "Booking not found" });
      }

      // Verify user is the renter
      if (booking.renter_id !== userId) {
        console.error(
          `[POST /payments/intent] unauthorized: user=${userId} renter=${booking.renter_id}`,
        );
        return res.status(403).json({ message: "Unauthorized" });
      }

      // Get the payment record
      let payment = await Payment.findByBookingId(booking_id);
      if (!payment) {
        console.error(
          `[POST /payments/intent] payment not found for booking: ${booking_id}`,
        );
        return res.status(404).json({ message: "Payment record not found" });
      }

      // Create or retrieve PaymentIntent
      let paymentIntent;
      if (
        payment.stripe_payment_intent_id &&
        payment.status !== "failed" &&
        payment.status !== "requires_payment_method"
      ) {
        // Retrieve existing PaymentIntent if still valid
        try {
          paymentIntent = await stripe.paymentIntents.retrieve(
            payment.stripe_payment_intent_id,
          );
          console.log(
            `[POST /payments/intent] retrieved existing intent: ${paymentIntent.id}`,
          );
        } catch (err) {
          console.log(
            `[POST /payments/intent] existing intent invalid, creating new one`,
          );
          paymentIntent = null;
        }
      }

      // Create new PaymentIntent if needed
      if (!paymentIntent) {
        paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(payment.amount * 100), // Convert to cents
          currency: payment.currency.toLowerCase(),
          metadata: {
            booking_id: booking_id.toString(),
            renter_id: userId.toString(),
            owner_id: booking.owner_id.toString(),
            tool_id: booking.tool_id.toString(),
          },
          automatic_payment_methods: {
            enabled: true,
          },
        });

        console.log(
          `[POST /payments/intent] created new intent: ${paymentIntent.id}`,
        );

        // Update payment with Stripe intent ID
        [payment] = await Payment.setStripeIntentId(
          payment.id,
          paymentIntent.id,
        );
        console.log(
          `[POST /payments/intent] updated payment with intent id: ${payment.id}`,
        );
      }

      res.status(200).json({
        payment,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      });
    } catch (error) {
      console.error("[POST /payments/intent] error=", error);
      res.status(500).json({
        message: "Error creating payment intent",
        error: error.message,
      });
    }
  },

  // POST /api/payments/confirm - Confirm payment after Stripe processing
  confirmPayment: async (req, res) => {
    try {
      const { booking_id, stripe_payment_intent_id } = req.body;
      const userId = req.user.id;

      if (!booking_id || !stripe_payment_intent_id) {
        return res.status(400).json({
          message: "booking_id and stripe_payment_intent_id are required",
        });
      }

      console.log(
        `[POST /payments/confirm] user=${userId} booking_id=${booking_id} intent=${stripe_payment_intent_id}`,
      );

      // Verify PaymentIntent with Stripe
      const paymentIntent = await stripe.paymentIntents.retrieve(
        stripe_payment_intent_id,
      );

      console.log(
        `[POST /payments/confirm] intent status: ${paymentIntent.status}`,
      );

      // Check if payment was successful
      if (paymentIntent.status !== "succeeded") {
        console.error(
          `[POST /payments/confirm] payment not succeeded: status=${paymentIntent.status}`,
        );
        return res.status(400).json({
          message: `Payment was not successful. Status: ${paymentIntent.status}`,
        });
      }

      // Get booking and payment
      const booking = await Booking.findById(booking_id);
      if (!booking) {
        console.error(
          `[POST /payments/confirm] booking not found: ${booking_id}`,
        );
        return res.status(404).json({ message: "Booking not found" });
      }

      // Verify user is the renter
      if (booking.renter_id !== userId) {
        console.error(
          `[POST /payments/confirm] unauthorized: user=${userId} renter=${booking.renter_id}`,
        );
        return res.status(403).json({ message: "Unauthorized" });
      }

      // Update payment status to succeeded
      const [payment] = await Payment.updateStatus(
        (await Payment.findByBookingId(booking_id)).id,
        "succeeded",
      );

      console.log(
        `[POST /payments/confirm] payment succeeded: payment_id=${payment.id}`,
      );

      res.status(200).json({
        booking,
        payment,
        message: "Payment confirmed successfully",
      });
    } catch (error) {
      console.error("[POST /payments/confirm] error=", error);
      res.status(500).json({
        message: "Error confirming payment",
        error: error.message,
      });
    }
  },

  // POST /api/payments/webhook - Handle Stripe webhook events
  handleWebhook: async (req, res) => {
    const sig = req.headers["stripe-signature"];

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET,
      );
      console.log(`[Webhook] received event: ${event.type}`);
    } catch (err) {
      console.error(`[Webhook] signature verification failed: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle different event types
    switch (event.type) {
      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(event.data.object);
        break;
      case "payment_intent.payment_failed":
        await handlePaymentIntentFailed(event.data.object);
        break;
      default:
        console.log(`[Webhook] unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  },
};

// Helper: Handle payment intent succeeded
async function handlePaymentIntentSucceeded(paymentIntent) {
  try {
    const booking_id = paymentIntent.metadata.booking_id;

    console.log(
      `[Webhook] payment_intent.succeeded for booking: ${booking_id}`,
    );

    // Update payment record
    const payment = await Payment.findByBookingId(booking_id);
    if (payment && payment.status !== "succeeded") {
      const [updatedPayment] = await Payment.updateStatus(
        payment.id,
        "succeeded",
      );
      console.log(
        `[Webhook] updated payment status to succeeded: ${updatedPayment.id}`,
      );
    }

    // Update booking status if not already confirmed
    const booking = await Booking.findById(booking_id);
    if (booking && booking.status === "requested") {
      // Auto-confirm the booking (alternatively, owner can manually confirm)
      // For now, we'll leave it in "requested" state for owner confirmation
      console.log(
        `[Webhook] booking ${booking_id} payment confirmed, awaiting owner confirmation`,
      );
    }
  } catch (error) {
    console.error("[Webhook] error handling payment_intent.succeeded:", error);
  }
}

// Helper: Handle payment intent failed
async function handlePaymentIntentFailed(paymentIntent) {
  try {
    const booking_id = paymentIntent.metadata.booking_id;

    console.log(
      `[Webhook] payment_intent.payment_failed for booking: ${booking_id}`,
    );

    // Update payment record with error
    const payment = await Payment.findByBookingId(booking_id);
    if (payment) {
      const errorMessage =
        paymentIntent.last_payment_error?.message || "Payment failed";
      const [updatedPayment] = await Payment.updateStatus(
        payment.id,
        "failed",
        errorMessage,
      );
      console.log(
        `[Webhook] updated payment status to failed: ${updatedPayment.id}, error: ${errorMessage}`,
      );
    }
  } catch (error) {
    console.error(
      "[Webhook] error handling payment_intent.payment_failed:",
      error,
    );
  }
}

module.exports = PaymentController;
