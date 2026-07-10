const express = require("express");
const {
  getRequests,
  createRequest,
  getNeighborhoodActivity,
  deleteRequest,
} = require("../controllers/neighborhoodController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/requests", authMiddleware, getRequests);
router.post("/requests", authMiddleware, createRequest);
router.get("/activity", authMiddleware, getNeighborhoodActivity);
router.delete("/requests/:id", authMiddleware, deleteRequest);

module.exports = router;
