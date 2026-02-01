const https = require('https');
const crypto = require('crypto');
const fs = require('fs');

const tokens = JSON.parse(fs.readFileSync('.alexa-tokens.json', 'utf8'));

// Sign request using device private key (RSA-SHA256)
function signRequest(method, path, body, timestamp) {
  const privateKey = `-----BEGIN PRIVATE KEY-----\n${tokens.macDms.device_private_key}\n-----END PRIVATE KEY-----`;
  const data = `${method}\n${path}\n${timestamp}\n${body || ''}`;
  
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(data);
  return sign.sign(privateKey, 'base64');
}

// Exchange tokens for device credentials
async function registerDevice() {
  const timestamp = new Date().toISOString();
  const deviceSerial = tokens.deviceSerial;
  
  const body = JSON.stringify({
    requested_extensions: ['device_info', 'customer_info'],
    cookies: {
      website_cookies: [],
      domain: '.amazon.com'
    },
    registration_data: {
      domain: 'Device',
      app_version: '2.2.556530.0',
      device_serial: deviceSerial,
      device_type: 'A2IVLV5VM2W81',
      device_name: '%FIRST_NAME%%FIRST_NAME_POSSESSIVE_STRING%%DUPE_STRATEGY_1ST%Alexa on iPhone',
      os_version: '16.6',
      software_version: '1',
      device_model: 'iPhone14,5',
      app_name: 'Amazon Alexa',
      frc: tokens.macDms.adp_token
    },
    auth_data: {
      access_token: null
    },
    user_context_map: {
      frc: tokens.macDms.adp_token
    },
    requested_token_type: ['bearer', 'mac_dms', 'website_cookies']
  });

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.amazon.com',
      path: '/auth/register',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': 'en-US',
        'x-amzn-identity-auth-domain': 'api.amazon.com'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('Register status:', res.statusCode);
        try { resolve(JSON.parse(data)); } catch { resolve({ raw: data }); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// Try to get cookies using refresh token flow  
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
      res.on('end', () => {
        console.log('Cookie exchange status:', res.statusCode);
        try { resolve(JSON.parse(data)); } catch { resolve({ raw: data }); }
      });
    });
    req.on('error', e => resolve({ error: e.message }));
    req.write(body);
    req.end();
  });
}

async function main() {
  console.log('🔐 Trying to get cookies from refresh token...\n');
  const cookieResult = await getCookies();
  console.log(JSON.stringify(cookieResult, null, 2));
  
  console.log('\n\n🔐 Trying device registration...\n');
  const regResult = await registerDevice();
  console.log(JSON.stringify(regResult, null, 2));
}

main().catch(console.error);
