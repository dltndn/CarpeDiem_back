const express = require('express');
const validate = require('../middlewares/validate');
const { gamesController } = require('../controllers');
// const { userValidation } = require('../validations');
const { isUserAuthenticated } = require('../middlewares/authorization')

const router = express.Router();


router.route('/').get(isUserAuthenticated, gamesController.test);
router.route('/topWinners').post(isUserAuthenticated, gamesController.test)

module.exports = router;