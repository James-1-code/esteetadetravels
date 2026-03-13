const { pool } = require('./src/config/database');

async function testDB() {
  const client = await pool.connect();
  try {
    // Test inserting a document with null application_id
    const result = await client.query(
      `INSERT INTO documents (application_id, user_id, filename, original_name, mime_type, size, path) 
       VALUES (NULL, '00000000-0000-0000-0000-000000000001', 'test.txt', 'test.txt', 'text/plain', 100, 'test/path') 
       RETURNING id`
    );
    console.log('Document inserted successfully:', result.rows[0]);
    
    // Clean up
    await client.query('DELETE FROM documents WHERE id = $1', [result.rows[0].id]);
    console.log('Test document deleted');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

testDB();

