const db = require('../config/db');
const { AccessToken } = require('livekit-server-sdk');
const { sendSuccess, sendError } = require('../utils/response');

const apiKey = 'YOUR_API_KEY';
LIVEKIT_API_KEY = "API4zZa3L4pQ969";
LIVEKIT_API_SECRET = "fklH67Z3MppeAuBGH7JQR1eqabryIa9eoTcgIjxKOkvA";
LIVEKIT_URL = "wss://phoneproject-66hwm44g.livekit.cloud";
const apiSecret = 'YOUR_API_SECRET';


exports.createToken = async (req, res) => {
    try {
        // return sendSuccess(res, "Success");
        const { identity, room } = req.body;
        const token = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, { identity });
        // console.log("tokentoken",token)
        token.addGrant({
            roomJoin: true,
            room,
            canPublish: true,
            canSubscribe: true,
        });

        const tokenJWT = await token.toJwt();
        const responseData = {
            status: true,
            token: tokenJWT,
            wsUrl: LIVEKIT_URL,
            roomName: room,
            identity: identity,
            // expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
        };
        console.log("result", responseData)
        return sendSuccess(res, responseData);
    } catch (err) {
        return sendError(res, 'An error occurred while fetching data. Please try again later.', 500, err.message, 'LIVEKIT_TOKEN_ERROR');
    }
};

exports.generateToken = async(identity, roomName) => {
    const at = new AccessToken(
        LIVEKIT_API_KEY,
        LIVEKIT_API_SECRET,
        { identity }
    );
    at.addGrant({ roomCreate: true, roomJoin: true, room: roomName });
    return at.toJwt();
}
