const express = require('express');
const userRoute = require('./user.route');
const gamesRoute = require('./games.route');
const webhookRoute = require('./webhook.route');

const { limiter } = require('../middlewares/limiter')

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
  if (route.path === '/games') {
    router.use(route.path, limiter,route.route);
  } else {
    router.use(route.path, route.route);
  }
});

module.exports = router;