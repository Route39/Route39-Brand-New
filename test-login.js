const http = require('http');

const data = JSON.stringify({
  query: `query { login2(userName: "admin", password: "admin", platform: Web, deviceType: DESKTOP) { accessToken } }`
});

const options = {
  hostname: '127.0.0.1',
  port: 3004,
  path: '/graphql',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apollo-require-preflight': 'true',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  let body = '';
  res.on('data', (chunk) => { body += chunk; });
  res.on('end', () => {
    console.log(`BODY: ${body}`);
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.write(data);
req.end();
