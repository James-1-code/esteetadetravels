require('dotenv').config({ path: './.env' });
const https = require('https');
const { pool } = require('./src/config/database');

const options = {
  hostname: 'default-cyan.vercel.app',
  port: 443,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(JSON.stringify({email: 'admin@esteetade.com', password: 'admin123'}))
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Live Vercel Response:', JSON.parse(data));
  });
});

req.on('error', error => console.error('Error:', error));
req.write(JSON.stringify({email: 'admin@esteetade.com', password: 'admin123'}));
req.end();

// Local test
pool.query("SELECT email FROM users WHERE email = 'admin@esteetade.com'", (err, result) => {
  if (err) {
    console.log('Local DB Error:', err.message);
  } else {
    console.log('Local DB admin exists:', result.rows.length > 0);
  }
  process.exit(0);
});
