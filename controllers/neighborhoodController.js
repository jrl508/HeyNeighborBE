const NeighborhoodRequest = require("../models/neighborhoodRequestModel");
const User = require("../models/userModel");
const db = require("../database/db");

const getRequests = async (req, res) => {
  try {
    const user = await User.getUserById(req.user.id);
    const { zip = user.zip_code, radius = 10, limit = 20, offset = 0 } = req.query;

    const requests = await NeighborhoodRequest.findByLocation(zip, radius, limit, offset);
    res.status(200).json(requests);
  } catch (error) {
    console.error("Error fetching neighborhood requests:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const createRequest = async (req, res) => {
  try {
    const user = await User.getUserById(req.user.id);
    const { tool_name, description, needed_by } = req.body;

    const [newRequest] = await NeighborhoodRequest.create({
      user_id: req.user.id,
      tool_name,
      description,
      needed_by,
      zip_code: user.zip_code,
      lat: user.lat,
      lng: user.lng,
    });

    res.status(201).json(newRequest);
  } catch (error) {
    console.error("Error creating neighborhood request:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getNeighborhoodActivity = async (req, res) => {
  try {
    const user = await User.getUserById(req.user.id);
    const zip = user.zip_code;
    const radius = 10;

    // Fetch recent tools
    const recentTools = await db("tools")
      .join("users", "tools.user_id", "users.id")
      .whereRaw(
        `
        (3959 * acos(
          cos(radians(?)) * cos(radians(users.lat)) *
          cos(radians(users.lng) - radians(?)) +
          sin(radians(?)) * sin(radians(users.lat))
        )) <= ?
        `,
        [user.lat, user.lng, user.lat, radius],
      )
      .select(
        db.raw("'tool_added' as activity_type"),
        "tools.id",
        "tools.name",
        "tools.created_at",
        "users.first_name as user_name",
        "users.profile_image as user_image",
      )
      .orderBy("tools.created_at", "desc")
      .limit(10);

    // Fetch recent businesses
    const recentBusinesses = await db("local_businesses")
      .whereRaw(
        `
        (3959 * acos(
          cos(radians(?)) * cos(radians(lat)) *
          cos(radians(lng) - radians(?)) +
          sin(radians(?)) * sin(radians(lat))
        )) <= ?
        `,
        [user.lat, user.lng, user.lat, radius],
      )
      .select(
        db.raw("'business_added' as activity_type"),
        "id",
        "name",
        "created_at",
      )
      .orderBy("created_at", "desc")
      .limit(10);

    // Combine and sort
    const activity = [...recentTools, ...recentBusinesses]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 15);

    res.status(200).json(activity);
  } catch (error) {
    console.error("Error fetching neighborhood activity:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getRequests,
  createRequest,
  getNeighborhoodActivity,
};
