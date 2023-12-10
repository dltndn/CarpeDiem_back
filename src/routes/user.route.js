const express = require('express');
const validate = require('../middlewares/validate');
const { userController, managemetController } = require('../controllers');
const { userValidation } = require('../validations');
const { isValidUserRefreshToken, isUserAuthenticated } = require('../middlewares/authorization')

const router = express.Router();

router.route('/login').post(managemetController.increaseRoute('login'), validate(userValidation.loginUser), userController.login);
router.route('/verify').post(managemetController.increaseRoute('verify'), validate(userValidation.verifySignature), userController.verifySignature);
router.route('/logout').post(managemetController.increaseRoute('logout'), userController.logout);
router.route('/validAccessToken').post(managemetController.increaseRoute('validAccessToken'), isUserAuthenticated, userController.updateAccessToken)
router.route('/updateAccessToken').post(managemetController.increaseRoute('updateAccessToken'), isValidUserRefreshToken, userController.updateAccessToken);
// router.route('/').get(userController.getUsers);

module.exports = router;