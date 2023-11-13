const express = require('express');
const validate = require('../middlewares/validate');
const { userController } = require('../controllers');
const { userValidation } = require('../validations');
const { isValidUserRefreshToken, isUserAuthenticated } = require('../middlewares/authorization')

const router = express.Router();

router.route('/login').post(validate(userValidation.loginUser), userController.login);
router.route('/verify').post(validate(userValidation.verifySignature), userController.verifySignature);
router.route('/logout').post(userController.logout);
router.route('/validAccessToken').post(isUserAuthenticated, userController.updateAccessToken)
router.route('/updateAccessToken').post(isValidUserRefreshToken, userController.updateAccessToken);
// router.route('/').get(userController.getUsers);

module.exports = router;