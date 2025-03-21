// Simple test script to check if the API is working
const http = require('http');

// Testing the test controller
testPath(5206, '/test', 'GET');
testPath(5206, '/test', 'POST');

// Testing the posts controller
testPath(5206, '/api/posts', 'POST');

function testPath(port, path, method) {
  console.log(`\nTesting ${method} to ${port}${path}...`);
  
  const data = JSON.stringify({
    content: 'Test content',
    viewLimit: 5
  });

  const options = {
    hostname: '127.0.0.1',
    port: port,
    path: path,
    method: method,
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Headers: ${JSON.stringify(res.headers)}`);
    
    let responseBody = '';
    res.on('data', (chunk) => {
      responseBody += chunk;
    });
    
    res.on('end', () => {
      console.log(`Response Body: ${responseBody.substring(0, 150)}${responseBody.length > 150 ? '...' : ''}`);
      try {
        const jsonResponse = JSON.parse(responseBody);
        console.log('Parsed JSON:', jsonResponse);
      } catch (e) {
        // Not JSON, that's fine
      }
    });
  });

  req.on('error', (error) => {
    console.error(`Error: ${error.message}`);
  });

  if (method === 'POST') {
    req.write(data);
  }
  req.end();
} 