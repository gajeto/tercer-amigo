const mongoose = require('mongoose');
const User = require('./userModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      maxlength: [100, 'Please be especific'],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    userA: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a tour'],
    },
    userB: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to an user'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

//Allow the user to review a tour only once
reviewSchema.index({ userA: 1, userB: 1 }, { unique: true });

//Populates only on the query
reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'userA',
    select: 'name',
  }).populate({      
    path: 'userB',
    select: 'name',
  });
 
  next();
});

reviewSchema.statics.calcAverageRatings = async function (userId) {
  const stats = await this.aggregate([
    {
      $match: { userB: userId },
    },
    {
      $group: {
        _id: '$userB',
        nRatings: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);
  // console.log(stats);
  if (stats.length > 0) {
    await User.findByIdAndUpdate(userId, {
      ratingsQuantity: stats[0].nRatings,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await User.findByIdAndUpdate(userId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};

//Post middleare dont have acces to next()
reviewSchema.post('save', function () {
  //this points to current review after been created
  this.constructor.calcAverageRatings(this.userB);
});

//After update/delete review
reviewSchema.post(/^findOneAnd/, async function (doc) {
  if (doc) await doc.constructor.calcAverageRatings(doc.userB);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
