const { Pool } = require('pg');

// Prefer a single DATABASE_URL if provided, otherwise build the connection
// from discrete vars so DB_HOST can point at "db" (Compose) or a private IP (AWS).
const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL }
    : {
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 5432,
      user: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DB,
    },
);

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
});

function query(text, params) {
  return pool.query(text, params);
}

module.exports = { query, pool };
