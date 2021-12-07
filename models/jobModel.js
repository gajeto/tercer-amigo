const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name'],
  },
  description: {
    type: String,
    required: [true, 'Please tell us your name'],
  },
  duration: {
     type: Number,
     min: 0,
     default: 1 
  },
  date: {
    type: Date,
    default: Date.now(),
    select: false,
  },
  userA: { //hogar
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Review must belong to an user'],
  },
  userB: { //voluntario
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  },

});

//Populates only on the query
jobSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'userA',
    select: 'name address phone',
  }).populate({      
    path: 'userB',
    select: 'name',
  });
 
  next();
});

const Job = mongoose.model('Job', jobSchema);

module.exports = Job;
