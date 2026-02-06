const axios = require('axios');

async function testProdApi() {
    const url = 'https://quadra-production.railway.app/api/auth/register';
    console.log(`Testing POST to ${url}...`);
    try {
        const response = await axios.post(url, {});
        console.log('Success!', response.status, response.data);
    } catch (error) {
        if (error.response) {
            console.log('Error Response:', error.response.status);
            console.log('Error Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.log('Error Message:', error.message);
        }
    }
}

testProdApi();
