function sendSuccess(res, data, responseCode = 200) {
    return res.status(responseCode).json(
        data
    );
}

function sendError(res, message = 'Something went wrong', responseCode = 500, errDetails = null, code=null) {
    return res.status(responseCode).json({
        status:false,
        code,
        message,
        error:errDetails
    });
}

module.exports = {
    sendSuccess,
    sendError,
};
