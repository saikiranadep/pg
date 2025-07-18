const db = require('../config/db');
const functions = require('../utils/functions');
const tableName = 'assistants';

async function save(request, isUpdate) {
    try {
        const tableFields = await functions.getTableFields(tableName);
        const validData = await functions.compareFields(request, tableFields);

        if (!validData || Object.keys(validData).length === 0) {
            return { status: false, message: 'No valid data provided.', code: 'NO_VALID_DATA' };
        }

        const keys = Object.keys(validData);
        const values = Object.values(validData);

        if (isUpdate) {
            const existId = validData.id;
            if (!existId) {
                return { status: false, message: 'Missing ID for update.', code: 'MISSING_UPDATE_ID' };
            }

            // Remove id before building SET clause
            delete validData.id;

            const updateKeys = Object.keys(validData);
            const updateValues = Object.values(validData);

            if (updateKeys.length === 0) {
                return { status: false, message: 'No fields to update.', code: 'NO_UPDATE_FIELDS' };
            }

            const setClause = updateKeys.map((k, i) => `${k} = $${i + 1}`).join(', ') + ', modified_at = NOW()';
            updateValues.push(existId); // for WHERE clause

            const query = `UPDATE ${tableName} SET ${setClause} WHERE id = $${updateValues.length} RETURNING id`;
            const result = await db.query(query, updateValues);

            return result.rowCount > 0
                ? { status: true, message: 'Assistant updated successfully', data: result.rows[0], code: 'ASSISTANT_UPDATE_SUCCESS' }
                : { status: false, message: 'Assistant update failed. Please try again.', code: 'ASSISTANT_UPDATE_FAILED' };

        } else {
            const placeholders = keys.map((_, i) => `$${i + 1}`);
            const insertQuery = `INSERT INTO ${tableName} (${keys.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING id`;
            const result = await db.query(insertQuery, values);

            return result.rowCount > 0
                ? { status: true, message: 'Assistant created successfully', data: result.rows[0], code: 'ASSISTANT_CREATION_SUCCEEDED' }
                : { status: false, message: 'Assistant creation failed. Please try again.', code: 'ASSISTANT_CREATION_FAILED' };
        }

    } catch (err) {
        return {
            status: false,
            message: 'An unexpected error occurred. Please try again later.',
            code: 'ASSISTANT_SAVE_ERROR',
            detail: err.detail || err.message || 'Execution error during create or update.',
        };
    }
}

/* Code by saikiran@2025-07-11 */
async function saveAssistant(request, isUpdate = false) {
    const client = await db.getClient();
    try {
        await client.query('BEGIN');

        const tableFields = await functions.getTableFields(tableName);
        const mainData = await functions.compareFields(request, tableFields);

        if (!mainData || Object.keys(mainData).length === 0) {
            return { status: false, message: 'No valid data provided.', code: 'NO_VALID_DATA' };
        }
        let assistantId;
        let mainResult;
        if (isUpdate) {
            assistantId = request.id;
            if (!assistantId) {
                return { status: false, message: 'Missing ID for update.', code: 'MISSING_UPDATE_ID' };
            }
            delete mainData.id;

            const updateKeys = Object.keys(mainData);
            const updateValues = Object.values(mainData);

            if (updateKeys.length === 0) {
                return { status: false, message: 'No fields to update.', code: 'NO_UPDATE_FIELDS' };
            }
            const setClause = updateKeys.map((f, i) => `${f} = $${i + 1}`).join(', ');
            updateValues.push(assistantId);


            const updateQuery = `UPDATE ${tableName} SET ${setClause}, modified_at = NOW() WHERE id = $${updateValues.length} RETURNING id`;
            mainResult = await client.query(updateQuery, updateValues);
        } else {
            const insertFields = Object.keys(mainData);
            const insertValues = Object.values(mainData);
            const placeholders = insertValues.map((_, i) => `$${i + 1}`);
            const insertQuery = `INSERT INTO ${tableName} (${insertFields.join(',')}) VALUES (${placeholders.join(',')}) RETURNING id`;
            mainResult = await client.query(insertQuery, insertValues);
            assistantId = mainResult.rows[0].id;
        }

        if (!mainResult || mainResult.rowCount === 0) {
            await client.query('ROLLBACK');
            return isUpdate
                ? { status: false, message: 'Assistant update failed. Please try again.', code: 'ASSISTANT_UPDATE_FAILED' }
                : { status: false, message: 'Assistant creation failed. Please try again.', code: 'ASSISTANT_CREATION_FAILED' };
        }

        // Clear existing nested data (if updating)
        if (isUpdate) {
            await client.query('DELETE FROM action_workflows WHERE assistant_id = $1', [assistantId]);
            await client.query('DELETE FROM calltransfer_workflows WHERE assistant_id = $1', [assistantId]);
        }

        // Save nested action_workflow
        const actions = request.action_workflow || [];
        for (const a of actions) {
            await client.query(`
                INSERT INTO action_workflows 
                (assistant_id, action_type, scenario_description, text_message, voice_response)
                VALUES ($1, $2, $3, $4, $5)
            `, [assistantId, a.action_type, a.scenario_description, a.text_message, a.voice_response]);
        }

        // Save nested calltransfer_workflow
        const transfers = request.calltransfer_workflow || [];
        for (const c of transfers) {
            await client.query(`
                INSERT INTO calltransfer_workflows 
                (assistant_id, scenario_type, scenario_description, voice_response, phone_number)
                VALUES ($1, $2, $3, $4, $5)
            `, [assistantId, c.scenario_type, c.scenario_description, c.voice_response, c.phone_number]);
        }

        await client.query('COMMIT');
        return isUpdate
        ? { status: true, message: 'Assistant updated successfully', data: mainResult.rows[0], code: 'ASSISTANT_UPDATE_SUCCESS' }
        : { status: true, message: 'Assistant created successfully', data: mainResult.rows[0], code: 'ASSISTANT_CREATION_SUCCEEDED' };


    } catch (err) {
        await client.query('ROLLBACK');
        // console.log('SAVEERRR',err)
        return {
            status: false,
            message: 'An unexpected error occurred. Please try again later.',
            code: 'ASSISTANT_SAVE_ERROR',
            detail: err.detail || err.message || 'Execution error during create or update.',
        };
    } finally {
        client.release();
    }
}
/* code added by saikiran@2025-07-11 */
async function getAssistantDetails(assistantId) {
    try{
        const assistant = await db.query(`SELECT * FROM ${tableName} WHERE id = $1 AND deleted = 0`, [assistantId]);
        if (assistant.rowCount === 0) return { status: false, message: 'No record found.', code: 'RECORD_NOT_FOUND' };

        const actionResults = await db.query('SELECT * FROM action_workflows WHERE assistant_id = $1', [assistantId]);
        const transferResults = await db.query('SELECT * FROM calltransfer_workflows WHERE assistant_id = $1', [assistantId]);

        return {
            ...assistant.rows[0],
            action_workflow: actionResults.rows,
            calltransfer_workflow: transferResults.rows,
            status: true, message: 'Assistant fetched successfully',
            code:'RECORD_FOUND',
        };
    }catch (err) {
        console.log('getAssistantDetails ERR',err)
        return {
            status: false,
            message: 'An unexpected error occurred. Please try again later.',
            code: 'ASSISTANT_DETAIL_ERROR',
            detail: err.detail || err.message || 'Execution error during fetching details',
        };
    }

}
async function getList(assistantId) {
    try{
        const assistant = await db.query(`SELECT id,assistant_name FROM ${tableName} WHERE deleted = 0`);
        if (assistant.rowCount === 0) return { status: false, message: 'No record found.', code: 'RECORD_NOT_FOUND' };
        // console.log('Count',assistant)
        return {
            list:assistant.rows,
            status: true, message: 'Assistant List fetched  successfully',
            code:'RECORD_FOUND',
            listCount : assistant.rowCount
        };
    }catch (err) {
        console.log('getList ERR',err)
        return {
            status: false,
            message: 'An unexpected error occurred. Please try again later.',
            code: 'ASSISTANT_LIST_ERROR',
            detail: err.detail || err.message || 'Execution error during fetching list.',
        };
    }

}

async function deleteWorkflows({ id, action }) {
    try {
        if (!id || !action) {
            return {
                status: false,
                message: 'Missing ID or action type',
                code: 'INVALID_DELETE_INPUT'
            };
        }

        let result;

        if (action === 'assistants') {
            result = await db.query(`UPDATE assistants SET deleted = 1, modified_at = NOW() WHERE id = $1`, [id]);

            await db.query(`UPDATE action_workflows SET deleted = 1, modified_at = NOW() WHERE assistant_id = $1`, [id]);
            await db.query(`UPDATE calltransfer_workflows SET deleted = 1, modified_at = NOW() WHERE assistant_id = $1`, [id]);

        } else if (['action_workflows', 'calltransfer_workflows'].includes(action)) {
            result = await db.query(`UPDATE ${action} SET deleted = 1, modified_at = NOW() WHERE id = $1`, [id]);
        } else {
            return {
                status: false,
                message: 'Invalid action type',
                code: 'INVALID_ACTION_TYPE'
            };
        }
        // console.log("reslut",result);
        return result.rowCount > 0
            ? { status: true, message: 'Deleted successfully', code: 'DELETION_SUCCEEDED' }
            : { status: false, message: 'Delete failed or record not found', code: 'DELETION_FAILED' };

    } catch (err) {
        return {
            status: false,
            message: 'An unexpected error occurred. Please try again later.',
            code: 'ASSISTANT_DELETION_ERROR',
            detail: err.detail || err.message || 'Execution error during deletion.',
        };
    }
}


/* End by Saikiran */


module.exports = {
    save,
    saveAssistant,
    getAssistantDetails,
    getList,
    deleteWorkflows
};
