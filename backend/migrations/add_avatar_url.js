const { pool } = require('../src/config/database');

async function up() {
  try {
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS avatar_url TEXT;
    `);
    console.log('✅ Added avatar_url column to users table');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  }
}

async function down() {
  try {
    await pool.query(`
      ALTER TABLE users 
      DROP COLUMN IF EXISTS avatar_url;
    `);
    console.log('🔄 Rolled back avatar_url column');
  } catch (error) {
    console.error('❌ Rollback failed:', error.message);
    throw error;
  }
}

module.exports = { up, down };

