const db = require("../database/db");

const Booking = {
  // Create a new booking request
  create: (bookingData) => db("bookings").insert(bookingData).returning("*"),

  // Get booking by ID with tool and user details
  findById: (id) =>
    db("bookings")
      .where({ "bookings.id": id })
      .leftJoin("tools", "bookings.tool_id", "tools.id")
      .leftJoin("users as renter", "bookings.renter_id", "renter.id")
      .leftJoin("users as owner", "bookings.owner_id", "owner.id")
      .select(
        "bookings.*",
        db.raw("tools.name as tool_name"),
        db.raw("tools.image_url as tool_image"),
        db.raw("renter.first_name as renter_first_name"),
        db.raw("renter.last_name as renter_last_name"),
        db.raw("renter.email as renter_email"),
        db.raw("owner.first_name as owner_first_name"),
        db.raw("owner.last_name as owner_last_name"),
        db.raw("owner.email as owner_email"),
      )
      .first(),

  // Get all bookings for a user (as renter or owner)
  findByUserId: (userId) =>
    db("bookings")
      .where({ renter_id: userId })
      .orWhere({ owner_id: userId })
      .select("*")
      .orderBy("created_at", "desc"),

  // Get bookings for a user as renter
  findByRenterId: (renterId) =>
    db("bookings")
      .where({ renter_id: renterId })
      .select("*")
      .orderBy("start_date"),

  // Get bookings for a user as owner
  findByOwnerId: (ownerId) =>
    db("bookings")
      .where({ owner_id: ownerId })
      .select("*")
      .orderBy("start_date"),

  // Get all bookings for a specific tool
  findByToolId: (toolId) =>
    db("bookings")
      .where({ tool_id: toolId })
      .whereIn("status", ["confirmed", "active"])
      .select("*")
      .orderBy("start_date"),

  // Update booking status
  updateStatus: (id, status) =>
    db("bookings")
      .where({ id })
      .update({ status, updated_at: db.fn.now() })
      .returning("*"),

  // Update booking with cancellation details
  cancel: (id, cancelledBy, reason) =>
    db("bookings")
      .where({ id })
      .update({
        status: "cancelled",
        cancelled_by: cancelledBy,
        cancellation_reason: reason,
        updated_at: db.fn.now(),
      })
      .returning("*"),

  // Update booking details (e.g., adjust dates or amounts)
  update: (id, updates) =>
    db("bookings")
      .where({ id })
      .update({ ...updates, updated_at: db.fn.now() })
      .returning("*"),

  // Check for overlapping bookings for a tool
  hasConflict: async (toolId, startDate, endDate, excludeBookingId = null) => {
    let query = db("bookings")
      .where({ tool_id: toolId })
      .whereIn("status", ["confirmed", "active"])
      .where((builder) => {
        builder
          .whereBetween("start_date", [startDate, endDate])
          .orWhereBetween("end_date", [startDate, endDate])
          .orWhere((subBuilder) => {
            subBuilder
              .where("start_date", "<=", startDate)
              .where("end_date", ">=", endDate);
          });
      });

    if (excludeBookingId) {
      query = query.where("id", "!=", excludeBookingId);
    }

    const conflict = await query.first();
    return !!conflict;
  },
};

module.exports = Booking;
