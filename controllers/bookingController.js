const Booking = require("../models/bookingModel");
const Payment = require("../models/paymentModel");
const ToolAvailability = require("../models/toolAvailabilityModel");
const Tool = require("../models/toolModel");

// Helper: Calculate days between two dates
const calculateDays = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1; // +1 to include start day
};

// Helper: Validate date range
const validateDateRange = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (start < today) return "Start date cannot be in the past";
  if (end < start) return "End date must be after start date";
  return null;
};

const BookingController = {
  // POST /api/bookings - Create a new booking request
  createBooking: async (req, res) => {
    try {
      const { tool_id, start_date, end_date, delivery_required } = req.body;
      const renter_id = req.user.id;

      // Validate inputs
      if (!tool_id || !start_date || !end_date) {
        return res.status(400).json({
          message: "tool_id, start_date, and end_date are required",
        });
      }

      const dateError = validateDateRange(start_date, end_date);
      if (dateError) {
        return res.status(400).json({ message: dateError });
      }

      // Get tool details
      const tool = await Tool.findById(tool_id);
      if (!tool) {
        return res.status(404).json({ message: "Tool not found" });
      }

      // Check true availability (field + blocks)
      const isAvailable = await Tool.getAvailability(tool_id);
      if (!isAvailable) {
        return res.status(400).json({ message: "Tool is not available" });
      }

      const owner_id = tool.user_id;

      // Check for conflicts with existing bookings
      const hasConflict = await Booking.hasConflict(
        tool_id,
        start_date,
        end_date,
      );
      if (hasConflict) {
        return res.status(409).json({
          message: "Tool is already booked for the requested dates",
        });
      }

      // Check for conflicts with owner-blocked availability
      const hasAvailabilityConflict = await ToolAvailability.hasConflict(
        tool_id,
        start_date,
        end_date,
      );
      if (hasAvailabilityConflict) {
        return res.status(409).json({
          message: "Tool is not available for the requested dates",
        });
      }

      // Calculate totals
      const days = calculateDays(start_date, end_date);
      const price_per_day = parseFloat(tool.rental_price_per_day);
      const delivery_fee =
        delivery_required && tool.delivery_available ? 25 : 0; // Fixed $25 delivery fee
      const deposit_amount = Math.ceil(price_per_day * 0.2); // 20% deposit
      const total_amount = days * price_per_day + delivery_fee + deposit_amount;

      // Create booking
      const bookingData = {
        tool_id,
        renter_id,
        owner_id,
        start_date,
        end_date,
        price_per_day,
        total_amount,
        delivery_required,
        delivery_fee,
        deposit_amount,
        status: "pending_payment",
      };

      const [booking] = await Booking.create(bookingData);

      // Block tool availability for booking period
      await Tool.update(tool_id, { available: false });
      await ToolAvailability.create({
        tool_id,
        blocked_start: start_date,
        blocked_end: end_date,
        reason: "booking",
        notes: `Booking ID ${booking.id}`,
      });

      // Create payment record
      const paymentData = {
        booking_id: booking.id,
        amount: total_amount,
        currency: "USD",
        status: "requires_payment_method",
      };

      const [payment] = await Payment.create(paymentData);

      res.status(201).json({
        booking: {
          ...booking,
          days,
        },
        payment,
        message: "Booking created. Please complete payment.",
      });
    } catch (error) {
      console.error("Error creating booking:", error);
      res.status(500).json({ message: "Error creating booking" });
    }
  },

  // GET /api/bookings - Get all bookings for current user
  getBookings: async (req, res) => {
    try {
      const userId = req.user.id;
      const bookings = await Booking.findByUserId(userId);
      res.status(200).json(bookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      res.status(500).json({ message: "Error fetching bookings" });
    }
  },

  // GET /api/bookings/:id - Get booking details
  getBookingById: async (req, res) => {
    try {
      const { id } = req.params;
      const booking = await Booking.findById(id);

      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Verify user is renter or owner
      if (
        booking.renter_id !== req.user.id &&
        booking.owner_id !== req.user.id
      ) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const payment = await Payment.findByBookingId(id);
      res.status(200).json({ booking, payment });
    } catch (error) {
      console.error("Error fetching booking:", error);
      res.status(500).json({ message: "Error fetching booking" });
    }
  },

  // PATCH /api/bookings/:id/confirm - Owner confirms a booking request
  confirmBooking: async (req, res) => {
    try {
      const { id } = req.params;
      const owner_id = req.user.id;

      const booking = await Booking.findById(id);

      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Verify user is the owner
      if (booking.owner_id !== owner_id) {
        return res
          .status(403)
          .json({ message: "Only the tool owner can confirm bookings" });
      }

      if (booking.status !== "requested") {
        return res
          .status(400)
          .json({ message: "Only requested bookings can be confirmed" });
      }

      const [updatedBooking] = await Booking.updateStatus(id, "confirmed");

      res.status(200).json({
        booking: updatedBooking,
        message: "Booking confirmed",
      });
    } catch (error) {
      console.error("Error confirming booking:", error);
      res.status(500).json({ message: "Error confirming booking" });
    }
  },

  // PATCH /api/bookings/:id/activate - Activate booking (rental period started)
  activateBooking: async (req, res) => {
    try {
      const { id } = req.params;
      const booking = await Booking.findById(id);

      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      if (booking.status !== "confirmed") {
        return res
          .status(400)
          .json({ message: "Only confirmed bookings can be activated" });
      }

      const today = new Date().toISOString().split("T")[0];
      if (today < booking.start_date) {
        return res
          .status(400)
          .json({ message: "Rental period has not started yet" });
      }

      const [updatedBooking] = await Booking.updateStatus(id, "active");

      res.status(200).json({
        booking: updatedBooking,
        message: "Booking activated",
      });
    } catch (error) {
      console.error("Error activating booking:", error);
      res.status(500).json({ message: "Error activating booking" });
    }
  },

  // PATCH /api/bookings/:id/return - Renter marks tool as returned
  returnBooking: async (req, res) => {
    try {
      const { id } = req.params;
      const booking = await Booking.findById(id);

      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Only renter can initiate return
      if (booking.renter_id !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized: only the renter can mark a tool as returned" });
      }

      if (booking.status !== "active") {
        return res.status(400).json({ message: "Only active rentals can be marked as returned" });
      }

      const [updatedBooking] = await Booking.updateStatus(id, "returning");

      res.status(200).json({
        booking: updatedBooking,
        message: "Tool marked as returned. Waiting for owner to confirm receipt.",
      });
    } catch (error) {
      console.error("Error returning booking:", error);
      res.status(500).json({ message: "Error marking tool as returned" });
    }
  },

  // PATCH /api/bookings/:id/complete - Mark booking as completed (Owner confirms receipt)
  completeBooking: async (req, res) => {
    try {
      const { id } = req.params;
      const booking = await Booking.findById(id);

      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Only owner can complete booking (confirm receipt)
      if (booking.owner_id !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized: only the owner can complete the booking" });
      }

      if (!["active", "returning", "confirmed"].includes(booking.status)) {
        return res.status(400).json({
          message: "Only active or returning bookings can be completed",
        });
      }

      const [updatedBooking] = await Booking.updateStatus(id, "completed");

      // Update payment status to reflect completion (ready for settlement)
      const payment = await Payment.findByBookingId(id);
      if (payment) {
        await Payment.updateStatus(payment.id, "completed");
      }

      // Remove availability block for this booking
      await ToolAvailability.deleteByBookingId(id);

      res.status(200).json({
        booking: updatedBooking,
        message: "Booking completed and receipt confirmed.",
      });
    } catch (error) {
      console.error("Error completing booking:", error);
      res.status(500).json({ message: "Error completing booking" });
    }
  },

  // DELETE /api/bookings/:id - Cancel a booking
  cancelBooking: async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const userId = req.user.id;

      const booking = await Booking.findById(id);

      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Verify user is renter or owner
      if (booking.renter_id !== userId && booking.owner_id !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      // Cannot cancel completed bookings
      if (["completed", "cancelled"].includes(booking.status)) {
        return res.status(400).json({
          message: "Cannot cancel a completed or already cancelled booking",
        });
      }

      const cancelledBy = booking.renter_id === userId ? "renter" : "owner";
      const [updatedBooking] = await Booking.cancel(
        id,
        cancelledBy,
        reason || "No reason provided",
      );

      // Handle refund logic (future: integrate with payment processor)
      const payment = await Payment.findByBookingId(id);
      if (payment && payment.status === "succeeded") {
        // Partial or full refund based on cancellation timing
        const daysUntilRental = calculateDays(new Date(), booking.start_date);
        let refundPercentage = 0;

        if (daysUntilRental > 7) {
          refundPercentage = 1.0; // Full refund if >7 days before
        } else if (daysUntilRental > 3) {
          refundPercentage = 0.5; // 50% refund if 3-7 days before
        } else if (daysUntilRental > 0) {
          refundPercentage = 0.25; // 25% refund if <3 days before
        }
        // Otherwise no refund if rental period started

        if (refundPercentage > 0) {
          await Payment.updateStatus(payment.id, "refunded");
        }
      }

      // Set tool back to available
      if (booking.tool_id) {
        await Tool.update(booking.tool_id, { available: true });
        console.log(`[cancelBooking] set tool ${booking.tool_id} back to available.`);
      }

      // Remove availability block for this booking
      await ToolAvailability.deleteByBookingId(id);

      res.status(200).json({
        booking: updatedBooking,
        message: "Booking cancelled and tool is now available again.",
      });
    } catch (error) {
      console.error("Error cancelling booking:", error);
      res.status(500).json({ message: "Error cancelling booking" });
    }
  },

  // GET /api/tools/:toolId/availability - Check tool availability for date range
  checkAvailability: async (req, res) => {
    try {
      const { toolId } = req.params;
      const { start_date, end_date } = req.query;

      if (!start_date || !end_date) {
        return res.status(400).json({
          message: "start_date and end_date query parameters are required",
        });
      }

      const tool = await Tool.findById(toolId);
      if (!tool) {
        return res.status(404).json({ message: "Tool not found" });
      }

      // Check for booking conflicts
      const bookingConflict = await Booking.hasConflict(
        toolId,
        start_date,
        end_date,
      );

      // Check for availability blocks
      const availabilityConflict = await ToolAvailability.hasConflict(
        toolId,
        start_date,
        end_date,
      );

      const isAvailable = !bookingConflict && !availabilityConflict;

      res.status(200).json({
        available: isAvailable,
        tool_id: toolId,
        start_date,
        end_date,
        reason: bookingConflict
          ? "Tool is booked for these dates"
          : availabilityConflict
            ? "Tool is blocked for these dates"
            : null,
      });
    } catch (error) {
      console.error("Error checking availability:", error);
      res.status(500).json({ message: "Error checking availability" });
    }
  },

  // GET /api/tools/:toolId/bookings - Get all confirmed/active bookings for a tool (for owner)
  getToolBookings: async (req, res) => {
    try {
      const { toolId } = req.params;
      const owner_id = req.user.id;

      // Verify user owns the tool
      const tool = await Tool.findById(toolId);
      if (!tool || tool.user_id !== owner_id) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const bookings = await Booking.findByToolId(toolId);
      res.status(200).json(bookings);
    } catch (error) {
      console.error("Error fetching tool bookings:", error);
      res.status(500).json({ message: "Error fetching tool bookings" });
    }
  },
};

module.exports = BookingController;
