const db = require('../config/db');

async function logAudit({ userId, action, metadata = {} }) {
    await db.query(
        'INSERT INTO audit_logs (user_id, action, metadata) VALUES ($1, $2, $3)',
        [userId || null, action, metadata]
    );
}

module.exports = {
    logAudit,
};
