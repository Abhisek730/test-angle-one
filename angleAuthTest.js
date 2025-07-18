const express = require('express');
const https = require('https');
const app = express();
const port = 3000;

// Replace with your credentials
const CLIENT_ID = 'Yl3n7guB'; // API Key
const CLIENT_SECRET = 'bb683914-f771-4073-9a33-d53103692446'; // Secret Key
const REDIRECT_URI = 'https://test-angle-one.onrender.com/callback';

// In-memory token storage
let tokenStore = {
  jwtToken: '',
  feedToken: '',
  refreshToken: ''
};

// Step 1: Redirect to Angel One login page
app.get('/login', (req, res) => {
  const authUrl = `https://smartapi.angelbroking.com/publisher-login?api_key=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code`;
  res.redirect(authUrl);
});

// Step 2: Callback to capture auth + feed + refresh tokens
app.get('/callback', (req, res) => {
  const { auth_token, feed_token, refresh_token } = req.query;

  if (!auth_token) {
    return res.send('❌ Error: No auth_token received.');
  }

  tokenStore.jwtToken = auth_token;
  tokenStore.feedToken = feed_token;
  tokenStore.refreshToken = refresh_token;

  res.send(`
    ✅ Login Successful! Tokens saved.<br><br>
    👉 <a href="/profile">Test Profile API</a><br>
    🔁 <a href="/refresh">Refresh Token</a>
  `);
});

// Step 3: Test Angel One /getProfile API
app.get('/profile', (req, res) => {
  if (!tokenStore.jwtToken) {
    return res.send('❌ No token found. Please <a href="/login">login</a> first.');
  }

  const options = {
    hostname: 'apiconnect.angelone.in',

    path: '/rest/secure/angelbroking/user/v1/getProfile',
    method: 'GET',
    headers: {
      Authorization: `Bearer ${tokenStore.jwtToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-UserType': 'USER',
      'X-SourceID': 'WEB',
      'X-ClientLocalIP': '127.0.0.1',
      'X-ClientPublicIP': '127.0.0.1',
      'X-MACAddress': '00:11:22:33:44:55',
      'X-PrivateKey': CLIENT_SECRET
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

// Step 4: Optional Refresh Token Route
app.get('/refresh', (req, res) => {
  if (!tokenStore.jwtToken || !tokenStore.refreshToken) {
    return res.send('❌ Tokens missing. Please <a href="/login">login</a> first.');
  }

  const data = JSON.stringify({
    refreshToken: tokenStore.refreshToken
  });

  const options = {
    hostname: 'apiconnect.angelone.in',
    path: '/rest/auth/angelbroking/jwt/v1/generateTokens',
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tokenStore.jwtToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-UserType': 'USER',
      'X-SourceID': 'WEB',
      'X-ClientLocalIP': '127.0.0.1',
      'X-ClientPublicIP': '127.0.0.1',
      'X-MACAddress': '00:11:22:33:44:55',
      'X-PrivateKey': CLIENT_ID
    }
  };

  const request = https.request(options, (response) => {
    let result = '';
    response.on('data', (chunk) => result += chunk);
    response.on('end', () => {
      try {
        const json = JSON.parse(result);
        tokenStore.jwtToken = json.jwtToken;
        tokenStore.feedToken = json.feedToken;
        res.json({ message: '✅ Token refreshed!', token: json.jwtToken });
      } catch (err) {
        res.status(500).send('❌ Failed to parse refresh response:\n' + result);
      }
    });
  });

  request.on('error', (e) => {
    console.error(`❌ Refresh error: ${e.message}`);
    res.status(500).send('❌ Refresh request failed.');
  });

  request.write(data);
  request.end();
});

// Start server
app.listen(port, () => {
  console.log(`✅ Angel One test server running at http://localhost:${port}`);
  console.log(`▶️ Visit: http://localhost:${port}/login`);
});
