const { pool } = require('./src/config/database');

async function createTestRequest() {
  const client = await pool.connect();
  
  try {
    // Get a client user ID
    const userResult = await client.query("SELECT id FROM users WHERE role = 'client' LIMIT 1");
    if (userResult.rows.length === 0) {
      console.log('No client user found');
      return;
    }
    const clientId = userResult.rows[0].id;
    
    // Get a flight application ID
    const appResult = await client.query("SELECT id FROM applications WHERE application_type = 'flight' LIMIT 1");
    let applicationId = null;
    if (appResult.rows.length > 0) {
      applicationId = appResult.rows[0].id;
    }
    
    // Insert a test price request
    const result = await client.query(
      `INSERT INTO price_requests (application_id, client_id, service_type, details, status)
       VALUES ($1, $2, $3, $4, 'pending')
       RETURNING *`,
      [applicationId, clientId, 'flight', JSON.stringify({ 
        departureCountry: 'Nigeria', 
        destinationCountry: 'UK',
        departureDate: '2026-04-01',
        returnDate: '2026-04-15'
      })]
    );
    
    console.log('Created test price request:');
    console.log(JSON.stringify(result.rows[0], null, 2));
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    client.release();
    process.exit(0);
  }
}

createTestRequest();

