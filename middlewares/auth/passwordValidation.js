const bcrypt = require('bcryptjs');
const crypto = require('crypto');

exports.hashPassword = function (schema) {
  schema.pre('save', async function (next) {
    //Only run if password was entered
    if (!this.isModified('password')) return next();

    if (process.env.NODE_ENV === 'LOADER') {
      this.isNew = true;
      return next();
    }

    this.password = await bcrypt.hash(this.password, 12);
    this.passwordConfirm = undefined; //This not persists in DB
    next();
  });
};

exports.checkCorrectPassword = function (schema) {
  schema.methods.checkCorrectPassword = async function (
    unhashedPassword,
    userPassword
  ) {
    return await bcrypt.compare(unhashedPassword, userPassword);
  };
};

//Check if user changed password after jwt signing
exports.changesPasswordAfterJWTSigning = function (schema) {
  schema.methods.changesPasswordAfterJWTSigning = function (JWTTimestamp) {
    if (this.passwordChangedAt) {
      const changedTimestamp = parseInt(
        this.passwordChangedAt.getTime() / 1000,
        10
      );

      return JWTTimestamp < changedTimestamp;
    }
    return false; //Not changed
  };
};

exports.createResetPasswordToken = function (schema) {
  schema.methods.createResetPasswordToken = function () {
    const resetToken = crypto.randomBytes(32).toString('hex'); //plain text token

    this.passwordResetToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

    return resetToken; //Unencrypted token
  };
};
