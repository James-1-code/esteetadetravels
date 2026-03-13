const { pool } = require('./src/config/database');

async function checkApplications() {
  const client = await pool.connect();
  
  try {
    // Check all recent applications
    const allAppsResult = await client.query(`
      SELECT a.id, a.application_type, a.type_label, a.amount, a.status, a.created_at, u.email as client_email
      FROM applications a 
      JOIN users u ON a.client_id = u.id 
      ORDER BY a.created_at DESC
      LIMIT 10
    `);
    console.log('Recent applications:', allAppsResult.rows.length);
    console.log(JSON.stringify(allAppsResult.rows, null, 2));
    
    // Check applications for flight/hotel type
    const flightHotelApps = await client.query(`
      SELECT a.*, u.email as client_email 
      FROM applications a 
      JOIN users u ON a.client_id = u.id 
      WHERE a.application_type IN ('flight', 'hotel')
      ORDER BY a.created_at DESC
      LIMIT 10
    `);
    console.log('\nFlight/Hotel applications:', flightHotelApps.rows.length);
    if (flightHotelApps.rows.length > 0) {
      console.log(JSON.stringify(flightHotelApps.rows, null, 2));
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    client.release();
    process.exit(0);
  }
}

checkApplications();

