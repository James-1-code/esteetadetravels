const https = require('https');
function testLogin() {
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
      console.log('Status:', res.statusCode);
      console.log('Response:', data);
      console.log('Neon user:', {email: 'admin@esteetade.com', role: 'admin', verified: true, approved: true});
    });
  });
  
  req.on('error', error => console.error('Error:', error.message));
  req.write(dataStr);
  req.end();
}
testLogin();
