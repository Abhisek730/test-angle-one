const express = require('express');
const https = require('https');
const fs = require('fs');
const app = express();
const port = 3000;

// Replace with your credentials
const CLIENT_ID = 'Yl3n7guB';
const CLIENT_SECRET = 'bb683914-f771-4073-9a33-d53103692446';
const REDIRECT_URI = 'https://test-angle-one.onrender.com/callback';

// Simple in-memory token store (replace with file or DB for persistence)
let tokenStore = {
  jwtToken: '',
  feedToken: '',
  refreshToken: ''
};

// Redirect to Angel One login
app.get('/login', (req, res) => {
  const authUrl = `https://smartapi.angelbroking.com/publisher-login?api_key=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code`;
  res.redirect(authUrl);
});

// Callback URL after login
app.get('/callback', (req, res) => {
  const { auth_token, feed_token, refresh_token } = req.query;

  if (!auth_token) {
    return res.send('Error: No auth_token received.');
  }

  // Save tokens
  tokenStore.jwtToken = auth_token;
  tokenStore.feedToken = feed_token;
  tokenStore.refreshToken = refresh_token;

  res.send(`
    ✅ Login Successful! Tokens saved.<br><br>
    👉 <a href="/profile">Test Profile API</a>
  `);
});

// Test Angel One API using jwtToken
app.get('/profile', (req, res) => {
  if (!tokenStore.jwtToken) {
    return res.send('❌ No token found. Please <a href="/login">login</a> first.');
  }

  const options = {
    hostname: 'apiconnect.angelbroking.com',
    path: '/rest/secure/angelbroking/user/v1/getProfile',
    method: 'GET',
    headers: {
      Authorization: `Bearer ${tokenStore.jwtToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-ClientLocalIP': '127.0.0.1',
      'X-ClientPublicIP': '127.0.0.1',
      'X-MACAddress': '00:11:22:33:44:55',
      'X-PrivateKey': CLIENT_SECRET,
      'X-UserType': 'USER',
      'X-SourceID': 'WEB'
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
        res.status(500).send('❌ Error parsing response:\n' + data);
      }
    });
  });

  request.on('error', (e) => {
    console.error(`❌ Request error: ${e.message}`);
    res.status(500).send('❌ API request failed.');
  });

  request.end();
});

app.listen(port, () => {
  console.log(`✅ Angel One test server running at http://localhost:${port}`);
  console.log(`▶️ Visit: http://localhost:${port}/login`);
});
