const express = require('express');
const { webhookController } = require('../controllers');

const router = express.Router();

router.route('/event').post(webhookController.sendRandomReward);
router.route('/betEvent').post(webhookController.getBetEvent);
router.route('/efpEvent').post(webhookController.getEfpEvent)
router.route('/').get(webhookController.getWebhooks);

router.route('/betEventTest').post(webhookController.getBetEvent)
router.route('/test').get(webhookController.test)
router.route('/test2').get(webhookController.test2)
router.route('/test3').get(webhookController.test3)

module.exports = router;