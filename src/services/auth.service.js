const db = require('../config/db');
const bcrypt = require('bcrypt');
const { generateToken } = require('../utils/jwt');
const functions = require('../utils/functions');
const tableName = 'users';
// Register new user
async function signUp(userData) {
    try {
        const tableFields = await functions.getTableFields('users');
        const validData = await functions.compareFields(userData, tableFields);
        const existingUser = await db.query('SELECT id FROM users WHERE email = $1', [validData.email]);

        if (existingUser.rowCount > 0) {
            return {
                status: false,
                message: 'A user with this email already exists.',
                code: 'USER_EXISTS',
            };
        }
        if (validData.login_password) {
            if (validData.login_password !== validData.confirm_password) {
                // console.log("====",validData)
                return {
                    status: false,
                    message: 'Passwords mismatch. Please try again.',
                    code: 'PASSWORD_NOT_MATCH',
                };
            }
            validData.login_password = await bcrypt.hash(validData.login_password, 10);
            delete validData.confirm_password;
        }
        const keys = Object.keys(validData);
        const values = Object.values(validData);
        const placeholders = keys.map((_, i) => `$${i + 1}`);

        const insertQuery = `
        INSERT INTO ${tableName} (${keys.join(', ')})
        VALUES (${placeholders.join(', ')})
        RETURNING id, email, username,created_at;
        `;

        const result = await db.query(insertQuery, values);

        if (result.rowCount > 0) {
            return {
                status: true,
                message: 'User created successfully',
                data: result.rows[0],
                code: 'USER_CREATION_SUCCEEDED',
            };
        } else {
            return {
                status: false,
                message: 'User creation failed. Please try again.',
                code: 'USER_CREATION_FAILED',
            };
        }

    } catch (err) {
        return {
            status: false,
            message: 'An unexpected error occurred. Please try again later.',
            code: 'SIGNUP_ERROR',
            detail: err.detail||'An unknown error occurred during signup.',
        };
    }
}
// Login user
async function login( username, password ) {
    try {
        const result = await db.query('SELECT * FROM users WHERE username = $1', [username]);
        const userResult = result.rows[0];

        if (!userResult) {
            return {
                status: false,
                message: 'Invalid user credentials. Please check your username and password.',
                code: 'INVALID_CREDENTIALS',
            };
        }

        const valid = await bcrypt.compare(password, userResult.login_password);
        if (!valid) {
            return {
                status: false,
                message: 'Invalid user credentials. Please check your username and password.',
                code: 'INVALID_CREDENTIALS',
            };
        }

        const token = await generateToken({ userId: userResult.id , username: userResult.username });

        await db.query('UPDATE users SET token = $1 WHERE id = $2', [token, userResult.id]);

        return {
            status: true,
            message: 'User has been logged in successfully.',
            code: 'LOGIN_SUCCEEDED',
            data:{
                    id: userResult.id,
                    username: userResult.username,
                    email: userResult.email,
                },
            token,
        };

    }catch (err){ 
        // console.log("ERRR",err)
        return {
            status: false,
            message: 'An error occurred during login. Please try again later.',
            code: 'SIGNIN_ERROR',
            error: err.message || 'An unknown error occurred during login.',
        };
    }

}

// Logout User
async function logout(userId) {
    try{
        await db.query('UPDATE users SET token = NULL WHERE id = $1', [userId]);
        return { status: true, message: 'User has been logged out successfully.', code:'LOGOUT_SUCCEEDED' };
    }catch (err){ 
        return {
            status: false,
            message: 'Logout failed. Please try again.',
            code: 'LOGOUT_ERROR',
            error: err.message || 'An unknown error occurred during logout.',
        };
    }

}

// Check if token is still valid
async function isTokenValid(userId, token) {
    const result = await db.query('SELECT token FROM users WHERE id = $1', [userId]);
    return result.rows[0]?.token === token;
}

module.exports = {
    signUp,
    login,
    isTokenValid,
    logout,
};
