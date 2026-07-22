const NeighborhoodRequest = require("../models/neighborhoodRequestModel");
const User = require("../models/userModel");
const db = require("../database/db");

const getRequests = async (req, res) => {
  try {
    const user = await User.getUserById(req.user.id);
    const { zip, lat, lng, radius = 10, limit = 20, offset = 0 } = req.query;

    let location;
    if (lat !== undefined && lng !== undefined) {
      location = { lat: Number(lat), lng: Number(lng) };
    } else if (zip) {
      location = zip;
    } else {
      if (user) {
        if (user.lat !== null && user.lng !== null) {
          location = { lat: Number(user.lat), lng: Number(user.lng) };
        } else if (user.zip_code) {
          location = user.zip_code;
        }
      }
    }

    if (!location) {
      return res.status(400).json({ message: "Location is required" });
    }

    const requests = await NeighborhoodRequest.findByLocation(location, radius, limit, offset);
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
    const { zip, lat, lng, radius = 10 } = req.query;

    let targetLat = user.lat;
    let targetLng = user.lng;

    if (lat !== undefined && lng !== undefined) {
      targetLat = Number(lat);
      targetLng = Number(lng);
    } else if (zip) {
      const { lookupZip } = require("../utils/zipHelper");
      const zipInfo = lookupZip(zip);
      if (zipInfo) {
        targetLat = zipInfo.lat;
        targetLng = zipInfo.lng;
      }
    }

    if (targetLat === null || targetLng === null) {
      return res.status(400).json({ message: "Location coordinates not found" });
    }

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
        [targetLat, targetLng, targetLat, Number(radius)],
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
      .limit(20);

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
        [targetLat, targetLng, targetLat, Number(radius)],
      )
      .select(
        db.raw("'business_added' as activity_type"),
        "id",
        "name",
        "created_at",
      )
      .orderBy("created_at", "desc")
      .limit(20);

    // Combine and sort
    const activity = [...recentTools, ...recentBusinesses]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 30);

    res.status(200).json(activity);
  } catch (error) {
    console.error("Error fetching neighborhood activity:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const deleteRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await NeighborhoodRequest.findById(id);

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (request.user_id !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to cancel this request" });
    }

    await NeighborhoodRequest.delete(id);
    res.status(200).json({ message: "Request cancelled successfully" });
  } catch (error) {
    console.error("Error deleting neighborhood request:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getRequests,
  createRequest,
  getNeighborhoodActivity,
  deleteRequest,
};
