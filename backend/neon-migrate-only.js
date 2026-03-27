const { Pool } = require('pg');
const { createTables } = require('./migrations/migrate.js');

const DATABASE_URL = 'postgresql://neondb_owner:npg_ymSD2gkds8wB@ep-broad-brook-a4sxme5l-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require';

const pool = new Pool({ 
  connectionString: DATABASE_URL, 
  ssl: { rejectUnauthorized: false } 
});

(async () => {
  try {
    pool.query = (text, params) => pool.query(text, params);
    await createTables();
    console.log('✅ MIGRATIONS COMPLETE - ALL TABLES CREATED');
  } catch (e) {
    console.error('❌ ERROR:', e);
  } finally {
    await pool.end();
  }
})();

