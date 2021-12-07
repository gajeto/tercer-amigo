const express = require('express');
const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');

const router = express.Router({ mergeParams: true });

//Protected routes after this middleware
router.use(authController.protect);

router.route('/').get(reviewController.getAllReviews).post(
  reviewController.setUserIds, 
  reviewController.createReview
);

router
  .route('/:id')
  .get(reviewController.getReviewById)
  .patch(
    reviewController.updateReview
  )
  .delete(
    reviewController.deleteReview
  );

module.exports = router;
