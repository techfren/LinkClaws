#!/usr/bin/env node
/**
 * Alexa Token Health Check
 * Run daily via cron to verify tokens still work
 * Outputs status for Clawdbot to pick up
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const TOKEN_FILE = path.join(__dirname, '.alexa-tokens.json');
const STATUS_FILE = path.join(__dirname, '.alexa-status.json');

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
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, error: 'Parse error', raw: data.substring(0, 200) });
        }
      });
    });
    req.on('error', e => resolve({ error: e.message }));
    req.write(body);
    req.end();
  });
}

async function testListAccess(cookies) {
  const cookieStr = cookies.map(c => `${c.Name}=${c.Value}`).join('; ');
  
  return new Promise((resolve) => {
    const body = JSON.stringify({
      listAttributesToAggregate: [{ type: 'totalActiveItemsCount' }],
      listOwnershipType: null
    });
    
    const req = https.request({
      hostname: 'www.amazon.com',
      path: '/alexashoppinglists/api/v2/lists/fetch',
      method: 'POST',
      headers: {
        'Cookie': cookieStr,
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X)',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ 
            status: res.statusCode, 
            ok: res.statusCode === 200 && parsed.listInfoList?.length > 0,
            listCount: parsed.listInfoList?.length || 0
          });
        } catch {
          resolve({ status: res.statusCode, ok: false, error: 'Parse error' });
        }
      });
    });
    req.on('error', e => resolve({ ok: false, error: e.message }));
    req.write(body);
    req.end();
  });
}

async function main() {
  const result = {
    timestamp: new Date().toISOString(),
    tokenValid: false,
    listAccessible: false,
    error: null
  };

  try {
    // Check if token file exists
    if (!fs.existsSync(TOKEN_FILE)) {
      result.error = 'Token file not found';
      saveAndReport(result);
      return;
    }

    const tokens = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf8'));
    
    if (!tokens.refreshToken) {
      result.error = 'No refresh token in file';
      saveAndReport(result);
      return;
    }

    // Test cookie exchange
    console.log('Testing token exchange...');
    const cookieResult = await getCookies(tokens.refreshToken);
    
    if (cookieResult.error || !cookieResult.data?.response?.tokens?.cookies) {
      result.error = `Cookie exchange failed: ${cookieResult.error || JSON.stringify(cookieResult.data)}`;
      saveAndReport(result);
      return;
    }

    result.tokenValid = true;
    result.cookieTTL = cookieResult.data.response.tokens.ttl;
    
    // Test list access
    console.log('Testing list access...');
    const cookies = cookieResult.data.response.tokens.cookies['.amazon.com'];
    const listResult = await testListAccess(cookies);
    
    result.listAccessible = listResult.ok;
    result.listCount = listResult.listCount;
    
    if (!listResult.ok) {
      result.error = `List access failed: ${listResult.error || `status ${listResult.status}`}`;
    }

  } catch (e) {
    result.error = e.message;
  }

  saveAndReport(result);
}

function saveAndReport(result) {
  // Save status
  fs.writeFileSync(STATUS_FILE, JSON.stringify(result, null, 2));
  
  // Report
  if (result.tokenValid && result.listAccessible) {
    console.log(`✅ Alexa tokens healthy (TTL: ${Math.round(result.cookieTTL / 86400)} days, ${result.listCount} lists)`);
    process.exit(0);
  } else {
    console.error(`❌ Alexa token issue: ${result.error}`);
    console.error('ACTION REQUIRED: Re-authenticate with alexa-cookie-cli');
    process.exit(1);
  }
}

main();
