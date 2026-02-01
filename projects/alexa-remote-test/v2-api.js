const https = require('https');
const fs = require('fs');

const tokens = JSON.parse(fs.readFileSync('.alexa-tokens.json', 'utf8'));

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
    req.write(body);
    req.end();
  });
}

function buildCookieString(cookieData) {
  const cookies = cookieData.response.tokens.cookies['.amazon.com'];
  return cookies.map(c => `${c.Name}=${c.Value}`).join('; ');
}

async function v2Request(path, method, body, cookies) {
  const bodyStr = body ? JSON.stringify(body) : '';
  
  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'www.amazon.com',
      path: path,
      method: method,
      headers: {
        'Cookie': cookies,
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15',
        'Accept': 'application/json',
        'Accept-Language': 'en-US',
        'Content-Type': 'application/json',
        'Content-Length': bodyStr.length,
        'Origin': 'https://www.amazon.com',
        'Referer': 'https://www.amazon.com/alexaquantum/sp/alexaShoppingList',
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let parsed;
        try { parsed = JSON.parse(data); } catch { parsed = { raw: data.substring(0, 800) }; }
        resolve({ status: res.statusCode, data: parsed, headers: res.headers });
      });
    });
    req.on('error', e => resolve({ error: e.message }));
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

async function main() {
  console.log('🔑 Getting cookies...');
  const cookieData = await getCookies();
  if (!cookieData.response?.tokens?.cookies) {
    console.error('Failed to get cookies');
    return;
  }
  const cookies = buildCookieString(cookieData);
  console.log('✅ Got cookies\n');

  // V2 Lists endpoint (from alexa-remote2)
  console.log('📋 Fetching lists via V2 API...');
  const listsBody = {
    listAttributesToAggregate: [
      { type: 'totalActiveItemsCount' }
    ],
    listOwnershipType: null
  };
  
  const listsResult = await v2Request('/alexashoppinglists/api/v2/lists/fetch', 'POST', listsBody, cookies);
  console.log('Status:', listsResult.status);
  console.log('Data:', JSON.stringify(listsResult.data, null, 2));
  
  // If we got lists, try to get items from each
  if (listsResult.data?.listInfoList?.length > 0) {
    for (const list of listsResult.data.listInfoList) {
      console.log(`\n🛒 Getting items from list: ${list.listName || list.listType} (${list.listId})`);
      
      const itemsBody = {
        listAttributesToAggregate: [
          { type: 'totalActiveItemsCount' }
        ]
      };
      
      // Correct endpoint format from alexa-remote2
      const itemsResult = await v2Request(
        `/alexashoppinglists/api/v2/lists/${encodeURIComponent(list.listId)}/items/fetch?limit=100`,
        'POST',
        itemsBody,
        cookies
      );
      console.log('Status:', itemsResult.status);
      console.log('Items:', JSON.stringify(itemsResult.data, null, 2));
    }
  }
}

main().catch(console.error);
