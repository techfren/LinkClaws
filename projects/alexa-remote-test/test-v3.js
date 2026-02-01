const Alexa = require('alexa-remote2');
const fs = require('fs');

const tokens = JSON.parse(fs.readFileSync('.alexa-tokens.json', 'utf8'));

const alexa = new Alexa();

// Log cookie events
alexa.on('cookie', (cookie, csrf, macDms) => {
  console.log('🍪 Cookie event - got new cookie');
  // Save for future use
  fs.writeFileSync('.alexa-cookie-data.json', JSON.stringify({
    cookie, csrf, macDms,
    cookieData: alexa.cookieData
  }, null, 2));
});

// Build the formerRegistrationData the way alexa-cookie2 outputs it
const formerData = {
  refreshToken: tokens.refreshToken,
  macDms: tokens.macDms,
  deviceSerial: tokens.deviceSerial,
  deviceId: tokens.deviceSerial,
  amazonPage: 'amazon.com',
  loginCookie: ''  // This might be what's missing
};

console.log('Initializing with formerRegistrationData...');
console.log('macDms present:', !!tokens.macDms);
console.log('refreshToken present:', !!tokens.refreshToken);
console.log('deviceSerial:', tokens.deviceSerial);

alexa.init({
  formerRegistrationData: formerData,
  macDms: tokens.macDms,
  amazonPage: 'amazon.com',
  alexaServiceHost: 'pitangui.amazon.com',  // US endpoint
  acceptLanguage: 'en-US',
  useWsMqtt: false,  // Disable push for now
  proxyOnly: false,
  bluetooth: false,
  logger: (msg) => console.log('[alexa]', msg)
}, (err) => {
  if (err) {
    console.error('❌ Init error:', err.message || err);
    console.error('Full error:', err);
    return;
  }
  
  console.log('✅ Connected!');
  
  // List devices
  alexa.getDevices((err, result) => {
    if (err) {
      console.error('Devices error:', err.message);
    } else {
      console.log('Devices:', result?.devices?.length || 0);
    }
  });
  
  // Get lists using V2 API
  alexa.getListsV2((err, result) => {
    if (err) {
      console.error('Lists error:', err.message);
    } else {
      console.log('Lists:', JSON.stringify(result, null, 2));
    }
  });
});
