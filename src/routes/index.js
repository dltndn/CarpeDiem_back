const express = require('express');
const cors = require('cors'); 
const userRoute = require('./user.route');
const gamesRoute = require('./games.route');
const webhookRoute = require('./webhook.route');

const { limiter } = require('../middlewares/limiter')

let whitelist = [];
if (process.env.NODE_ENV === "development") {
  whitelist = ["http://localhost:3000", process.env.FRONT_ADDRESS];
} else if (process.env.NODE_ENV === "production") {
  whitelist = [process.env.FRONT_ADDRESS];
}

const corsOptions = {
  credentials: true,
  origin: function (origin, callback) {
    console.log("origin: ", origin)
    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
};
const corsOptions_wh = { credentials: true, origin: '*' };


const router = express.Router();

const defaultRoutes = [
  {
    path: '/user',
    route: userRoute,
  },
  {
    path: '/games',
    route: gamesRoute,
  },
  {
    path: '/webhook',
    route: webhookRoute,
  },
];

defaultRoutes.forEach((route) => {
  if (route.path === '/webhook') {
    router.use(route.path, cors(corsOptions_wh), route.route);
  } else {
    router.use(route.path, limiter, cors(corsOptions), route.route);
  }
});

module.exports = router;