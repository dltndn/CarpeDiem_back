const express = require('express');
const validate = require('../middlewares/validate');
const { gamesController, managemetController } = require('../controllers');
// const { userValidation } = require('../validations');
const { isUserAuthenticated } = require('../middlewares/authorization')
const { isValidUserRefreshToken } = require('../middlewares/authorization')

const router = express.Router();


router.route('/').post(gamesController.test);
router.route('/topWinnersMini').get(managemetController.increaseRoute('topWinnersMini'), gamesController.getTopWinnersMini)
router.route('/topWinners').post(managemetController.increaseRoute('topWinners'), isValidUserRefreshToken, gamesController.getTopWinners)
router.route('/userGames').post(managemetController.increaseRoute('userGames'), isValidUserRefreshToken, gamesController.getUserGames)
router.route('/updateRewardClaimed').post(managemetController.increaseRoute('updateRewardClaimed'), isValidUserRefreshToken, gamesController.updateClaimRewards)
router.route('/currentGames').post(managemetController.increaseRoute('currentGames'), gamesController.getCurrentGames)
router.route('/getGamesByIds').post(managemetController.increaseRoute('getGamesByIds'), gamesController.getGamesByIds)
router.route('/userTotalRewards').post(managemetController.increaseRoute('userTotalRewards'), isValidUserRefreshToken, gamesController.getUserTotalRewards)


module.exports = router;