const mongoose = require('mongoose');
const validator = require('validator');

const {
  activeUsers,
  passwordChange,
} = require('../middlewares/references/userPopulate');

const {
  hashPassword,
  checkCorrectPassword,
  changesPasswordAfterJWTSigning,
  createResetPasswordToken,
} = require('../middlewares/auth/passwordValidation');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name'],
  },
  username: {
    type: String,
    required: [true, 'Please tell us your name'],
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Email not valid'],
  },
  phone: String,
  address: String,
  role: {
    type: String,
    enum: ['admin', 'voluntario', 'hogar'],
    default: 'voluntario',
  },
  rating: {
    type: Number,
    default: 4.5,
  },
  ratingsAverage: {
    type: Number,
    default: 4.5,
    min: [1, 'Rating must be above 1.0'],
    max: [5, 'Rating must be below 5.0'],
    set: (val) => Math.round((val + Number.EPSILON) * 10) / 10,
  },
  ratingsQuantity: {
    type: Number,
    default: 0,
  },
  password: {
    type: String,
    minlength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    validate: {
      //Only works on SAVE or CREATE
      validator: function (el) {
        return el === this.password;
      },
      message: 'Passwords are not the same',
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

//Model population
userSchema.plugin(activeUsers);
userSchema.plugin(passwordChange);

//Authentication
userSchema.plugin(hashPassword);
userSchema.plugin(checkCorrectPassword);
userSchema.plugin(changesPasswordAfterJWTSigning);
userSchema.plugin(createResetPasswordToken);

const User = mongoose.model('User', userSchema);

module.exports = User;
