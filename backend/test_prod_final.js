const https = require('https');

const data = JSON.stringify({
    full_name: "Test Bot 4",
    university_id: "BOT004",
    ff_uid: "44556677",
    ff_ign: "AntigravityBot4",
    email: `bot_${Math.floor(Math.random() * 10000)}@test.com`,
    password: "password123"
});

const options = {
    hostname: 'quadra-production.up.railway.app',
    port: 443,
    path: '/api/auth/register',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    },
    // Adding this since I'm having DNS issues in the environment
    // But I can't easily pass the IP to https.request and Keep the hostname for TLS
    // So I'll hope the environment's node can resolve it or I'll use a trick.
};

const req = https.request(options, (res) => {
    console.log(`Status Code: ${res.statusCode}`);
    let body = '';
    res.on('data', (d) => { body += d; });
    res.on('end', () => {
        console.log('Body:', body);
    });
});

req.on('error', (e) => {
    console.error('Error:', e.message);
});

req.write(data);
req.end();
