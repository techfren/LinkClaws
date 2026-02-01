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

async function getShoppingListPage(cookies) {
  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'www.amazon.com',
      path: '/alexaquantum/sp/alexaShoppingList',
      method: 'GET',
      headers: {
        'Cookie': cookies,
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, html: data }));
    });
    req.end();
  });
}

function parseShoppingList(html) {
  const items = [];
  
  // Look for list items in the HTML
  // Common patterns in Amazon's quantum pages:
  
  // Pattern 1: data-item-value or data-value attributes
  const dataValueMatch = html.matchAll(/data-(?:item-)?value="([^"]+)"/gi);
  for (const match of dataValueMatch) {
    if (match[1] && !match[1].includes('{') && match[1].length < 100) {
      items.push({ name: match[1], source: 'data-value' });
    }
  }
  
  // Pattern 2: list-item-text class
  const listItemMatch = html.matchAll(/class="[^"]*list-item[^"]*"[^>]*>([^<]+)</gi);
  for (const match of listItemMatch) {
    if (match[1]?.trim()) items.push({ name: match[1].trim(), source: 'list-item' });
  }
  
  // Pattern 3: customer-list-item-value
  const custListMatch = html.matchAll(/customer-list-item-value[^>]*>([^<]+)</gi);
  for (const match of custListMatch) {
    if (match[1]?.trim()) items.push({ name: match[1].trim(), source: 'customer-list' });
  }
  
  // Pattern 4: Shopping item containers
  const shoppingItemMatch = html.matchAll(/<span[^>]*class="[^"]*(?:item-name|shopping-item|todo-item)[^"]*"[^>]*>([^<]+)</gi);
  for (const match of shoppingItemMatch) {
    if (match[1]?.trim()) items.push({ name: match[1].trim(), source: 'shopping-item' });
  }
  
  // Pattern 5: aria-label on list items
  const ariaMatch = html.matchAll(/aria-label="([^"]+)"[^>]*class="[^"]*list/gi);
  for (const match of ariaMatch) {
    if (match[1]?.trim()) items.push({ name: match[1].trim(), source: 'aria' });
  }
  
  // Deduplicate
  const unique = [...new Set(items.map(i => i.name))];
  return unique;
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
  
  console.log('📋 Fetching shopping list page...');
  const result = await getShoppingListPage(cookies);
  console.log(`Status: ${result.status}`);
  
  // Save HTML for debugging
  fs.writeFileSync('shopping-list-page.html', result.html);
  console.log('Saved HTML to shopping-list-page.html');
  
  // Parse items
  console.log('\n🛒 Parsing shopping list items...');
  const items = parseShoppingList(result.html);
  
  if (items.length > 0) {
    console.log('\n✅ Found items:');
    items.forEach((item, i) => console.log(`  ${i + 1}. ${item}`));
  } else {
    console.log('\n⚠️ No items found via patterns. Checking HTML structure...');
    
    // Print snippets that might contain list data
    const snippets = result.html.match(/.{0,50}(?:list|item|shopping|todo).{0,50}/gi) || [];
    console.log('\nRelevant snippets:');
    snippets.slice(0, 10).forEach(s => console.log(`  - ${s.replace(/\s+/g, ' ').trim()}`));
  }
}

main().catch(console.error);
