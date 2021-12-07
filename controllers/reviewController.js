const Review = require('../models/reviewModel');
const factory = require('./handlerFactory');

exports.setUserIds = (req, res, next) => {
  //Allow nested routes
  if (!req.body.userA) req.body.user = req.user.id;
  next();
};

exports.getAllReviews = factory.getAll(Review);
exports.getReviewById = factory.getOne(Review);
exports.createReview = factory.createOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);
