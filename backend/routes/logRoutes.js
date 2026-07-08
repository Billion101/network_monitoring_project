const express = require('express');
const router = express.Router();
const LogController = require('../controllers/logController');

router.get('/syslogs', LogController.getSyslogs);
router.get('/alerts', LogController.getAlerts);

module.exports = router;
