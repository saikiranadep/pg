const express = require('express');
const router = express.Router();
const assistantController = require('../controllers/assistant.controller');
const authenticateToken = require('../middlewares/auth.middleware');

router.post('/save', authenticateToken, assistantController.save);
router.post('/list', authenticateToken,assistantController.getList);
router.post('/detail', authenticateToken,assistantController.detail);
router.post('/delete', authenticateToken,assistantController.deleteWorkflows);

module.exports = router;
