const express = require("express");
require("express-async-errors");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const cookieParser = require("cookie-parser");
const compression = require("compression");
const passport = require("passport");
const cors = require('cors'); 
const routes = require("./routes");
const {
  notFoundErrorHandler,
  globalErrorHandler,
} = require("./middlewares/error");

const app = express();

// set trust proxy
app.set('trust proxy', true);

// set security HTTP headers
app.use(helmet());

// setup CORS
app.use(cors({ credentials: true, origin: true }));
app.options('*', cors());

// body-parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.COOKIE_SECRET));

// sanitize mongodb queries for safety
app.use(mongoSanitize());

// gzip compression
app.use(compression());

// passport setup
app.use(passport.initialize());

// api routes
app.use("/api", routes);

// handle error
app.use(notFoundErrorHandler);
app.use(globalErrorHandler);

module.exports = app;
