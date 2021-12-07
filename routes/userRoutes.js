const express = require('express');
const {
  getAllUsers,
  getUserById,
  getMe,
  createUser,
  updateUser,
  updateMe,
  deleteUser,
  deleteMe,
  setUserId,
  chat
} = require('../controllers/userController');
const {
  protect,
  restrictTo,
  signUp,
  login,
  logout,
  updatePassword,
  forgotPassword,
  resetPassword,
  confirmEmail,
  isLoggedIn,
} = require('../controllers/authController');

const jobRouter = require('./jobRoutes');

const router = express.Router();

//User unprotected routes
router.post('/signup', signUp);
router.post('/login', login);
router.get('/logout', logout);
router.post('/forgot-password', forgotPassword);
router.post('/confirmation-email', confirmEmail);
router.patch('/reset-password/:token', resetPassword);
router.get('/logged', isLoggedIn);

router.get('/chat', chat);

//Protected routes after this middleware
router.use(protect);

router.patch('/update-password', updatePassword);
router.get('/me', getMe, getUserById);
router.patch('/update-me', updateMe);
router.delete('/delete-me', deleteMe);
router.post('/', createUser);


//Nested routes
router.use('/:userId/jobs', setUserId, jobRouter);

router.route('/').get(getAllUsers); 

router.route('/:id').get(getUserById).patch(updateUser).delete(deleteUser);

module.exports = router;
