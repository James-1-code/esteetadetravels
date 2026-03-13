require('dotenv').config({ path: './.env' });
const { pool } = require('./src/config/database');

console.log('DB Config:', {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  database: process.env.DB_NAME
});

pool.query('SELECT NOW()')
  .then(r => { 
    console.log('✅ DB Connected:', r.rows[0].now); 
    process.exit(0); 
  })
  .catch(e => { 
    console.log('❌ DB Error:', e.message); 
    process.exit(1); 
  });

