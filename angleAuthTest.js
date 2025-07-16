const express = require('express');
const https = require('https');
const querystring = require('querystring');
const app = express();
const port = 3000;

// Replace with your credentials
const CLIENT_ID = 'Yl3n7guB';
const CLIENT_SECRET = 'bb683914-f771-4073-9a33-d53103692446';
const REDIRECT_URI = 'https://test-angle-one.onrender.com/callback';

// Step 1: Redirect to Angel One login page
app.get('/login', (req, res) => {
  const authUrl = `https://smartapi.angelbroking.com/publisher-login?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code`;
  res.redirect(authUrl);
});

// Step 2: Handle redirect with code
app.get('/callback', (req, res) => {
  const authCode = req.query.code;
  if (!authCode) {
    return res.send('Error: No code received.');
  }

  // Step 3: Exchange code for access token
  const postData = JSON.stringify({
    client_code: CLIENT_ID,
    grant_type: 'authorization_code',
    code: authCode,
    client_secret: CLIENT_SECRET,
    redirect_uri: REDIRECT_URI
  });

  const options = {
    hostname: 'apiconnect.angelbroking.com',
    path: '/rest/auth/angelbroking/user/v1/token',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
      'Accept': 'application/json'
    }
  };

  const request = https.request(options, (response) => {
    let data = '';
    response.on('data', (chunk) => { data += chunk; });
    response.on('end', () => {
      try {
        const parsed = JSON.parse(data);
        res.json(parsed);
      } catch (err) {
        res.status(500).send('Invalid response from Angel One:\n' + data);
      }
    });
  });

  request.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
    res.status(500).send('Request failed');
  });

  request.write(postData);
  request.end();
});

app.listen(port, () => {
  console.log(`✅ Angel One OAuth test running at http://localhost:${port}`);
  console.log(`▶️ Visit: http://localhost:${port}/login`);
});
