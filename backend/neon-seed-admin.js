const { Pool } = require('pg');
const url = new URL('postgresql://neondb_owner:npg_ymSD2gkds8wB@ep-broad-brook-a4sxme5l-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require');
const pool = new Pool({ connectionString: url.href, ssl: { rejectUnauthorized: false } });

async function seed() {
  // Hash admin123
  const bcrypt = require('bcryptjs');
  const hashed = await bcrypt.hash('admin123', 10);
  
await pool.query("DELETE FROM users WHERE email = 'admin@esteetade.com'");
  await pool.query("INSERT INTO users (id, email, password, first_name, last_name, role, email_verified, admin_approved) VALUES (gen_random_uuid(), 'admin@esteetade.com', $1, 'Admin', 'Esteetade', 'admin', true, true)", [hashed]);
  
  const result = await pool.query("SELECT * FROM users WHERE email = 'admin@esteetade.com'");
  console.log('New admin created:', result.rows[0]);
  process.exit(0);
}
seed().catch(console.error);
