const https = require('https');
const fs = require('fs');

const tokens = JSON.parse(fs.readFileSync('.alexa-tokens.json', 'utf8'));
const ITEM_TO_ADD = process.argv[2] || 'organic bananas';

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
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X)',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(bodyStr),
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let parsed;
        try { parsed = JSON.parse(data); } catch { parsed = { raw: data.substring(0, 500) }; }
        resolve({ status: res.statusCode, data: parsed });
      });
    });
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
  
  // Get lists first
  console.log('📋 Getting lists...');
  const lists = await v2Request('/alexashoppinglists/api/v2/lists/fetch', 'POST', {
    listAttributesToAggregate: [{ type: 'totalActiveItemsCount' }],
    listOwnershipType: null
  }, cookies);
  
  const shopList = lists.data.listInfoList?.find(l => l.listType === 'SHOP');
  if (!shopList) {
    console.error('No shopping list found!');
    return;
  }
  console.log(`Found shopping list: ${shopList.listId}`);
  
  // Add item - format from alexa-remote2
  console.log(`\n➕ Adding "${ITEM_TO_ADD}" to shopping list...`);
  const addResult = await v2Request(
    `/alexashoppinglists/api/v2/lists/${encodeURIComponent(shopList.listId)}/items`,
    'POST',
    {
      items: [{
        itemType: 'KEYWORD',
        itemName: ITEM_TO_ADD
      }]
    },
    cookies
  );
  
  console.log('Status:', addResult.status);
  console.log('Result:', JSON.stringify(addResult.data, null, 2));
  
  // Verify by fetching items
  console.log('\n📋 Verifying - fetching current items...');
  const items = await v2Request(
    `/alexashoppinglists/api/v2/lists/${encodeURIComponent(shopList.listId)}/items/fetch?limit=100`,
    'POST',
    { listAttributesToAggregate: [{ type: 'totalActiveItemsCount' }] },
    cookies
  );
  
  if (items.data.itemInfoList?.length > 0) {
    console.log('\n✅ Shopping list items:');
    items.data.itemInfoList.forEach((item, i) => {
      console.log(`  ${i + 1}. ${item.value} (status: ${item.itemStatus})`);
    });
  } else {
    console.log('List is empty');
  }
}

main().catch(console.error);
