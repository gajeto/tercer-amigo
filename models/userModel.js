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
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Email not valid'],
  },
  phone: String,
  ID: {
    type: Number,
    required: true,
  },
  role: {
    type: String,
    enum: ['admin', 'vendedor', 'cajero', 'cliente'],
    default: 'cliente',
  },
  shop: {
    type: mongoose.Schema.ObjectId,
    ref: 'Shop',
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
