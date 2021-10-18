exports.activeUsers = function (schema) {
  schema.pre(/^find/, function (next) {
    this.find({ active: { $ne: false } });
    next();
  });
};

//Before saving new password, update changedAt field
exports.passwordChange = function (schema) {
  schema.pre('save', async function (next) {
    if (!this.isModified('password') || this.isNew) return next();

    //If the token is sent before saving the document rest 1 second
    this.passwordChangedAt = Date.now() - 1000;
    next();
  });
};
