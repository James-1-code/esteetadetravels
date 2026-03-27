const { Pool } = require('pg');
require('dotenv').config();

// Parse DATABASE_URL if present (Vercel/Neon standard)
const pgUrl = process.env.DATABASE_URL;
let config = {};

if (pgUrl) {
  const url = new URL(pgUrl);
  config = {
    connectionString: pgUrl,
    ssl: { rejectUnauthorized: false },
  };
} else {
  // Local fallback
  config = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'esteetade',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  };
}

const pool = new Pool(config);

pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL connection error:', err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
