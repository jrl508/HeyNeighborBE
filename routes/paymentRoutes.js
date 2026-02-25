const express = require("express");
const router = express.Router();
const PaymentController = require("../controllers/paymentController");
const authMiddleware = require("../middleware/authMiddleware");

// Create a Stripe PaymentIntent for a booking (requires auth)
router.post("/intent", authMiddleware, PaymentController.createPaymentIntent);

// Confirm payment after Stripe processing (requires auth)
router.post("/confirm", authMiddleware, PaymentController.confirmPayment);

// Capture authorized payment (requires auth - owner only checked in controller)
router.post("/capture", authMiddleware, PaymentController.capturePayment);

// Void (cancel) authorized payment (requires auth - owner/renter checked in controller)
router.post("/void", authMiddleware, PaymentController.voidPayment);

// Webhook for Stripe events (no auth required - Stripe signature validation)
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  PaymentController.handleWebhook,
);

module.exports = router;
