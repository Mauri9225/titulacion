const { Pool } = require('pg');

const ssl =
  process.env.DB_SSL === 'true'
    ? {
        rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
      }
    : false;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl,
});

async function query(text, params) {
  return pool.query(text, params);
}

async function checkConnection() {
  const result = await query('SELECT NOW() AS connected_at');
  return result.rows[0];
}

module.exports = {
  checkConnection,
  pool,
  query,
};
