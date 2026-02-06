const net = require('net');
require('dotenv').config();

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
}

// Parse the URL manually to avoid pg parsing issues for this test
// postgres://user:pass@host:port/db
const match = dbUrl.match(/postgre(?:s|sql):\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);

if (!match) {
    console.error('Could not parse DATABASE_URL');
    console.log('URL provided:', dbUrl.replace(/:([^:@]+)@/, ':****@'));
    process.exit(1);
}

const host = match[3];
const port = parseInt(match[4], 10);

console.log(`Attempting to connect to ${host}:${port}...`);

const socket = new net.Socket();
socket.setTimeout(5000);

socket.on('connect', () => {
    console.log('Successfully connected to TCP port!');
    socket.destroy();
});

socket.on('timeout', () => {
    console.error('Connection timed out');
    socket.destroy();
});

socket.on('error', (err) => {
    console.error('Connection error:', err);
});

socket.connect(port, host);
