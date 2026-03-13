const { pool } = require('../src/config/database');

const createTables = async () => {
  const client = await pool.connect();

  try {
    console.log('🔄 Running migrations...\n');

    await client.query('BEGIN');

    // Ensure pgcrypto extension for UUID generation
    await client.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);

    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        role VARCHAR(20) NOT NULL CHECK (role IN ('client', 'agent', 'admin')),
        referral_code VARCHAR(50) UNIQUE,
        referred_by UUID REFERENCES users(id),
        email_verified BOOLEAN DEFAULT false,
        admin_approved BOOLEAN DEFAULT false,
        avatar_url TEXT,
        address TEXT,
        bio TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ users table created');

    // Applications table
    await client.query(`
      CREATE TABLE IF NOT EXISTS applications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        agent_id UUID REFERENCES users(id),
        application_type VARCHAR(50) NOT NULL CHECK (application_type IN ('cv', 'study', 'work', 'flight', 'hotel', 'document')),
        type_label VARCHAR(100) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        currency VARCHAR(3) NOT NULL DEFAULT 'NGN',
        status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','completed')),
        progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
        documents TEXT[],
        form_data JSONB,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ applications table created');

    // Invoices table
    await client.query(`
      CREATE TABLE IF NOT EXISTS invoices (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
        client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        invoice_number VARCHAR(50) UNIQUE NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        currency VARCHAR(3) NOT NULL DEFAULT 'NGN',
        status VARCHAR(20) NOT NULL DEFAULT 'unpaid' CHECK (status IN ('paid','unpaid','refunded','cancelled')),
        payment_method VARCHAR(50),
        payment_reference VARCHAR(255),
        paid_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ invoices table created');

    // Notifications table
    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(20) NOT NULL DEFAULT 'info' CHECK (type IN ('info','success','warning','error')),
        read BOOLEAN DEFAULT false,
        link VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ notifications table created');

    // Documents table
    await client.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        filename VARCHAR(255) NOT NULL,
        original_name VARCHAR(255) NOT NULL,
        mime_type VARCHAR(100) NOT NULL,
        size INTEGER NOT NULL,
        path TEXT NOT NULL,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ documents table created');

    // Activity logs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        action VARCHAR(100) NOT NULL,
        entity_type VARCHAR(50) NOT NULL,
        entity_id UUID,
        details JSONB,
        ip_address INET,
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ activity_logs table created');

    // Service prices table
    await client.query(`
      CREATE TABLE IF NOT EXISTS service_prices (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        service_type VARCHAR(50) NOT NULL,
        country VARCHAR(100),
        work_type VARCHAR(100),
        website_type VARCHAR(100),
        price_amount DECIMAL(12, 2) NOT NULL,
        currency VARCHAR(10) DEFAULT 'NGN',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(service_type, country, work_type, website_type)
      )
    `);
    console.log('✅ service_prices table created');

    // Price requests table
    await client.query(`
      CREATE TABLE IF NOT EXISTS price_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
        client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        service_type VARCHAR(50) NOT NULL,
        details JSONB DEFAULT '{}',
        requested_price DECIMAL(12, 2),
        admin_price DECIMAL(12, 2),
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'quoted', 'accepted', 'rejected')),
        admin_notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ price_requests table created');

    // Website types table
    await client.query(`
      CREATE TABLE IF NOT EXISTS website_types (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        description TEXT,
        base_price DECIMAL(12, 2) NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ website_types table created');

    // Create indexes for better performance
    await client.query(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_users_referral ON users(referral_code)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_applications_client ON applications(client_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_invoices_client ON invoices(client_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_service_prices_type ON service_prices(service_type)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_price_requests_application ON price_requests(application_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_price_requests_client ON price_requests(client_id)`);
    console.log('✅ indexes created');

    await client.query('COMMIT');
    console.log('\n🎉 All migrations completed successfully!');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
};

const dropTables = async () => {
  const client = await pool.connect();

  try {
    console.log('🔄 Dropping tables...\n');

    await client.query('BEGIN');

    await client.query('DROP TABLE IF EXISTS activity_logs CASCADE');
    await client.query('DROP TABLE IF EXISTS documents CASCADE');
    await client.query('DROP TABLE IF EXISTS notifications CASCADE');
    await client.query('DROP TABLE IF EXISTS invoices CASCADE');
    await client.query('DROP TABLE IF EXISTS applications CASCADE');
    await client.query('DROP TABLE IF EXISTS users CASCADE');

    await client.query('COMMIT');
    console.log('🗑️ All tables dropped');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Failed to drop tables:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Run migrations if called directly
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.includes('--drop')) {
    dropTables()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  } else {
    createTables()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  }
}

module.exports = { createTables, dropTables };