const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_ymSD2gkds8wB@ep-broad-brook-a4sxme5l-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require';

const pool = new Pool({ 
  connectionString: DATABASE_URL, 
  ssl: { rejectUnauthorized: false } 
});

(async () => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Run migrations
const { createTables } = require('./migrations/migrate.js');
    await createTables();
    console.log('✅ Tables created');

    // Seed admin user
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await client.query(`
      INSERT INTO users (id, email, password, first_name, last_name, role, email_verified, admin_approved, created_at)
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, true, true, NOW())
      ON CONFLICT (email) DO NOTHING
    `, ['admin@esteetade.com', hashedPassword, 'Admin', 'Esteetade', 'admin']);
    console.log('✅ Admin user seeded');

    // Seed website_types
    await client.query(`
      INSERT INTO "website_types" (name, description, base_price, is_active)
      VALUES 
        ('basic', '5-page static site with contact form', 25000, true),
        ('standard', 'Full CMS site with admin panel', 75000, true),
        ('ecommerce', 'Shop with payments and inventory', 150000, true)
      ON CONFLICT (name) DO NOTHING
    `);
    console.log('✅ Website types seeded');

    await client.query('COMMIT');
    console.log('🎉 FULL NEON DB SETUP COMPLETE');
    console.log('Login: admin@esteetade.com / admin123');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error:', error);
  } finally {
    client.release();
  }
})();

