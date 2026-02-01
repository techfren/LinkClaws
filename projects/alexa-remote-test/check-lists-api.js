const https = require('https');

const REFRESH_TOKEN = 'Atnr|EwMDII5ZuBSU2xX4uMbZjTG2ef2skzLGoVqM0fNE_4si-PYjyZ9JeY3dUaAmh5ymz1aLNGsFhiKRX_vUtIq8dKm8G3OK7qH7DImvQZynIH1kRWsl5YFXTbzMirsreygpDmoeovNqJiwYgCfHEo4QSZX_EjA9YDxaYotTBVafyfxm44aXUcXLO3tStGBgYFssF7nY6y0BfDtkeTp_GkNNZLh4FwVxo4SYt8nMqyN1XLhN6bVnMt8_CVOk7r1kdpdRvpjfikfXetXyuBelXK-fysZUi-jSGWu-M4lKu49S7dz3lckxa0J6KXkxVg8ZaAwEsZAIkZD9gxoZHcTrUeBxQeJv6KVi';

async function getAccessToken() {
  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: REFRESH_TOKEN,
    client_id: 'amzn1.application-oa2-client.000000000000000000000000000000000', // generic client
  });

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.amazon.com',
      path: '/auth/o2/token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(result);
        } catch (e) {
          reject(new Error(data));
        }
      });
    });
    req.on('error', reject);
    req.write(params.toString());
    req.end();
  });
}

async function tryListsAPI(accessToken) {
  const endpoints = [
    { host: 'api.amazonalexa.com', path: '/v2/householdlists' },
    { host: 'api.amazonalexa.com', path: '/v2/householdlists/' },
    { host: 'api.eu.amazonalexa.com', path: '/v2/householdlists' },
    { host: 'api.fe.amazonalexa.com', path: '/v2/householdlists' },
  ];

  for (const ep of endpoints) {
    console.log(`\nTrying ${ep.host}${ep.path}...`);
    try {
      const result = await new Promise((resolve, reject) => {
        const req = https.request({
          hostname: ep.host,
          path: ep.path,
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json',
          }
        }, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            resolve({ status: res.statusCode, headers: res.headers, body: data.substring(0, 500) });
          });
        });
        req.on('error', reject);
        req.end();
      });
      console.log(`Status: ${result.status}`);
      console.log(`Body: ${result.body}`);
    } catch (e) {
      console.log(`Error: ${e.message}`);
    }
  }
}

async function main() {
  console.log('Getting access token...');
  const tokenResp = await getAccessToken();
  
  if (tokenResp.error) {
    console.log('Token error:', tokenResp);
    
    // Try with app-specific params
    console.log('\nTrying with Alexa app params...');
    const params = new URLSearchParams({
      app_name: 'Amazon Alexa',
      app_version: '2.2.556530.0',
      source_token: REFRESH_TOKEN,
      source_token_type: 'refresh_token',
      requested_token_type: 'access_token'
    });

    const altResp = await new Promise((resolve) => {
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
      req.write(params.toString());
      req.end();
    });
    
    if (altResp.access_token) {
      console.log('Got access token via alt method!');
      console.log('Token type:', altResp.token_type);
      console.log('Expires in:', altResp.expires_in);
      await tryListsAPI(altResp.access_token);
    } else {
      console.log('Alt method failed:', altResp);
    }
  } else {
    console.log('Got access token!');
    console.log('Scopes:', tokenResp.scope);
    await tryListsAPI(tokenResp.access_token);
  }
}

main().catch(console.error);
