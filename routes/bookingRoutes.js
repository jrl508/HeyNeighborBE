const express = require("express");
const router = express.Router();
const BookingController = require("../controllers/bookingController");
const authMiddleware = require("../middleware/authMiddleware");

// Create a new booking (requires auth)
router.post("/", authMiddleware, BookingController.createBooking);

// Get all bookings for current user (requires auth)
router.get("/", authMiddleware, BookingController.getBookings);

// Get booking details by ID (requires auth)
router.get("/:id", authMiddleware, BookingController.getBookingById);

// Owner confirms a booking (requires auth)
router.patch("/:id/confirm", authMiddleware, BookingController.confirmBooking);

// Activate a booking (rental period started)
router.patch(
  "/:id/activate",
  authMiddleware,
  BookingController.activateBooking,
);

// Renter marks tool as returned
router.patch(
  "/:id/return",
  authMiddleware,
  BookingController.returnBooking,
);

// Complete a booking (rental period ended)
router.patch(
  "/:id/complete",
  authMiddleware,
  BookingController.completeBooking,
);

// Cancel a booking (requires auth)
router.delete("/:id", authMiddleware, BookingController.cancelBooking);

// Check availability for a tool (no auth required for listing page)
router.get("/check/:toolId/availability", BookingController.checkAvailability);

// Get all confirmed/active bookings for a tool (owner only)
router.get(
  "/tool/:toolId/bookings",
  authMiddleware,
  BookingController.getToolBookings,
);

module.exports = router;
