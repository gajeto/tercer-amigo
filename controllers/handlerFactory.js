const APIFeatures = require('../helpers/apiFeatures');
const AppError = require('../helpers/appError');
const catchAsync = require('../helpers/catchAsync');

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const data = await Model.findByIdAndDelete(req.params.id);

    if (!data) {
      return next(new AppError('No document found with that ID', 404));
    }

    res.status(204).json({
      status: 'Success',
      data: null,
    });
  });

exports.updateOne = (Model) =>
  (exports.updateModel = catchAsync(async (req, res, next) => {
    const data = await Model.findByIdAndUpdate(
      //Only works with PATCH
      req.params.id,
      req.body,
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );

    if (!data) {
      return next(new AppError('No document found with that ID', 404));
    }

    res.status(200).json({
      status: 'Success',
      data
    });
  }));

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const data = await Model.create(req.body);

    res.status(201).json({
      status: 'Success',
      data
    });
  });

exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (popOptions) query = query.populate(popOptions);
    const data = await query;

    if (!data) {
      return next(new AppError('No document found with that ID', 404));
    }

    res.status(200).json({
      status: 'Success',
      data
    });
  });

exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    //EXECUTE QUERY
    const features = new APIFeatures(Model.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const data = await features.query;

    //SEND RESPONSE
    res.status(200).json({
      status: 'Success',
      requestedAt: req.requestTime,
      results: data.length,
      data
    });
  });
