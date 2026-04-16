const http = require('http');

const data = JSON.stringify({
    name: 'Test User',
    email: 'sahilfact549@gmail.com',
    phone: '9876543210',
    password: 'test123'
});

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/register',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': data.length }
};

const req = http.request(options, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => console.log('Response:', body));
});

req.on('error', (e) => console.error('Error:', e.message));
req.write(data);
req.end();
