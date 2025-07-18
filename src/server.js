require('dotenv').config();
const app = require('./app');
const { pool } = require('./config/db');

const PORT = process.env.PORT || 3000;

(async () => {
  try {
    // Test DB connection
    await pool.query('SELECT 1');
    console.log('✅ PostgreSQL connected successfully');

    // Start server
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server started on http://localhost:${PORT}`);
    });

    // Graceful shutdown: close pool on exit
    const shutdown = async () => {
      console.log('\n🛑 Shutting down...');
      await pool.end();
      console.log('✅ PostgreSQL pool closed');
      server.close(() => {
        console.log('💤 Server stopped');
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

  } catch (error) {
    console.error('❌ Failed to connect to PostgreSQL:', error.message);
    process.exit(1);
  }
})();
