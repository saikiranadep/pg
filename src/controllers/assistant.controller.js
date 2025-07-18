const db = require('../config/db');
const { sendSuccess, sendError } = require('../utils/response');
const assistantService = require('../services/assistant.service');

exports.save = async (req, res, next) => {
    try {
        if(req.body){
            let isUpdate = false;
            if(req.body.id){
                isUpdate = true;
            }
            const result = await assistantService.saveAssistant(req.body,isUpdate);
            // console.log("result",result)
            return sendSuccess(res, result);
        }else{
            return sendError(res, 'An unexpected error occurred. Please try again later.', 400, 'Invalid Data format', 'ASSISTANT_SAVE_INVALID_INPUT');
        }
    } catch (err) {
        return sendError(res, 'An unexpected error occurred. Please try again later.', 500, err.message, 'ASSISTANT_SAVE_ERROR');
    }
};

exports.detail = async (req, res, next) => {
    try {
        if(req.body.id){
            const result = await assistantService.getAssistantDetails(req.body.id);
            // console.log("result",result)
            return sendSuccess(res, result);
        }else{
            return sendError(res, 'An unexpected error occurred. Please try again later.', 400, 'Invalid Data format', 'ASSISTANT_DETAIL_INVALID_INPUT');
        }
    } catch (err) {
        return sendError(res, 'An unexpected error occurred. Please try again later.', 500, err.message, 'ASSISTANT_DETAIL_ERROR');
    }
};

exports.getList = async (req, res, next) => {
    try {
        const result = await assistantService.getList();
        return sendSuccess(res, result);
    } catch (err) {
        return sendError(res, 'An unexpected error occurred. Please try again later.', 500, err.message, 'ASSISTANT_LIST_ERROR');
    }
};

exports.deleteWorkflows = async (req, res, next) => {
    try {
            const { id, action } = req.body;
            if (!id || !action) {
                return sendError(
                    res,
                    'Invalid request format.',
                    400,
                    'Missing required fields: id and action.',
                    'ASSISTANT_DELETE_INVALID_INPUT'
                );
            }
            const result = await assistantService.deleteWorkflows({ id, action });
            return sendSuccess(res, result);
    }catch (err) {
        return sendError(res, 'An unexpected error occurred. Please try again later.', 500, err.message, 'ASSISTANT_DELETION_ERROR');
    }

}


