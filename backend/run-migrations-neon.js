const { Pool } = require('pg');
const { createTables } = require('./migrations/migrate');
const url = new URL('postgresql://neondb_owner:npg_ymSD2gkds8wB@ep-broad-brook-a4sxme5l-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require');
const pool = new Pool({ connectionString: url.href, ssl: { rejectUnauthorized: false } });

(async () => {
  try {
    pool.query = (text, params) => pool.query(text, params);
    await createTables();
    console.log('✅ All tables created including documents');
  } catch (e) {
    console.error(e);
  }
})();
