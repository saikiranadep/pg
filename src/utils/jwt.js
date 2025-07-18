const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'youarehotpot';

async function generateToken(payload, expiresIn = '1d') {
    return jwt.sign(payload, SECRET, { expiresIn });
}

async function verifyToken(token) {
    return jwt.verify(token, SECRET);
}

module.exports = {
    generateToken,
    verifyToken,
};
