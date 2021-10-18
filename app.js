const express = require('express');
const path = require('path');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const cors = require('cors');

//ROUTES
const userRouter = require('./routes/userRoutes');

const AppError = require('./helpers/appError');
const errorHandler = require('./controllers/errorController');

const app = express();
app.enable('trust-proxy');


//GLOBAL MIDDLEWARES
//Serving static files
app.use(express.static(path.join(__dirname, 'public')));

//Respond to options request in preflight phase
app.options('*', cors());

//Secure HTTP headers
app.use(helmet());

//Dev request logging
app.use(morgan('dev')); //Muestra la petición HTTP junto con tiempo de respuesta

//Limit requests from same IP address
const limiter = rateLimit({
  max: 100, //100 request in 1 hour
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour',
});
app.use('/api', limiter);


//Body parser: body -> req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

//Data sanitization against XSS and NoSQL query injection
app.use(mongoSanitize());
app.use(xss());


//Timestamp of request
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  //console.log(req.cookies);
  next();
});

app.use(compression());


//ROUTING
app.use('/api/v1/users', userRouter);

//Handling unkown URL
app.all('*', (req, res, next) => {
  next(new AppError(`Can´t find ${req.originalUrl} on this server`, 404));
});

app.use(errorHandler);

module.exports = app;
