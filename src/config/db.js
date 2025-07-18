const { Pool } = require('pg');
require('dotenv').config();

// const pool = new Pool({
//   connectionString: process.env.DATABASE_URL,
//   max: 10,               // 🧠 limit to 10 concurrent connections
//   idleTimeoutMillis: 30000,  // 30 seconds idle timeout
//   connectionTimeoutMillis: 5000, // 5 seconds to try connecting
// });
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    // ssl: {
    //     rejectUnauthorized: false,
    // }
});


module.exports = {
  query: (text, params) => pool.query(text, params),
  getClient: () => pool.connect(),
  pool,
};
