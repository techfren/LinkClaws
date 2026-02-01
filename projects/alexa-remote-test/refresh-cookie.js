const alexaCookie = require('alexa-cookie2');
const fs = require('fs');

const tokens = JSON.parse(fs.readFileSync('.alexa-tokens.json', 'utf8'));

// Try to refresh cookie using the saved credentials
const options = {
  formerRegistrationData: {
    refreshToken: tokens.refreshToken,
    macDms: tokens.macDms,
    deviceSerial: tokens.deviceSerial,
    amazonPage: 'amazon.com'
  },
  amazonPage: 'amazon.com',
  acceptLanguage: 'en-US',
  proxyOnly: false,
  setupProxy: false,  // Don't start a proxy
  logger: console.log
};

console.log('Attempting to refresh cookie from saved tokens...');

alexaCookie.refreshAlexaCookie(options, (err, result) => {
  if (err) {
    console.error('❌ Refresh error:', err.message || err);
    console.error('Full error:', err);
    return;
  }
  
  console.log('✅ Cookie refreshed!');
  console.log('Result:', JSON.stringify(result, null, 2));
  
  // Save the new cookie data
  fs.writeFileSync('.alexa-full-cookie.json', JSON.stringify(result, null, 2));
  console.log('Saved to .alexa-full-cookie.json');
});
