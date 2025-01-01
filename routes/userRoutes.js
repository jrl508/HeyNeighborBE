const express = require("express");
const {
  uploadProfilePic,
  getUserById,
} = require("../controllers/userController");

const router = express.Router();

// Route for uploading a profile picture
router.post("/:id/profile-picture", uploadProfilePic);
router.get("/:id", getUserById);

module.exports = router;
