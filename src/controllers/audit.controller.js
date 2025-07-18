const db = require('../config/db');
const { sendSuccess, sendError } = require('../utils/response');

exports.getLogs = async (req, res) => {
    try {
        // console.log("reqqq",req);
        const userId = req.user.userId;
        const { rows } = await db.query('SELECT * FROM audit_logs WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100',[userId]);
        const result = { status: true, message:'Audit logs fetched success',code:'AUDITLOG_SUCCEEDED', data: rows }
        return sendSuccess(res, result);
    } catch (err) {
        return sendError(res, 'An error occurred while fetching data. Please try again later.', 500, err.message, 'AUDITLOG_FETCH_ERROR');
    }
};
