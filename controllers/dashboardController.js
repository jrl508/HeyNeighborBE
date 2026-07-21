const Tool = require("../models/toolModel");
const LocalBusiness = require("../models/localBusinessModel");
const db = require("../database/db");
const User = require("../models/userModel");

const getDashboardStats = async (req, res) => {
  const userId = req.user.id;

  try {
    const user = await User.getUserById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const zip = user.zip_code;
    const radius = 10; // Default radius

    // 1. Tools available nearby
    const toolsCountResult = await Tool.countAvailableByZip(zip, radius, userId);
    const toolsAvailableNearby = parseInt(toolsCountResult[0].count) || 0;

    // 2. Local businesses nearby
    const businessCountResult = await LocalBusiness.countByLocation(zip, radius);
    const localBusinessesNearby = parseInt(businessCountResult.count) || 0;

    // 3. Active rentals count
    const activeRentalsCountResult = await db("bookings")
      .where(function () {
        this.where({ renter_id: userId }).orWhere({ owner_id: userId });
      })
      .whereNotIn("status", ["completed", "cancelled"])
      .count("id as count")
      .first();
    const activeRentalsCount = parseInt(activeRentalsCountResult.count) || 0;

    res.status(200).json({
      tools_available_nearby: toolsAvailableNearby,
      local_businesses_nearby: localBusinessesNearby,
      active_rentals_count: activeRentalsCount,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getDashboardStats,
};
