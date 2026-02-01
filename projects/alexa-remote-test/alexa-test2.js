const Alexa = require('alexa-remote2');
const fs = require('fs');

const config = JSON.parse(fs.readFileSync(__dirname + '/alexa-config.json', 'utf8'));

const alexa = new Alexa();

// Build cookie data in the format alexa-remote2 expects
const cookieData = {
  loginCookie: config.loginCookie,
  frc: config.frc,
  'map-md': config['map-md'],
  deviceId: config.deviceId,
  deviceSerial: config.deviceSerial,
  refreshToken: config.refreshToken,
  macDms: config.macDms
};

console.log('Initializing with cookie...');

alexa.init({
  cookie: config.loginCookie,
  formerRegistrationData: cookieData,
  amazonPage: 'amazon.com',
  acceptLanguage: 'en-US',
  useWsMqtt: false,
  logger: console.log,
}, (err) => {
  if (err) {
    console.error('Init error:', err.message);
    process.exit(1);
  }
  
  console.log('\n✅ Connected!\n');
  
  alexa.getDevices((err, devices) => {
    if (err) {
      console.error('Devices error:', err.message);
      process.exit(1);
    }
    
    console.log('Devices:');
    devices?.devices?.forEach(d => {
      console.log(`  - ${d.accountName} (${d.deviceFamily})`);
    });
    process.exit(0);
  });
});

alexa.on('cookie', (cookie) => {
  console.log('Cookie event received');
  config.loginCookie = cookie;
  fs.writeFileSync(__dirname + '/alexa-config.json', JSON.stringify(config, null, 2));
});
