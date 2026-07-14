const { Pool } = require('pg');

const ssl =
  process.env.DB_SSL === 'true'
    ? {
        rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
      }
    : false;

const config = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl,
    }
  : {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl,
    };

const pool = new Pool(config);

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