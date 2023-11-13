const express = require('express');
const validate = require('../middlewares/validate');
const { gamesController } = require('../controllers');
// const { userValidation } = require('../validations');
const { isUserAuthenticated } = require('../middlewares/authorization')
const { isValidUserRefreshToken } = require('../middlewares/authorization')

const router = express.Router();


router.route('/').post(gamesController.test);
router.route('/topWinnersMini').get(gamesController.getTopWinnersMini)
router.route('/topWinners').post(isValidUserRefreshToken, gamesController.getTopWinners)
router.route('/userGames').post(isValidUserRefreshToken, gamesController.getUserGames)
router.route('/currentGames').post(gamesController.getCurrentGames)
router.route('/getGamesByIds').post(gamesController.getGamesByIds)
router.route('/userTotalRewards').post(isValidUserRefreshToken, gamesController.getUserTotalRewards)


module.exports = router;