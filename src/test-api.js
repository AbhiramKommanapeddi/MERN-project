// Simple API test
const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
console.log('API URL:', apiUrl);

fetch(`${apiUrl}/auth/login`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    username: 'demo',
    password: 'demo123'
  })
})
.then(response => response.json())
.then(data => console.log('API Response:', data))
.catch(error => console.error('API Error:', error));
