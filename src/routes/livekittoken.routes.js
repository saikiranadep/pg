const express = require('express');
const router = express.Router();
const livekitController = require('../controllers/livekittoken.controller');
const authenticateToken = require('../middlewares/auth.middleware');

router.post('/generatetoken', livekitController.createToken);


module.exports = router;
