const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/userModel');
const catchAsync = require('../helpers/catchAsync');
const AppError = require('../helpers/appError');
const sendEmail = require('../helpers/email');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRATION,
  });
};

const createAndSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRATION * 24 * 60 * 60 * 1000
    ),
    httpOnly: true, //Do not store in browser
    //secure: true, //Only on HTTPS
  };

  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  //Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    user: user,
  });
};

exports.signUp = catchAsync(async (req, res, next) => {
  //Desintegrate req.body avoids field injection
  if (req.body.role !== 'admin') {
    const newUser = await User.create({
      name: req.body.name,
      email: req.body.email,
      ID: req.body.ID,
      password: req.body.password,
      passwordConfirm: req.body.passwordConfirm,
      passwordChangedAt: req.body.passwordChangedAt,
      role: req.body.role,
    });
    createAndSendToken(newUser, 201, res);
  } else {
    return next(
      new AppError('You are not authorized to sign up as admin', 400)
    );
  }
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  //Check if email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }
  //Check if user exists and password is correct
  //select(+password) for enabling password to show on res
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.checkCorrectPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }
  //Send token if all OK
  createAndSendToken(user, 200, res);
});

//Simulates deleting cookie by sending cookie without token
exports.logout = (req, res) => {
  res.cookie('jwt', 'null', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  return res.status(200).json({ status: 'logged-out' });
};

exports.protect = catchAsync(async (req, res, next) => {
  //Check if token exists
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(new AppError('Please log in to access', 401));
  }

  //Validate token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  //Check if user exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError('User related to this token no longer exists', 401)
    );
  }

  //Check if user changed password after jwt sign
  if (currentUser.changesPasswordAfterJWTSigning(decoded.iat)) {
    return next(
      new AppError('Password changed recently. Please log in again', 401)
    );
  }

  req.user = currentUser; //Pass current user to request queue
  res.locals.user = currentUser;
  next();
});

exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies['jwt']) {
    try {
      //Verify token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      //Check if user still exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }

      //Check if user changed password after the token was issued
      if (currentUser.changesPasswordAfterJWTSigning(decoded.iat)) {
        return next();
      }
      
      //THERE IS A LOGGED IN USER
      return res.status(200).json({
        logged: true,
        user: currentUser
      });

    } catch (err) {
      return next(err);
    }
  }
  next();
};

//(...roles) desintegrate array of roles
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You are not authorized to perform this action', 403)
      );
    }

    next();
  };
};

exports.confirmEmail = catchAsync(async (req, res, next) => {
  //Get user from email passed
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('Not found user related to this email', 404));
  }

  //Generate random reset token
  const resetToken = user.createResetPasswordToken();
  await user.save({ validateBeforeSave: false }); //Update the current user document

  //Send token to user's email
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/reset-password/${resetToken}`;

  const message = `¡¡¡¡Gracias por ser nuestro amigo!!! Por favor sigue el link para generar una nueva contraseña de acceso: ${resetURL}`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Tu token de acceso a Tercer Amigo (valido por 10 min)',
      message: message,
    });

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new AppError('Error sending the recovery password email', 500));
  }
});

exports.forgotPassword = catchAsync(async (req, res, next) => {
  //Get user from email passed
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('Not found user related to this email', 404));
  }

  //Generate random reset token
  const resetToken = user.createResetPasswordToken();
  await user.save({ validateBeforeSave: false }); //Update the current user document

  //Send token to user's email
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/reset-password/${resetToken}`;

  const message = `Sigue el link para generar una nueva contraseña ${resetURL}`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Password reset (valido por 10 min)',
      message: message,
    });

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new AppError('Error sending the recovery password email', 500));
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  //Get user based on token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }, //If expiration date is greater than now
  });

  //If token not expired then set new password
  if (!user) {
    return next(new AppError('Token invalid or expired', 500));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save(); //Must ppdate changedPasswordAt field

  //Log in user, send JWT
  createAndSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  //Get user from collection
  const user = await User.findById(req.user.id).select('+password');

  //Check if passed current password is correct
  if (
    !user ||
    !(await user.checkCorrectPassword(req.body.passwordCurrent, user.password))
  ) {
    return next(new AppError('Incorrect password', 401));
  }

  //If all OK, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  createAndSendToken(user, 200, res);
});
