const { pool } = require('../src/config/database');

const fixDocumentsNullConstraint = async () => {
  const client = await pool.connect();

  try {
    console.log('🔄 Fixing documents table null constraint...\n');

    await client.query('BEGIN');

    // First, update any existing documents that have NULL application_id but should be linked
    // This is a safety measure - documents without an application should have NULL
    await client.query(`
      UPDATE documents 
      SET application_id = NULL 
      WHERE application_id IS NOT NULL 
      AND NOT EXISTS (
        SELECT 1 FROM applications WHERE id = documents.application_id
      )
    `);

    // Now alter the column to allow NULL values
    await client.query(`
      ALTER TABLE documents 
      ALTER COLUMN application_id DROP NOT NULL
    `);

    await client.query('COMMIT');
    console.log('✅ documents table fixed - application_id now allows NULL');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Fix failed:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Run fix if called directly
if (require.main === module) {
  fixDocumentsNullConstraint()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { fixDocumentsNullConstraint };

