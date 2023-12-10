const express = require('express');
const { webhookController, managemetController } = require('../controllers');

const router = express.Router();

// router.route('/event').post(webhookController.sendRandomReward);
router.route('/betEvent').post(managemetController.increaseRoute('betEvent'), webhookController.getBetEvent);
router.route('/efpEvent').post(managemetController.increaseRoute('efpEvent'), webhookController.getEfpEvent)
router.route('/claimRewardEvent').post(managemetController.increaseRoute('claimRewardEvent'), webhookController.getCliaimRewardEvent)
// router.route('/').get(webhookController.getWebhooks);

// router.route('/betEventTest').post(webhookController.getBetEvent)
// router.route('/test').get(webhookController.test)
// router.route('/test2').get(webhookController.test2)
// router.route('/test3').get(webhookController.test3)
// router.route('/test4').post(webhookController.test4)

module.exports = router;