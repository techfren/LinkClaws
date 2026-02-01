const Alexa = require('alexa-remote2');
const fs = require('fs');

const tokens = JSON.parse(fs.readFileSync('.alexa-tokens.json', 'utf8'));

const alexa = new Alexa();

// Use formerRegistrationData - this is how alexa-remote2 expects saved credentials
alexa.init({
  formerRegistrationData: {
    macDms: tokens.macDms,
    deviceSerial: tokens.deviceSerial,
    refreshToken: tokens.refreshToken,
    deviceId: tokens.deviceSerial,
    amazonPage: 'amazon.com'
  },
  amazonPage: 'amazon.com',
  acceptLanguage: 'en-US',
  proxyOnly: false,
  useWsMqtt: false
}, (err) => {
  if (err) {
    console.error('❌ Init error:', err.message || err);
    process.exit(1);
  }
  
  console.log('✅ Connected to Alexa!');
  
  // Get lists
  alexa.getListItems((err, result) => {
    if (err) {
      console.error('getListItems error:', err.message || err);
    } else {
      console.log('\n📋 List Items:', JSON.stringify(result, null, 2));
    }
  });
  
  alexa.getLists((err, result) => {
    if (err) {
      console.error('getLists error:', err.message || err);
    } else {
      console.log('\n📋 Lists:', JSON.stringify(result, null, 2));
    }
  });
  
  // Also try getting devices to verify connection
  alexa.getDevices((err, result) => {
    if (err) {
      console.error('getDevices error:', err.message || err);
    } else {
      console.log('\n🔊 Devices:', result?.devices?.map(d => d.accountName) || result);
    }
  });
});
