const User = require('../models/userModel');
const catchAsync = require('../helpers/catchAsync');
const AppError = require('../helpers/appError');
const factory = require('./handlerFactory');
const io = require('socket.io');


//Only selects the fields that we want to update
const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.updateMe = catchAsync(async (req, res, next) => {
  // Error if user tries to update password
  if (req.body.password || req.body.passwordConfirm) {
    return next(new AppError('This route is not for password updates', 400));
  }

  if (req.body.role) {
    return next(
      new AppError('Contact the administrator for role changes', 400)
    );
  }

  //Pass only the fields we allow to update
  const filteredRequest = filterObj(req.body, 'name', 'email');
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    filteredRequest,
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.setUserId = (req, res, next) => {
  if (req.params.userId) req.query.userB = req.params.userId;
  next();
};

exports.chat = (req, res, next) => {
    io.sockets.on('connection', function(socket) {
    socket.on('username', function(username) {
        socket.username = username;
        io.emit('is_online', '🔵 <i>' + socket.username + ' join the chat..</i>');
    });

    socket.on('disconnect', function(username) {
        io.emit('is_online', '🔴 <i>' + socket.username + ' left the chat..</i>');
    })

    socket.on('chat_message', function(message) {
        io.emit('chat_message', '<strong>' + socket.username + '</strong>: ' + message);
    });

});
};

//ADMIN FUNCTIONS
exports.createUser = factory.createOne(User);
exports.getAllUsers = factory.getAll(User);
//DONT UPDATE PASSWORD WITH THIS METHOD
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
exports.getUserById = factory.getOne(User);
