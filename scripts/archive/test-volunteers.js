const http = require('http');
const req = http.request({
  hostname: 'www.iocaworld.org',
  port: 443,
  path: '/api/volunteers',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
}, (res) => {
  console.log('STATUS: ' + res.statusCode);
  res.on('data', d => process.stdout.write(d));
});
req.on('error', console.error);
req.write(JSON.stringify({
  full_name: 'Test Name',
  email: 'test@test.com',
  phone: '12345',
  city: 'Test City',
  availability: 'Anytime',
  skills: 'None',
  motivation: 'Test'
}));
req.end();
