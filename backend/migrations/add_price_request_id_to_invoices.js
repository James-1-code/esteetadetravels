const { query } = require('../src/config/database');

/**
 * Add price_request_id column to invoices table for linking price quotes to payments
 */

async function up() {
  await query(`
    ALTER TABLE invoices 
    ADD COLUMN IF NOT EXISTS price_request_id UUID REFERENCES price_requests(id) ON DELETE SET NULL;
  `);
  
  console.log('✅ Added price_request_id to invoices table');
}

async function down() {
  await query(`
    ALTER TABLE invoices 
    DROP COLUMN IF EXISTS price_request_id;
  `);
  
  console.log('🔄 Rolled back price_request_id column');
}

module.exports = { up, down };

