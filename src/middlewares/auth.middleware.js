const { verifyToken } = require('../utils/jwt');
const authService = require('../services/auth.service');


async function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ status : false, message:'TOKEN_MISSING', error: 'Token is missing', code:'TOKEN_MISSING' });

    try {
        const decoded = await verifyToken(token);

        const isValid = await authService.isTokenValid(decoded.userId, token);
        if (!isValid) return res.status(401).json({ status : false, message:'INVALID_TOKEN', code:'INVALID_TOKEN', error: 'Session expired. Please log in again.' });    

        req.user = decoded;
        next();
    } catch (err) {
        console.log("ERRRR",err);
        return res.status(403).json({ status : false, message:'INVALID_TOKEN', code:'INVALID_TOKEN', error: 'Invalid token' });
    }
}

module.exports = authenticateToken;
