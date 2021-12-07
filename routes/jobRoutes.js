const express = require('express');
const jobController = require('../controllers/jobController');
const authController = require('../controllers/authController');

const router = express.Router({ mergeParams: true });

//Protected routes after this middleware
router.use(authController.protect);

router
  .route('/')
  .get(jobController.getAllJobs)
  .post(jobController.createJob);

router
  .route('/:id')
  .get(jobController.getJobById)
  .patch(jobController.updateJob)
  .delete(jobController.deleteJob);


module.exports = router;
