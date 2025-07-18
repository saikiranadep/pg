const express = require('express');
const router = express.Router();
const auditController = require('../controllers/audit.controller');
const authenticateToken = require('../middlewares/auth.middleware');

router.post('/auditLogs', authenticateToken, auditController.getLogs);

module.exports = router;
