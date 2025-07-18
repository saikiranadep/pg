const authService = require('../services/auth.service');
const { logAudit } = require('../services/audit.service');
const { sendSuccess, sendError } = require('../utils/response');

exports.signUp = async (req, res, next) => {
    try {
        const {
            login_password,
            confirm_password,
            ...userData
        } = req.body;
        userData.login_password = login_password;
        userData.confirm_password = confirm_password;
        const result = await authService.signUp(userData);
        return sendSuccess(res, result);
    } catch (err) {
        return sendError(res, 'An error occurred during sign-up. Please try again later.', 500, err.message, 'SIGNUP_ERROR');
    }
};


exports.login = async (req, res, next) => {
    try {
        const { username, login_password } = req.body;
        const result = await authService.login( username, login_password );
        // 👇 Log login
        const userId = result?.data?.id ?? null;
        await logAudit({
            userId: userId,
            action: 'LOGIN',
            metadata: { result }
        });
        return sendSuccess(res, result);
        // res.status(200).json(result);
    } catch (err) {
        // console.log("ERRRRRRR",err)
        return sendError(res, 'An error occurred during Login. Please try again later.', 500, err.message, 'SIGNIN_ERROR');
    }
};

exports.logout = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const result = await authService.logout(userId);
        // 👇 Log logout
        await logAudit({
            userId,
            action: 'LOGOUT',
            metadata: {result}
        });
        return sendSuccess(res, result);
    } catch (err) {
        return sendError(res, 'An error occurred during Logout. Please try again later.', 500, err.message, 'LOGOUT_ERROR');
    }
};

