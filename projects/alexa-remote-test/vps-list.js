const https = require('https');
const crypto = require('crypto');
const fs = require('fs');

const tokens = JSON.parse(fs.readFileSync('.alexa-tokens.json', 'utf8'));

// Get access token from refresh token
async function getAccessToken() {
  const params = new URLSearchParams({
    app_name: 'Amazon Alexa',
    app_version: '2.2.556530.0',
    source_token: tokens.refreshToken,
    source_token_type: 'refresh_token',
    requested_token_type: 'access_token'
  });

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.amazon.com',
      path: '/auth/token',
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    req.write(params.toString());
    req.end();
  });
}

// Try the internal Alexa web API endpoints that alexa-remote2 uses
async function tryEndpoint(host, path, accessToken, cookies = '') {
  return new Promise((resolve) => {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
      'Accept': 'application/json',
      'Accept-Language': 'en-US',
      'x-amzn-requestid': crypto.randomUUID(),
    };
    
    if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
    if (cookies) headers['Cookie'] = cookies;
    
    const req = https.request({ hostname: host, path, method: 'GET', headers }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let parsed;
        try { parsed = JSON.parse(data); } catch { parsed = { raw: data.substring(0, 300) }; }
        resolve({ status: res.statusCode, data: parsed });
      });
    });
    req.on('error', e => resolve({ error: e.message }));
    req.end();
  });
}

async function main() {
  console.log('🔑 Getting access token...');
  const tokenResp = await getAccessToken();
  if (!tokenResp.access_token) {
    console.error('Failed to get token:', tokenResp);
    return;
  }
  const accessToken = tokenResp.access_token;
  console.log('✅ Got access token\n');

  // Endpoints to try - these are what alexa-remote2 uses for lists
  const endpoints = [
    // New V2 list endpoints (alexa-remote2 8.x)
    ['alexa.amazon.com', '/api/namedLists'],
    ['alexa.amazon.com', '/api/namedLists?type=SHOPPING_LIST'],
    ['alexa.amazon.com', '/api/namedLists?type=TO_DO'],
    
    // Legacy endpoints
    ['alexa.amazon.com', '/api/todos?type=SHOPPING_ITEM&size=100'],
    ['alexa.amazon.com', '/api/todos?size=100'],
    
    // Mobile quantum page (what scrapers use)
    ['www.amazon.com', '/alexaquantum/sp/alexaShoppingList'],
    
    // pitangui (US endpoint)
    ['pitangui.amazon.com', '/api/namedLists'],
    ['pitangui.amazon.com', '/api/todos?type=SHOPPING_ITEM&size=100'],
  ];

  for (const [host, path] of endpoints) {
    console.log(`\n📍 ${host}${path}`);
    const result = await tryEndpoint(host, path, accessToken);
    console.log(`   Status: ${result.status || result.error}`);
    if (result.data) {
      const preview = JSON.stringify(result.data).substring(0, 200);
      console.log(`   Data: ${preview}...`);
    }
  }
}

main().catch(console.error);
