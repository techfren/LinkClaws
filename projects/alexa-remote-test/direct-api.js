const fs = require('fs');
const https = require('https');

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
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': params.toString().length
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Parse error: ${data}`));
        }
      });
    });
    req.on('error', reject);
    req.write(params.toString());
    req.end();
  });
}

// Get lists from Alexa
async function getLists(accessToken) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.amazonalexa.com',
      path: '/v2/householdlists/',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('Lists response status:', res.statusCode);
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve({ raw: data, status: res.statusCode });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function getListItems(accessToken, listId) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.amazonalexa.com',
      path: `/v2/householdlists/${listId}/active`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve({ raw: data, status: res.statusCode });
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
    console.error('❌ Token error:', tokenResp);
    return;
  }
  
  console.log('✅ Got access token!');
  const accessToken = tokenResp.access_token;
  
  console.log('\n📋 Fetching lists...');
  const lists = await getLists(accessToken);
  console.log('Lists:', JSON.stringify(lists, null, 2));
  
  // Try to get items from each list
  if (lists.lists) {
    for (const list of lists.lists) {
      console.log(`\n🛒 Fetching items from "${list.name || list.listId}"...`);
      const items = await getListItems(accessToken, list.listId);
      console.log('Items:', JSON.stringify(items, null, 2));
    }
  }
}

main().catch(console.error);
