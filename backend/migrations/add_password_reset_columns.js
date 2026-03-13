const { pool } = require('../src/config/database');

const addPasswordResetColumns = async () => {
  const client = await pool.connect();

  try {
    console.log('🔄 Adding password reset columns to users table...\n');

    await client.query('BEGIN');

    // Add reset_otp column
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS reset_otp VARCHAR(6)
    `);

    // Add reset_otp_expiry column
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS reset_otp_expiry TIMESTAMP
    `);

    await client.query('COMMIT');
    console.log('✅ Password reset columns added successfully');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Failed to add columns:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Run if called directly
if (require.main === module) {
  addPasswordResetColumns()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { addPasswordResetColumns };

