/**
 * Database Cleanup Script
 * Removes all demo/seeded data for going live
 * 
 * Run with: node migrations/cleanup.js
 */

const { pool } = require('../src/config/database');

const cleanupDatabase = async () => {
  const client = await pool.connect();

  try {
    console.log('🧹 Starting database cleanup...\n');
    await client.query('BEGIN');

    // Delete in reverse order of dependencies
    // 1. Delete notifications
    const notificationsResult = await client.query('DELETE FROM notifications RETURNING id');
    console.log(`✅ Deleted ${notificationsResult.rowCount} notifications`);

    // 2. Delete documents
    const documentsResult = await client.query('DELETE FROM documents RETURNING id');
    console.log(`✅ Deleted ${documentsResult.rowCount} documents`);

    // 3. Delete invoices
    const invoicesResult = await client.query('DELETE FROM invoices RETURNING id');
    console.log(`✅ Deleted ${invoicesResult.rowCount} invoices`);

    // 4. Delete applications
    const applicationsResult = await client.query('DELETE FROM applications RETURNING id');
    console.log(`✅ Deleted ${applicationsResult.rowCount} applications`);

    // 5. Delete all users except the admin (keep admin for login)
    // First, find the admin user
    const adminResult = await client.query(
      "SELECT id FROM users WHERE role = 'admin' LIMIT 1"
    );
    
    let adminId = null;
    if (adminResult.rows.length > 0) {
      adminId = adminResult.rows[0].id;
    }

    // Delete all non-admin users
    if (adminId) {
      const usersResult = await client.query(
        'DELETE FROM users WHERE id != $1 RETURNING id',
        [adminId]
      );
      console.log(`✅ Deleted ${usersResult.rowCount} demo users (kept admin)`);
    } else {
      // If no admin exists, delete all users
      const usersResult = await client.query('DELETE FROM users RETURNING id');
      console.log(`✅ Deleted ${usersResult.rowCount} users (no admin found)`);
    }

    await client.query('COMMIT');
    console.log('\n🎉 Database cleanup completed successfully!');
    console.log('\n📝 Note: Admin account has been preserved for login.');
    console.log('   You may need to create new agent accounts after going live.');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Cleanup failed:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Run cleanup if called directly
if (require.main === module) {
  cleanupDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { cleanupDatabase };

