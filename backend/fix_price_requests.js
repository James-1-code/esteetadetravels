const { pool } = require('./src/config/database');

async function fixPriceRequests() {
  const client = await pool.connect();
  
  try {
    // Get all flight/hotel applications with amount=0 (pending price requests)
    const appsResult = await client.query(`
      SELECT a.id, a.application_type, a.type_label, a.form_data, a.client_id, a.created_at
      FROM applications a 
      WHERE a.application_type IN ('flight', 'hotel')
      AND a.amount = 0
      ORDER BY a.created_at DESC
    `);
    
    console.log(`Found ${appsResult.rows.length} flight/hotel applications without price requests`);
    
    for (const app of appsResult.rows) {
      // Check if price request already exists
      const existingPR = await client.query(
        'SELECT id FROM price_requests WHERE application_id = $1',
        [app.id]
      );
      
      if (existingPR.rows.length > 0) {
        console.log(`Price request already exists for application ${app.id}, skipping`);
        continue;
      }
      
      // Extract details from form_data
      const details = app.form_data || {};
      let requestDetails = {};
      
      if (app.application_type === 'flight') {
        requestDetails = {
          departureCountry: details.departureCountry || '',
          destinationCountry: details.destinationCountry || '',
          departureDate: details.departureDate || '',
          returnDate: details.returnDate || ''
        };
      } else if (app.application_type === 'hotel') {
        requestDetails = {
          city: details.city || '',
          checkIn: details.checkIn || '',
          checkOut: details.checkOut || ''
        };
      }
      
      // Create price request
      await client.query(
        `INSERT INTO price_requests (application_id, client_id, service_type, details, status)
         VALUES ($1, $2, $3, $4, 'pending')`,
        [app.id, app.client_id, app.application_type, JSON.stringify(requestDetails)]
      );
      
      console.log(`Created price request for application ${app.id} (${app.application_type})`);
    }
    
    // Verify
    const countResult = await client.query('SELECT COUNT(*) FROM price_requests');
    console.log(`\nTotal price requests in database: ${countResult.rows[0].count}`);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    client.release();
    process.exit(0);
  }
}

fixPriceRequests();

