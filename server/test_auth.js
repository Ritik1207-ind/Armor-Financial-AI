const axios = require('axios');

async function testAuth() {
  try {
    console.log('Testing UNAUTHORIZED access to /api/dashboard...');
    await axios.get('http://localhost:5000/api/dashboard');
    console.error('FAIL: Access to /api/dashboard should have returned 401');
  } catch (err) {
    if (err.response && err.response.status === 401) {
      console.log('SUCCESS: Access to /api/dashboard blocked with 401 Unauthorized');
    } else {
      console.error('FAIL: Unexpected error during auth test', err.message);
    }
  }

  try {
    console.log('Testing register logic...');
    const registerResp = await axios.post('http://localhost:5000/api/auth/register', {
        name: 'Test User',
        email: `test_${Date.now()}@example.com`,
        password: 'password123'
    });
    console.log('SUCCESS: Registered successfully. Received token:', !!registerResp.data.token);
  } catch (err) {
    console.error('FAIL: Registration failed', err.response?.data || err.message);
  }
}

testAuth();
