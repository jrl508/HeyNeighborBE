const express = require("express");
const {
  getRequests,
  createRequest,
  getNeighborhoodActivity,
} = require("../controllers/neighborhoodController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/requests", authMiddleware, getRequests);
router.post("/requests", authMiddleware, createRequest);
router.get("/activity", authMiddleware, getNeighborhoodActivity);

module.exports = router;
