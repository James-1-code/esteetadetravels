const https = require('https');
const dataStr = JSON.stringify({email: 'admin@esteetade.com', password: 'admin123'});
const options = {
  hostname: 'default-cyan.vercel.app',
  port: 443,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': dataStr.length
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('=== LIVE LOGIN DEBUG ===');
    console.log('Status:', res.statusCode);
    console.log('Full Response:', JSON.stringify(JSON.parse(data), null, 2));
  });
});
req.on('error', e => console.error('Request Error:', e.message));
req.write(dataStr);
req.end();
