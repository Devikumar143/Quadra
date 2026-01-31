// Native fetch is available in Node 18+

async function checkHealth() {
    try {
        console.log('Checking Health...');
        const res = await fetch('http://localhost:5001/health');
        console.log('Health Status:', res.status);
        const text = await res.text();
        console.log('Health Body:', text);
    } catch (err) {
        console.error('Health Check Failed:', err.message);
    }
}

async function checkLogin() {
    try {
        console.log('\nChecking Login Endpoint...');
        const res = await fetch('http://localhost:5001/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'test@test.com', password: 'wrong' })
        });
        console.log('Login Status:', res.status);
        const text = await res.text();
        console.log('Login Body:', text);
    } catch (err) {
        console.error('Login Check Failed:', err.message);
    }
}

(async () => {
    await checkHealth();
    await checkLogin();
})();
