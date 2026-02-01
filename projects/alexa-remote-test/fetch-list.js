const https = require('https');
const fs = require('fs');

const tokens = JSON.parse(fs.readFileSync('.alexa-tokens.json', 'utf8'));

// Get cookies from refresh token
async function getCookies() {
  const body = new URLSearchParams({
    app_name: 'Amazon Alexa',
    app_version: '2.2.556530.0',
    source_token: tokens.refreshToken,
    source_token_type: 'refresh_token',
    requested_token_type: 'auth_cookies',
    domain: '.amazon.com'
  }).toString();

  return new Promise((resolve) => {
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
    req.on('error', e => resolve({ error: e.message }));
    req.write(body);
    req.end();
  });
}

// Build cookie string from response
function buildCookieString(cookieData) {
  const cookies = cookieData.response.tokens.cookies['.amazon.com'];
  return cookies.map(c => `${c.Name}=${c.Value}`).join('; ');
}

// Make authenticated request to Alexa
async function alexaRequest(path, cookies) {
  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'alexa.amazon.com',
      path: path,
      method: 'GET',
      headers: {
        'Cookie': cookies,
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15',
        'Accept': 'application/json',
        'Accept-Language': 'en-US',
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let parsed;
        try { parsed = JSON.parse(data); } catch { parsed = { raw: data.substring(0, 500) }; }
        resolve({ status: res.statusCode, data: parsed, headers: res.headers });
      });
    });
    req.on('error', e => resolve({ error: e.message }));
    req.end();
  });
}

async function main() {
  console.log('🔑 Getting cookies from refresh token...');
  const cookieData = await getCookies();
  
  if (!cookieData.response?.tokens?.cookies) {
    console.error('Failed to get cookies:', cookieData);
    return;
  }
  
  const cookieString = buildCookieString(cookieData);
  console.log('✅ Got cookies!\n');
  
  // Try different endpoints
  const endpoints = [
    '/api/namedLists',
    '/api/namedLists?type=SHOPPING_LIST',
    '/api/todos?type=SHOPPING_ITEM&size=100',
    '/api/todos?type=TASK&size=100',
    '/api/lists/v1/lists',
    '/spa/index.html',  // SPA entry
  ];
  
  for (const path of endpoints) {
    console.log(`\n📍 ${path}`);
    const result = await alexaRequest(path, cookieString);
    console.log(`   Status: ${result.status}`);
    if (result.data) {
      const preview = JSON.stringify(result.data).substring(0, 300);
      console.log(`   Data: ${preview}`);
    }
  }
}

main().catch(console.error);
