const express = require('express');
const { webhookController } = require('../controllers');

const router = express.Router();

router.route('/event').post(webhookController.sendRandomReward);
router.route('/betEvent').post(webhookController.getBetEvent);
router.route('/').get(webhookController.getWebhooks);

router.route('/betEventTest').post(webhookController.getBetEvent)

module.exports = router;