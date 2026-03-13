const { pool } = require('./src/config/database');

async function checkPriceRequests() {
  const client = await pool.connect();
  
  try {
    // Check if tables exist
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      AND table_name IN ('price_requests', 'service_prices', 'website_types')
    `);
    console.log('Tables found:', tablesResult.rows.map(r => r.table_name));
    
    // Check price_requests data
    const priceRequestsResult = await client.query('SELECT * FROM price_requests');
    console.log('\nPrice requests in database:', priceRequestsResult.rows.length);
    if (priceRequestsResult.rows.length > 0) {
      console.log(JSON.stringify(priceRequestsResult.rows, null, 2));
    }
    
    // Check service_prices data
    const servicePricesResult = await client.query('SELECT * FROM service_prices');
    console.log('\nService prices in database:', servicePricesResult.rows.length);
    
    // Check users to see if there are any
    const usersResult = await client.query('SELECT id, email, role FROM users LIMIT 5');
    console.log('\nUsers in database:', usersResult.rows.length);
    console.log(usersResult.rows);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    client.release();
    process.exit(0);
  }
}

checkPriceRequests();

