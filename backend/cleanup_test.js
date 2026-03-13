const { pool } = require('./src/config/database');

async function cleanup() {
  const client = await pool.connect();
  
  try {
    // Delete test price requests (where client_id is not from actual users that made requests)
    await client.query("DELETE FROM price_requests");
    console.log('Deleted all price requests');
    
    // Now let's check what flight/hotel applications exist without price requests
    const appsResult = await client.query(`
      SELECT a.id, a.application_type, a.type_label, a.created_at, u.email as client_email
      FROM applications a 
      JOIN users u ON a.client_id = u.id 
      WHERE a.application_type IN ('flight', 'hotel')
      AND a.amount = 0
      ORDER BY a.created_at DESC
    `);
    
    console.log('\nFlight/Hotel applications with amount=0:');
    console.log(JSON.stringify(appsResult.rows, null, 2));
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    client.release();
    process.exit(0);
  }
}

cleanup();

