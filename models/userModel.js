const db = require("../database/db");

const User = {
  getUserById: async (userId) => {
    return db("users")
      .select(
        "users.id",
        "users.email",
        "users.first_name",
        "users.last_name",
        "users.phone_number",
        "users.phone_verified",
        "users.zip_code",
        "users.lat",
        "users.lng",
        "users.city",
        "users.state",
        "users.created_at",
        "users.updated_at",
        "users.profile_image",
        "users.average_rating",
        "users.stripe_customer_id",
        db("tools")
          .count("*")
          .whereRaw("?? = ??", ["tools.user_id", "users.id"])
          .as("tools_listed_count"),
        db("bookings")
          .count("*")
          .where({ status: "completed" })
          .whereRaw("(?? = ?? OR ?? = ??)", [
            "bookings.renter_id",
            "users.id",
            "bookings.owner_id",
            "users.id",
          ])
          .as("completed_rentals_count"),
        db("reviews")
          .count("*")
          .whereRaw("?? = ??", ["reviews.reviewed_id", "users.id"])
          .as("reviews_count"),
      )
      .where({ "users.id": userId })
      .first();
  },

  updateStripeCustomerId: async (userId, stripeCustomerId) => {
    return db("users")
      .where({ id: userId })
      .update({ stripe_customer_id: stripeCustomerId })
      .returning("stripe_customer_id");
  },

  getUserByEmail: async (email) => {
    return db("users")
      .select(
        "users.*",
        db("tools")
          .count("*")
          .whereRaw("?? = ??", ["tools.user_id", "users.id"])
          .as("tools_listed_count"),
        db("bookings")
          .count("*")
          .where({ status: "completed" })
          .whereRaw("(?? = ?? OR ?? = ??)", [
            "bookings.renter_id",
            "users.id",
            "bookings.owner_id",
            "users.id",
          ])
          .as("completed_rentals_count"),
        db("reviews")
          .count("*")
          .whereRaw("?? = ??", ["reviews.reviewed_id", "users.id"])
          .as("reviews_count"),
      )
      .where({ email })
      .first(); // Find user by email
  },

  getUserByGoogleId: async (googleId) => {
    return db("users")
      .select(
        "users.*",
        db("tools")
          .count("*")
          .whereRaw("?? = ??", ["tools.user_id", "users.id"])
          .as("tools_listed_count"),
        db("bookings")
          .count("*")
          .where({ status: "completed" })
          .whereRaw("(?? = ?? OR ?? = ??)", [
            "bookings.renter_id",
            "users.id",
            "bookings.owner_id",
            "users.id",
          ])
          .as("completed_rentals_count"),
        db("reviews")
          .count("*")
          .whereRaw("?? = ??", ["reviews.reviewed_id", "users.id"])
          .as("reviews_count"),
      )
      .where({ google_id: googleId })
      .first();
  },

  createUser: async (user) => {
    return db("users").insert(user).returning("*"); // Insert new user into database
  },

  //Update User personal information
  updateUserProfile: async (userId, updatedFields) => {
    return db("users")
      .where({ id: userId })
      .update({ ...updatedFields })
      .returning([
        "id",
        "email",
        "first_name",
        "last_name",
        "phone_number",
        "phone_verified",
        "zip_code",
        "lat",
        "lng",
        "city",
        "state",
        "updated_at",
        "profile_image",
      ]);
  },

  updateUserProfilePicture: async (userId, filePath) => {
    return db("users")
      .where({ id: userId })
      .update({ profile_image: filePath })
      .returning("profile_image");
  },

  // Block a user
  blockUser: async (blockerId, blockedId) => {
    return db("user_blocks")
      .insert({ blocker_id: blockerId, blocked_id: blockedId })
      .returning("*");
  },

  // Unblock a user
  unblockUser: async (blockerId, blockedId) => {
    return db("user_blocks")
      .where({ blocker_id: blockerId, blocked_id: blockedId })
      .del();
  },

  // Check if user1 is blocked by user2 or vice-versa
  isBlocked: async (user1Id, user2Id) => {
    const blockedByMe = await db("user_blocks")
      .where({ blocker_id: user1Id, blocked_id: user2Id })
      .first();
    const blockedByOther = await db("user_blocks")
      .where({ blocker_id: user2Id, blocked_id: user1Id })
      .first();

    return {
      isBlocked: !!blockedByMe || !!blockedByOther,
      isBlockedByMe: !!blockedByMe,
      isBlockedByOther: !!blockedByOther,
    };
  },

  // Get users blocked by a specific user
  getBlockingUsers: async (userId) => {
    return db("user_blocks")
      .where({ blocker_id: userId })
      .select("blocked_id");
  },

  // Get users who have blocked a specific user
  getBlockedByUsers: async (userId) => {
    return db("user_blocks")
      .where({ blocked_id: userId })
      .select("blocker_id");
  },

  updateAverageRating: async (userId, newAverageRating) => {
    return db("users")
      .where({ id: userId })
      .update({ average_rating: newAverageRating });
  },
};

module.exports = User;
