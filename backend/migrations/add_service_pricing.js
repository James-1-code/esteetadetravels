const { pool } = require('../src/config/database');

async function migrate() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('🔄 Creating service_prices table...');
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
    
    console.log('🔄 Creating price_requests table...');
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
    
    console.log('🔄 Creating website_types table...');
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
    
    // Insert default website types
    console.log('🔄 Inserting default website types...');
    const websiteTypes = [
      { name: 'Portfolio Website', description: 'Personal portfolio to showcase work and skills', base_price: 150000 },
      { name: 'E-commerce Store', description: 'Online store with product listings and cart', base_price: 350000 },
      { name: 'Business Website', description: 'Corporate website for business presence', base_price: 250000 },
      { name: 'Blog Website', description: 'Content management blog platform', base_price: 200000 },
      { name: 'Landing Page', description: 'Single page website for marketing', base_price: 100000 },
      { name: 'Educational Platform', description: 'E-learning platform with courses', base_price: 500000 },
      { name: 'Job Portal', description: 'Job listing and application platform', base_price: 450000 },
      { name: 'Custom Web Application', description: 'Custom full-stack web application', base_price: 1000000 },
    ];
    
    for (const type of websiteTypes) {
      await client.query(
        `INSERT INTO website_types (name, description, base_price) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
        [type.name, type.description, type.base_price]
      );
    }
    console.log('✅ Default website types inserted');
    
    // Insert default service prices
    console.log('🔄 Inserting default service prices...');
    const defaultPrices = [
      // CV / Resume Maker
      { service_type: 'cv', price_amount: 10000, currency: 'NGN' },
      // Study Abroad
      { service_type: 'study', price_amount: 500000, currency: 'NGN' },
      // Work Visa (base price - will vary by country)
      { service_type: 'work', price_amount: 500000, currency: 'NGN' },
      // Caregiver Certification
      { service_type: 'caregiver', price_amount: 250000, currency: 'NGN' },
      // Job Assessment Fee
      { service_type: 'job_assessment', price_amount: 100000, currency: 'NGN' },
      // Lawyer Agreement Fee
      { service_type: 'lawyer', price_amount: 50000, currency: 'NGN' },
      // Web Development
      { service_type: 'web_development', price_amount: 100000, currency: 'NGN' },
      // Visa Processing Fee
      { service_type: 'visa_processing', price_amount: 500000, currency: 'NGN' },
      // Biometric Appointment Fee
      { service_type: 'biometric', price_amount: 350000, currency: 'NGN' },
    ];
    
    for (const price of defaultPrices) {
      await client.query(
        `INSERT INTO service_prices (service_type, price_amount, currency) VALUES ($1, $2, $3) ON CONFLICT (service_type, country, work_type, website_type) DO UPDATE SET price_amount = $2, updated_at = CURRENT_TIMESTAMP`,
        [price.service_type, price.price_amount, price.currency]
      );
    }
    console.log('✅ Default service prices inserted');
    
    // Create indexes
    await client.query(`CREATE INDEX IF NOT EXISTS idx_service_prices_type ON service_prices(service_type)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_price_requests_application ON price_requests(application_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_price_requests_client ON price_requests(client_id)`);
    console.log('✅ Indexes created');
    
    await client.query('COMMIT');
    console.log('✅ Migration completed successfully!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

migrate()
  .then(() => {
    console.log('Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration script failed:', error);
    process.exit(1);
  });

