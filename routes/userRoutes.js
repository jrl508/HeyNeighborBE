const express = require("express");
const upload = require("../middleware/fileUploadMiddleware");
const {
  uploadProfilePic,
  getUserById,
  updateUser,
  reverseGeocode,
} = require("../controllers/userController");

const router = express.Router();

// Route for reverse geocoding
router.get("/reverse-geocode", reverseGeocode);

// Route for uploading a profile picture
router.post(
  "/:id/profile-picture",
  upload.single("profile_picture"),
  uploadProfilePic
);
router.get("/:id", getUserById);
router.patch("/:id", updateUser);

module.exports = router;

