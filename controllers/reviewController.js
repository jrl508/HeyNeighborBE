const ReviewModel = require('../models/reviewModel');
const UserModel = require('../models/userModel');
const BookingModel = require('../models/bookingModel');

const reviewController = {
  submitReview: async (req, res) => {
    try {
      const { booking_id, reviewed_id, rating_overall, rating_condition, rating_communication, rating_punctuality, comment } = req.body;
      const reviewer_id = req.user.id; // Authenticated user is the reviewer

      // 1. Validation
      if (!booking_id || !reviewed_id || !rating_overall || !rating_condition || !rating_communication || !rating_punctuality) {
        return res.status(400).json({ message: 'Missing required review fields.' });
      }
      if (rating_overall < 1 || rating_overall > 5 ||
          rating_condition < 1 || rating_condition > 5 ||
          rating_communication < 1 || rating_communication > 5 ||
          rating_punctuality < 1 || rating_punctuality > 5) {
        return res.status(400).json({ message: 'Ratings must be between 1 and 5.' });
      }

      // 2. Fetch booking and verify status
      const booking = await BookingModel.findById(booking_id);
      if (!booking) {
        return res.status(404).json({ message: 'Booking not found.' });
      }
      if (booking.status !== 'completed') {
        return res.status(400).json({ message: 'Cannot review an uncompleted booking.' });
      }

      // 3. Verify reviewer and reviewed are participants in the booking
      const isReviewerParticipant = (booking.renter_id === reviewer_id || booking.owner_id === reviewer_id);
      const isReviewedParticipant = (booking.renter_id === reviewed_id || booking.owner_id === reviewed_id);
      
      if (!isReviewerParticipant || !isReviewedParticipant) {
        return res.status(403).json({ message: 'Reviewer or reviewed user is not a participant in this booking.' });
      }

      // Ensure the reviewer is reviewing the *other* participant, not themselves
      if (reviewer_id === reviewed_id) {
          return res.status(400).json({ message: 'Cannot review yourself.' });
      }

      // Ensure the reviewed_id is actually the other party in the booking
      const otherParticipantId = (booking.renter_id === reviewer_id) ? booking.owner_id : booking.renter_id;
      if (reviewed_id !== otherParticipantId) {
        return res.status(400).json({ message: 'You can only review the other party involved in the booking.' });
      }

      // 4. Prevent duplicate reviews
      const existingReview = await ReviewModel.findForBookingAndReviewer(booking_id, reviewer_id, reviewed_id);
      if (existingReview) {
        return res.status(409).json({ message: 'You have already reviewed this user for this booking.' });
      }

      // 5. Create review
      const newReview = await ReviewModel.create({
        booking_id,
        reviewer_id,
        reviewed_id,
        rating_overall,
        rating_condition,
        rating_communication,
        rating_punctuality,
        comment,
      });

      // 6. Calculate and update average rating for the reviewed user
      const averageRating = await ReviewModel.calculateAverageRating(reviewed_id);
      await UserModel.updateAverageRating(reviewed_id, averageRating);

      res.status(201).json({ message: 'Review submitted successfully', review: newReview, averageRating });
    } catch (error) {
      console.error('Error submitting review:', error);
      res.status(500).json({ message: 'Internal server error.' });
    }
  },

  getReviewsForUser: async (req, res) => {
    try {
      const { userId } = req.params;
      const reviews = await ReviewModel.findByReviewedId(userId);
      res.status(200).json(reviews);
    } catch (error) {
      console.error('Error fetching reviews for user:', error);
      res.status(500).json({ message: 'Internal server error.' });
    }
  },

  getReviewsForBooking: async (req, res) => {
    try {
      const { bookingId } = req.params;
      const reviews = await ReviewModel.findReviewsByBookingId(bookingId);
      res.status(200).json(reviews);
    } catch (error) {
      console.error('Error fetching reviews for booking:', error);
      res.status(500).json({ message: 'Internal server error.' });
    }
  },
};

module.exports = reviewController;