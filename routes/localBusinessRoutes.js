const express = require("express");
const router = express.Router();
const LocalBusinessController = require("../controllers/localBusinessController");
const authMiddleware = require("../middleware/authMiddleware");

// Create a new business recommendation (requires auth)
router.post("/", authMiddleware, LocalBusinessController.createBusiness);

// Get all businesses (paginated, no auth required)
router.get("/", LocalBusinessController.listBusinesses);

// Search businesses by location (zip + radius)
router.get("/search", LocalBusinessController.searchByLocation);

// Search businesses by type
router.get("/type/:type", LocalBusinessController.searchByType);

// Get user's businesses
router.get("/owner/:userId", LocalBusinessController.getUserBusinesses);

// Get business by ID (no auth required)
router.get("/:id", LocalBusinessController.getBusiness);

// Update business (requires auth + ownership)
router.patch("/:id", authMiddleware, LocalBusinessController.updateBusiness);

// Delete business (requires auth + ownership)
router.delete("/:id", authMiddleware, LocalBusinessController.deleteBusiness);

module.exports = router;
