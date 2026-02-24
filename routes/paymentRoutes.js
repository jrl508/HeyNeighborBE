const express = require("express");
const router = express.Router();
const PaymentController = require("../controllers/paymentController");
const authMiddleware = require("../middleware/authMiddleware");

// Create a Stripe PaymentIntent for a booking (requires auth)
router.post("/intent", authMiddleware, PaymentController.createPaymentIntent);

// Confirm payment after Stripe processing (requires auth)
router.post("/confirm", authMiddleware, PaymentController.confirmPayment);

// Webhook for Stripe events (no auth required - Stripe signature validation)
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  PaymentController.handleWebhook,
);

module.exports = router;
