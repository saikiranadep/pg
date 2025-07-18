const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth.controller');
const authenticateToken = require('../middlewares/auth.middleware');

router.post('/signup', authController.signUp);
router.post('/login', authController.login);
router.post('/logout', authenticateToken, authController.logout);

router.get('/me', authenticateToken, (req, res) => {
    res.json({
        message: 'You are authorized!',
        user: req.user,
    });
});

module.exports = router;
