const db = require("../database/db");
const { lookupZip } = require("../utils/zipHelper");

const NeighborhoodRequest = {
  create: (requestData) => db("neighborhood_requests").insert(requestData).returning("*"),

  findById: (id) =>
    db("neighborhood_requests")
      .where({ "neighborhood_requests.id": id })
      .leftJoin("users", "neighborhood_requests.user_id", "users.id")
      .select(
        "neighborhood_requests.*",
        db.raw("users.first_name as requester_first_name"),
        db.raw("users.last_name as requester_last_name"),
        db.raw("users.profile_image as requester_profile_image"),
      )
      .first(),

  findByUserId: (userId) =>
    db("neighborhood_requests")
      .where({ user_id: userId })
      .orderBy("created_at", "desc"),

  findByLocation: async (zip, radius = 10, limit = 20, offset = 0) => {
    const origin = lookupZip(zip);
    if (!origin) throw new Error("Invalid ZIP code");

    return db("neighborhood_requests")
      .leftJoin("users", "neighborhood_requests.user_id", "users.id")
      .where("neighborhood_requests.status", "active")
      .whereRaw(
        `
        (3959 * acos(
          cos(radians(?)) * cos(radians(neighborhood_requests.lat)) *
          cos(radians(neighborhood_requests.lng) - radians(?)) +
          sin(radians(?)) * sin(radians(neighborhood_requests.lat))
        )) <= ?
        `,
        [origin.lat, origin.lng, origin.lat, radius],
      )
      .select(
        "neighborhood_requests.*",
        db.raw("users.first_name as requester_first_name"),
        db.raw("users.last_name as requester_last_name"),
        db.raw("users.profile_image as requester_profile_image"),
        db.raw(
          `
          (3959 * acos(
            cos(radians(?)) * cos(radians(neighborhood_requests.lat)) *
            cos(radians(neighborhood_requests.lng) - radians(?)) +
            sin(radians(?)) * sin(radians(neighborhood_requests.lat))
          )) as distance
          `,
          [origin.lat, origin.lng, origin.lat],
        ),
      )
      .orderBy("distance")
      .limit(limit)
      .offset(offset);
  },

  update: (id, updates) =>
    db("neighborhood_requests")
      .where({ id })
      .update({ ...updates, updated_at: db.fn.now() })
      .returning("*"),

  delete: (id) => db("neighborhood_requests").where({ id }).del(),
};

module.exports = NeighborhoodRequest;
