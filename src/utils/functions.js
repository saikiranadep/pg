const dbname = process.env.DB_DATABASE;
const db = require('../config/db');

class functionsUtil {
    static async getTableFields(table) {
        const schema = 'public';
        const query = `
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = $1
        AND table_schema = $2
    `;
        const result = await db.query(query, [table, schema]);
        if (result?.rows?.length > 0) {
            return result.rows.map(row => row.column_name);
        }
        return [];
    }
    /* @Function to Compare table fields to Form fields and return match field with key vale in object added by saikiran@2025-07-09*/
    static async compareFields(request, tableFields) {
        return Object.fromEntries(
            Object.entries(request)
                .filter(([key]) => tableFields.includes(key))
        );
    }

}
module.exports = functionsUtil;
