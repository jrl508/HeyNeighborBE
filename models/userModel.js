const db = require("../database/db");

const User = {
  getUserById: async (userId) => {
    return db("users")
      .select(
        "id",
        "email",
        "first_name",
        "last_name",
        "phone_number",
        "zip_code",
        "lat",
        "lng",
        "city",
        "state",
        "created_at",
        "updated_at",
        "profile_image",
      )
      .where({ id: userId })
      .first();
  },

  getUserByEmail: async (email) => {
    return db("users").where({ email }).first(); // Find user by email
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
};

module.exports = User;
