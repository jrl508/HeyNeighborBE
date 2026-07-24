const db = require("../database/db");

const PasswordReset = {
  createToken: async ({ userId, token, expiresAt }) => {
    // Invalidate any previous unused tokens for this user
    await db("password_resets")
      .where({ user_id: userId, used: false })
      .update({ used: true });

    return db("password_resets")
      .insert({
        user_id: userId,
        token,
        expires_at: expiresAt,
        used: false,
      })
      .returning("*");
  },

  getValidToken: async (token) => {
    return db("password_resets")
      .where({ token, used: false })
      .where("expires_at", ">", db.fn.now())
      .first();
  },

  markAsUsed: async (id) => {
    return db("password_resets")
      .where({ id })
      .update({ used: true });
  },
};

module.exports = PasswordReset;
