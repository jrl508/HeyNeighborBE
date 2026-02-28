const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/reviews', authMiddleware, reviewController.submitReview);
router.get('/reviews/user/:userId', authMiddleware, reviewController.getReviewsForUser);
router.get('/reviews/booking/:bookingId', authMiddleware, reviewController.getReviewsForBooking);

module.exports = router;