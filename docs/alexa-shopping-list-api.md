# Alexa Shopping List API - Complete Guide

**Last Updated:** 2026-01-25
**Status:** Working ✅

## Background

Amazon deprecated the official Alexa List Management API on **July 1, 2024**. All official documentation now redirects to "Deprecated Features". Third-party integrations (AnyList, Todoist, etc.) lost native access.

However, we discovered a working method using the **V2 internal API** that Amazon's web/mobile apps use.

## Requirements

Only one thing needed:
- **Refresh Token** from `alexa-cookie-cli`

No tunnel, no browser relay, no physical Alexa device required.

## Getting the Refresh Token

On your local machine (Mac/PC):

```bash
# Clone alexa-cookie-cli
git clone https://github.com/xxxx/alexa-cookie-cli
cd alexa-cookie-cli

# Install and run
npm install
node cli.js --amazonPage amazon.com --baseAmazonPage amazon.com --acceptLanguage en-US
```

This opens a browser proxy at `http://127.0.0.1:8080/`. Log in to Amazon, complete any 2FA, then the CLI outputs:

```
refreshToken: Atnr|EwMDII5ZuBSU2...
macDms: {...}
deviceSerial: 90e0c597d937fe4449a4806090cfcc82
```

Save the **refreshToken** - that's all you need for API access.

## How It Works

### Step 1: Exchange Refresh Token for Cookies

```javascript
const https = require('https');

async function getCookies(refreshToken) {
  const body = new URLSearchParams({
    app_name: 'Amazon Alexa',
    app_version: '2.2.556530.0',
    source_token: refreshToken,
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

// Returns cookies valid for ~30 days (TTL: 2592000 seconds)
```

### Step 2: Build Cookie String

```javascript
function buildCookieString(cookieData) {
  const cookies = cookieData.response.tokens.cookies['.amazon.com'];
  return cookies.map(c => `${c.Name}=${c.Value}`).join('; ');
}
```

### Step 3: Call V2 API

**Base URL:** `https://www.amazon.com/alexashoppinglists/api/v2/`

All requests need:
- `Cookie` header with the cookie string
- `Content-Type: application/json`
- `User-Agent` (mobile works best)

## API Endpoints

### Get All Lists

```http
POST /alexashoppinglists/api/v2/lists/fetch
Content-Type: application/json

{
  "listAttributesToAggregate": [
    { "type": "totalActiveItemsCount" }
  ],
  "listOwnershipType": null
}
```

**Response:**
```json
{
  "listInfoList": [
    {
      "listId": "YW16bjEuYWNjb3VudC4uLi1TSE9QUElOR19JVEVN",
      "listType": "SHOP",
      "aggregatedAttributes": {
        "totalActiveItemsCount": "{\"count\":3,\"hasMore\":false}"
      }
    },
    {
      "listId": "YW16bjEuYWNjb3VudC4uLi1UQVNL",
      "listType": "TODO"
    }
  ]
}
```

### Get Items from List

```http
POST /alexashoppinglists/api/v2/lists/{listId}/items/fetch?limit=100
Content-Type: application/json

{
  "listAttributesToAggregate": [
    { "type": "totalActiveItemsCount" }
  ]
}
```

**Response:**
```json
{
  "itemInfoList": [
    {
      "itemId": "abc123",
      "value": "Bananas",
      "itemStatus": "ACTIVE",
      "version": 1
    }
  ],
  "listInfo": { ... }
}
```

### Add Item to List

```http
POST /alexashoppinglists/api/v2/lists/{listId}/items
Content-Type: application/json

{
  "listItems": [
    { "value": "Milk" }
  ]
}
```

### Update Item

```http
PUT /alexashoppinglists/api/v2/lists/{listId}/items/{itemId}?version={version}
Content-Type: application/json

{
  "value": "Updated item name",
  "itemStatus": "COMPLETED"  // or "ACTIVE"
}
```

### Delete Item

```http
DELETE /alexashoppinglists/api/v2/lists/{listId}/items/{itemId}?version={version}
```

**Note:** Version is required for update/delete operations to handle conflicts.

## Complete Working Example

See: `/home/ubuntu/clawd/projects/alexa-remote-test/v2-api.js`

```javascript
const https = require('https');
const fs = require('fs');

const REFRESH_TOKEN = 'Atnr|...your token...';

async function getCookies() {
  const body = new URLSearchParams({
    app_name: 'Amazon Alexa',
    app_version: '2.2.556530.0',
    source_token: REFRESH_TOKEN,
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
        'Content-Length': bodyStr.length,
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(data) }));
    });
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

async function getShoppingList() {
  const cookieData = await getCookies();
  const cookies = buildCookieString(cookieData);
  
  // Get lists
  const lists = await v2Request('/alexashoppinglists/api/v2/lists/fetch', 'POST', {
    listAttributesToAggregate: [{ type: 'totalActiveItemsCount' }],
    listOwnershipType: null
  }, cookies);
  
  // Find shopping list
  const shopList = lists.data.listInfoList.find(l => l.listType === 'SHOP');
  
  // Get items
  const items = await v2Request(
    `/alexashoppinglists/api/v2/lists/${encodeURIComponent(shopList.listId)}/items/fetch?limit=100`,
    'POST',
    { listAttributesToAggregate: [{ type: 'totalActiveItemsCount' }] },
    cookies
  );
  
  return items.data.itemInfoList.map(i => i.value);
}

getShoppingList().then(console.log);
```

## Token Lifecycle

| Token | TTL | Notes |
|-------|-----|-------|
| Refresh Token | ~30 days | From alexa-cookie-cli, needs periodic re-auth |
| Cookies | ~30 days | Generated from refresh token |
| Access Token | 1 hour | Not needed for V2 API (cookies work) |

## What Doesn't Work

### Official List API (Deprecated)
- `api.amazonalexa.com/v2/householdlists` → 404
- `alexa.amazon.com/api/namedLists` → 503
- `alexa.amazon.com/api/todos` → 503

These endpoints were officially deprecated July 2024.

### Bearer Token Auth
The access token from `api.amazon.com/auth/token` (type: access_token) doesn't work for list endpoints. You must use cookies.

## Amazon Cart Integration

Cart is separate from Alexa lists. Options:

1. **Add to Cart Form** (needs ASIN):
   ```
   https://www.amazon.com/gp/aws/cart/add.html?ASIN.1=B0XXXXX&Quantity.1=1
   ```

2. **Browser Relay**: Control Chrome remotely for:
   - "Buy Again" page automation
   - Search → Add to cart
   - Logged-in cart operations

## Files

- Tokens: `/home/ubuntu/clawd/projects/alexa-remote-test/.alexa-tokens.json`
- Test scripts: `/home/ubuntu/clawd/projects/alexa-remote-test/`
- This doc: `/home/ubuntu/clawd/docs/alexa-shopping-list-api.md`

## Credits

- Research via Exa AI
- `alexa-remote2` npm package (source of V2 endpoint discovery)
- `alexa-cookie-cli` for auth flow
