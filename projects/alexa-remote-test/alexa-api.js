const fs = require('fs');
const https = require('https');
const crypto = require('crypto');

const tokens = JSON.parse(fs.readFileSync('.alexa-tokens.json', 'utf8'));

// Sign request with device credentials (like alexa-remote2 does)
function signRequest(method, path, body, accessToken) {
  const date = new Date().toISOString();
  
  return {
    'x-amzn-requestid': crypto.randomUUID(),
    'Accept-Language': 'en-US',
    'User-Agent': 'AppleWebKit PitanguiBridge/2.2.556530.0-[HARDWARE=iPhone14_5][SOFTWARE=16.6][DEVICE=iPhone]',
    'Accept': 'application/json',
    'Authorization': `Bearer ${accessToken}`
  };
}

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
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
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

async function alexaRequest(path, accessToken) {
  return new Promise((resolve, reject) => {
    const headers = signRequest('GET', path, null, accessToken);
    
    const req = https.request({
      hostname: 'alexa.amazon.com',
      path: path,
      method: 'GET',
      headers: headers
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`${path} -> ${res.statusCode}`);
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data.substring(0, 500) });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function main() {
  console.log('🔑 Getting access token...');
  const tokenResp = await getAccessToken();
  if (tokenResp.error) {
    console.error('❌', tokenResp);
    return;
  }
  const accessToken = tokenResp.access_token;
  console.log('✅ Got access token\n');

  // Try different endpoints
  const endpoints = [
    '/api/namedLists',
    '/api/namedLists?type=SHOPPING_LIST',
    '/api/todos?type=SHOPPING_ITEM&size=100',
    '/api/lists/v1/lists',
    '/api/household-lists'
  ];

  for (const ep of endpoints) {
    const result = await alexaRequest(ep, accessToken);
    console.log(JSON.stringify(result, null, 2));
    console.log('---');
  }
}

main().catch(console.error);
