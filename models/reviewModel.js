const knex = require('../database/db');

class Review {
  static async create(reviewData) {
    try {
      const [review] = await knex('reviews').insert(reviewData).returning('*');
      return review;
    } catch (error) {
      throw new Error(`Error creating review: ${error.message}`);
    }
  }

  static async findByReviewedId(reviewedId) {
    try {
      return await knex('reviews')
        .where({ reviewed_id: reviewedId })
        .join('users as reviewer', 'reviews.reviewer_id', 'reviewer.id')
        .select(
          'reviews.*',
          knex.raw("CONCAT(reviewer.first_name, ' ', reviewer.last_name) as reviewer_username"),
          'reviewer.profile_image as reviewer_profile_image'
        );
    } catch (error) {
      throw new Error(`Error fetching reviews by reviewed ID: ${error.message}`);
    }
  }

  static async findForBookingAndReviewer(bookingId, reviewerId, reviewedId) {
    try {
      return await knex('reviews')
        .where({
          booking_id: bookingId,
          reviewer_id: reviewerId,
          reviewed_id: reviewedId,
        })
        .first();
    } catch (error) {
      throw new Error(`Error checking for existing review: ${error.message}`);
    }
  }

  static async calculateAverageRating(userId) {
    try {
      const result = await knex('reviews')
        .where({ reviewed_id: userId })
        .avg('rating_overall as averageRating')
        .first();
      return result.averageRating || 0;
    } catch (error) {
      throw new Error(`Error calculating average rating: ${error.message}`);
    }
  }

  static async findReviewsByBookingId(bookingId) {
    try {
      return await knex('reviews')
        .where({ booking_id: bookingId })
        .join('users as reviewer', 'reviews.reviewer_id', 'reviewer.id')
        .select(
          'reviews.*',
          knex.raw("CONCAT(reviewer.first_name, ' ', reviewer.last_name) as reviewer_username"),
          'reviewer.profile_image as reviewer_profile_image'
        );
    } catch (error) {
      throw new Error(`Error fetching reviews by booking ID: ${error.message}`);
    }
  }
}

module.exports = Review;