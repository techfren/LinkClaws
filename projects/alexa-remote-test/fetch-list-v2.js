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

function buildCookieString(cookieData) {
  const cookies = cookieData.response.tokens.cookies['.amazon.com'];
  return cookies.map(c => `${c.Name}=${c.Value}`).join('; ');
}

// First get the SPA to extract CSRF token
async function getCSRF(cookies) {
  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'alexa.amazon.com',
      path: '/spa/index.html',
      method: 'GET',
      headers: {
        'Cookie': cookies,
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15',
        'Accept': 'text/html',
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        // Extract CSRF from HTML or set-cookie
        const csrfMatch = data.match(/csrf["\s:]+["']?([^"'\s,}]+)/i);
        const setCookies = res.headers['set-cookie'] || [];
        const csrfCookie = setCookies.find(c => c.includes('csrf'));
        
        resolve({
          csrf: csrfMatch?.[1] || null,
          csrfCookie: csrfCookie,
          setCookies: setCookies
        });
      });
    });
    req.on('error', e => resolve({ error: e.message }));
    req.end();
  });
}

async function alexaRequest(host, path, cookies, csrf) {
  return new Promise((resolve) => {
    const headers = {
      'Cookie': cookies + (csrf ? `; csrf=${csrf}` : ''),
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15',
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'en-US',
      'Origin': 'https://alexa.amazon.com',
      'Referer': 'https://alexa.amazon.com/spa/index.html',
    };
    if (csrf) headers['csrf'] = csrf;
    
    const req = https.request({ hostname: host, path, method: 'GET', headers }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let parsed;
        try { parsed = JSON.parse(data); } catch { parsed = { raw: data.substring(0, 500) }; }
        resolve({ status: res.statusCode, data: parsed });
      });
    });
    req.on('error', e => resolve({ error: e.message }));
    req.end();
  });
}

async function main() {
  console.log('🔑 Getting cookies...');
  const cookieData = await getCookies();
  if (!cookieData.response?.tokens?.cookies) {
    console.error('Failed:', cookieData);
    return;
  }
  const cookies = buildCookieString(cookieData);
  console.log('✅ Got cookies');
  
  console.log('\n🔐 Getting CSRF token...');
  const csrfData = await getCSRF(cookies);
  console.log('CSRF data:', csrfData);
  
  // Extract csrf from set-cookie if present
  let csrf = csrfData.csrf;
  if (csrfData.csrfCookie) {
    const match = csrfData.csrfCookie.match(/csrf=([^;]+)/);
    if (match) csrf = match[1];
  }
  console.log('Using CSRF:', csrf);
  
  // Now try endpoints with CSRF
  const endpoints = [
    ['alexa.amazon.com', '/api/namedLists'],
    ['alexa.amazon.com', '/api/namedLists?type=SHOPPING_LIST'],
    ['alexa.amazon.com', '/api/todos?type=SHOPPING_ITEM&size=100'],
    ['pitangui.amazon.com', '/api/namedLists'],
    ['pitangui.amazon.com', '/api/todos?type=SHOPPING_ITEM&size=100'],
    // Mobile quantum page
    ['www.amazon.com', '/alexaquantum/sp/alexaShoppingList'],
  ];
  
  for (const [host, path] of endpoints) {
    console.log(`\n📍 ${host}${path}`);
    const result = await alexaRequest(host, path, cookies, csrf);
    console.log(`   Status: ${result.status}`);
    const preview = JSON.stringify(result.data).substring(0, 400);
    console.log(`   Data: ${preview}`);
  }
}

main().catch(console.error);
