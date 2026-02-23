const db = require("../database/db");
const { lookupZip } = require("../utils/zipHelper");

const LocalBusiness = {
  // Create a new local business
  create: (businessData) =>
    db("local_businesses").insert(businessData).returning("*"),

  // Find business by ID with owner details
  findById: (id) =>
    db("local_businesses")
      .where({ "local_businesses.id": id })
      .leftJoin("users", "local_businesses.owner_id", "users.id")
      .select(
        "local_businesses.*",
        db.raw("users.first_name as owner_first_name"),
        db.raw("users.last_name as owner_last_name"),
        db.raw("users.email as owner_email"),
      )
      .first(),

  // Find all businesses by owner
  findByOwner: (ownerId) =>
    db("local_businesses")
      .where({ owner_id: ownerId })
      .select("*")
      .orderBy("created_at", "desc"),

  // Get all businesses (paginated)
  findAll: (limit = 20, offset = 0) =>
    db("local_businesses")
      .leftJoin("users", "local_businesses.owner_id", "users.id")
      .select(
        "local_businesses.*",
        db.raw("users.first_name as owner_first_name"),
        db.raw("users.last_name as owner_last_name"),
      )
      .orderBy("local_businesses.rating", "desc")
      .limit(limit)
      .offset(offset),

  // Count total businesses
  countAll: () =>
    db("local_businesses").count("local_businesses.id as count").first(),

  // Search businesses by location (zip + radius)
  findByLocation: async (zip, radius = 10, limit = 20, offset = 0) => {
    const origin = lookupZip(zip);
    if (!origin) throw new Error("Invalid ZIP code");

    return db("local_businesses")
      .leftJoin("users", "local_businesses.owner_id", "users.id")
      .whereNotNull("local_businesses.lat")
      .whereNotNull("local_businesses.lng")
      .whereRaw(
        `
        (3959 * acos(
          cos(radians(?)) * cos(radians(local_businesses.lat)) *
          cos(radians(local_businesses.lng) - radians(?)) +
          sin(radians(?)) * sin(radians(local_businesses.lat))
        )) <= ?
        `,
        [origin.lat, origin.lng, origin.lat, radius],
      )
      .select(
        "local_businesses.*",
        db.raw("users.first_name as owner_first_name"),
        db.raw("users.last_name as owner_last_name"),
        db.raw(
          `
          (3959 * acos(
            cos(radians(?)) * cos(radians(local_businesses.lat)) *
            cos(radians(local_businesses.lng) - radians(?)) +
            sin(radians(?)) * sin(radians(local_businesses.lat))
          )) as distance
          `,
          [origin.lat, origin.lng, origin.lat],
        ),
      )
      .orderBy("distance")
      .limit(limit)
      .offset(offset);
  },

  // Count businesses by location
  countByLocation: async (zip, radius = 10) => {
    const origin = lookupZip(zip);
    if (!origin) throw new Error("Invalid ZIP code");

    return db("local_businesses")
      .whereNotNull("lat")
      .whereNotNull("lng")
      .whereRaw(
        `
        (3959 * acos(
          cos(radians(?)) * cos(radians(lat)) *
          cos(radians(lng) - radians(?)) +
          sin(radians(?)) * sin(radians(lat))
        )) <= ?
        `,
        [origin.lat, origin.lng, origin.lat, radius],
      )
      .count("id as count")
      .first();
  },

  // Search by type
  findByType: (type, limit = 20, offset = 0) =>
    db("local_businesses")
      .where(db.raw("LOWER(type)"), "like", `%${type.toLowerCase()}%`)
      .select("*")
      .orderBy("rating", "desc")
      .limit(limit)
      .offset(offset),

  // Update business
  update: (id, updates) =>
    db("local_businesses")
      .where({ id })
      .update({ ...updates, updated_at: db.fn.now() })
      .returning("*"),

  // Delete business
  delete: (id) => db("local_businesses").where({ id }).del(),

  // Update rating (called after review is added)
  updateRating: async (businessId) => {
    const result = await db("business_reviews")
      .where({ business_id: businessId })
      .avg("rating as avg_rating")
      .count("id as review_count")
      .first();

    const avgRating = result?.avg_rating || 0;
    const reviewCount = result?.review_count || 0;

    return db("local_businesses")
      .where({ id: businessId })
      .update({
        rating: Math.round(avgRating * 100) / 100,
        review_count: reviewCount,
        updated_at: db.fn.now(),
      })
      .returning("*");
  },
};

module.exports = LocalBusiness;
