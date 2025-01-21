const db = require("../database/db");

const getUserById = async (userId) => {
  return db("users")
    .select(
      "id",
      "email",
      "first_name",
      "last_name",
      "phone_number",
      "location",
      "created_at",
      "updated_at",
      "profile_image"
    )
    .where({ id: userId })
    .first();
};

const getUserByEmail = async (email) => {
  return db("users").where({ email }).first(); // Find user by email
};

const createUser = async (user) => {
  return db("users").insert(user).returning("*"); // Insert new user into database
};

//Update User personal information
const updateUserProfile = async (userId, updatedFields) => {
  await db("users")
    .where({ id: userId })
    .update({ ...updatedFields });
};

const updateUserProfilePicture = async (userId, filePath) => {
  await db("users").where({ id: userId }).update({ profile_image: filePath });
};

module.exports = {
  getUserByEmail,
  createUser,
  updateUserProfile,
  updateUserProfilePicture,
  getUserById,
};
