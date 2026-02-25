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
          capture_method: "manual", // ADD THIS: Enable delayed capture
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

      // Check if payment was authorized (not succeeded yet)
      if (paymentIntent.status !== "requires_capture") {
        console.error(
          `[POST /payments/confirm] payment not authorized: status=${paymentIntent.status}`,
        );
        return res.status(400).json({
          message: `Payment was not authorized. Status: ${paymentIntent.status}`,
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

      // Update payment status to authorized (pending capture)
      const paymentRecord = await Payment.findByBookingId(booking_id);
      const [payment] = await Payment.updateStatus(
        paymentRecord.id,
        "authorized",
      );

      console.log(
        `[POST /payments/confirm] payment authorized: payment_id=${payment.id}`,
      );

      res.status(200).json({
        booking,
        payment,
        message: "Payment authorized successfully, pending capture.",
      });
    } catch (error) {
      console.error("[POST /payments/confirm] error=", error);
      res.status(500).json({
        message: "Error confirming payment authorization",
        error: error.message,
      });
    }
  },

  // POST /api/payments/capture - Capture authorized payment (Owner action)
  capturePayment: async (req, res) => {
    try {
      const { booking_id } = req.body;
      const userId = req.user.id;

      if (!booking_id) {
        return res.status(400).json({ message: "booking_id is required" });
      }

      // Get booking and verify owner
      const booking = await Booking.findById(booking_id);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      if (booking.owner_id !== userId) {
        return res.status(403).json({ message: "Unauthorized: only the owner can capture payment" });
      }

      // Get payment record
      const payment = await Payment.findByBookingId(booking_id);
      if (!payment || payment.status !== "authorized") {
        return res.status(400).json({ 
          message: "Payment not in a capture-ready state (must be 'authorized')" 
        });
      }

      console.log(`[POST /payments/capture] capturing payment intent: ${payment.stripe_payment_intent_id}`);

      // Capture the payment in Stripe
      const paymentIntent = await stripe.paymentIntents.capture(payment.stripe_payment_intent_id);

      console.log(`[POST /payments/capture] capture result: ${paymentIntent.status}`);

      if (paymentIntent.status !== "succeeded") {
        return res.status(400).json({ 
          message: `Payment capture failed. Status: ${paymentIntent.status}` 
        });
      }

      // Update payment status to succeeded
      const [updatedPayment] = await Payment.updateStatus(payment.id, "succeeded");

      res.status(200).json({
        message: "Payment captured successfully",
        payment: updatedPayment
      });
    } catch (error) {
      console.error("[POST /payments/capture] error=", error);
      res.status(500).json({
        message: "Error capturing payment",
        error: error.message,
      });
    }
  },

  // POST /api/payments/void - Void (cancel) authorized payment (Renter or Owner action)
  voidPayment: async (req, res) => {
    try {
      const { booking_id } = req.body;
      const userId = req.user.id;

      if (!booking_id) {
        return res.status(400).json({ message: "booking_id is required" });
      }

      // Get booking and verify user is involved
      const booking = await Booking.findById(booking_id);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      if (booking.renter_id !== userId && booking.owner_id !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      // Get payment record
      const payment = await Payment.findByBookingId(booking_id);
      if (!payment || (payment.status !== "authorized" && payment.status !== "requires_payment_method")) {
        return res.status(400).json({ 
          message: "Payment not in a voidable state (must be 'authorized' or 'requires_payment_method')" 
        });
      }

      console.log(`[POST /payments/void] voiding payment intent: ${payment.stripe_payment_intent_id}`);

      // Cancel the payment intent in Stripe
      let paymentIntent;
      if (payment.stripe_payment_intent_id) {
        paymentIntent = await stripe.paymentIntents.cancel(payment.stripe_payment_intent_id);
        console.log(`[POST /payments/void] cancel result: ${paymentIntent.status}`);
      }

      // Update payment status to cancelled
      const [updatedPayment] = await Payment.updateStatus(payment.id, "cancelled");

      res.status(200).json({
        message: "Payment voided successfully",
        payment: updatedPayment
      });
    } catch (error) {
      console.error("[POST /payments/void] error=", error);
      res.status(500).json({
        message: "Error voiding payment",
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
      case "payment_intent.amount_capturable_updated":
        await handlePaymentIntentAuthorized(event.data.object);
        break;
      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(event.data.object);
        break;
      case "payment_intent.payment_failed":
        await handlePaymentIntentFailed(event.data.object);
        break;
      case "payment_intent.canceled":
        await handlePaymentIntentCanceled(event.data.object);
        break;
      default:
        console.log(`[Webhook] unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  },
};

// Helper: Handle payment intent authorized (ready for capture)
async function handlePaymentIntentAuthorized(paymentIntent) {
  try {
    const booking_id = paymentIntent.metadata.booking_id;

    console.log(
      `[Webhook] payment_intent.amount_capturable_updated (authorized) for booking: ${booking_id}`,
    );

    // Update payment record
    const payment = await Payment.findByBookingId(booking_id);
    if (payment && payment.status !== "authorized" && payment.status !== "succeeded") {
      const [updatedPayment] = await Payment.updateStatus(
        payment.id,
        "authorized",
      );
      console.log(
        `[Webhook] updated payment status to authorized: ${updatedPayment.id}`,
      );
    }
  } catch (error) {
    console.error("[Webhook] error handling payment_intent.amount_capturable_updated:", error);
  }
}

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

    // Update booking status if needed
    const booking = await Booking.findById(booking_id);
    if (booking && booking.status !== "completed" && booking.status !== "cancelled") {
      // Once payment is captured, the transaction is effectively complete
      // You might want to set it to 'completed' here if the capture happens after return
      await Booking.updateStatus(booking_id, "completed");
      console.log(`[Webhook] updated booking status to completed: ${booking_id}`);
    }
  } catch (error) {
    console.error("[Webhook] error handling payment_intent.succeeded:", error);
  }
}

// Helper: Handle payment intent canceled
async function handlePaymentIntentCanceled(paymentIntent) {
  try {
    const booking_id = paymentIntent.metadata.booking_id;

    console.log(
      `[Webhook] payment_intent.canceled for booking: ${booking_id}`,
    );

    // Update payment record
    const payment = await Payment.findByBookingId(booking_id);
    if (payment && payment.status !== "cancelled") {
      const [updatedPayment] = await Payment.updateStatus(
        payment.id,
        "cancelled",
      );
      console.log(
        `[Webhook] updated payment status to cancelled: ${updatedPayment.id}`,
      );
    }
  } catch (error) {
    console.error("[Webhook] error handling payment_intent.canceled:", error);
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
