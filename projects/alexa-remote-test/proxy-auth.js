const Alexa = require('alexa-remote2');
const fs = require('fs');

const alexa = new Alexa();
const COOKIE_FILE = './alexa-cookies.json';

console.log('Starting Alexa auth proxy on port 3456...');

alexa.init({
  cookie: undefined,
  proxyOnly: true,
  proxyOwnIp: '127.0.0.1',
  proxyPort: 3456,
  proxyLogLevel: 'info',
  amazonPage: 'amazon.com',
  acceptLanguage: 'en-US',
  logger: console.log
}, (err) => {
  if (err) {
    // This error is expected - it means proxy is running and waiting for login
    if (err.message && err.message.includes('Please open')) {
      console.log('\n✅ Proxy server running!');
      console.log('=====================================');
      console.log('Open in your browser: http://localhost:3456/');
      console.log('=====================================');
      console.log('\nWaiting for you to log in...\n');
    } else {
      console.error('Unexpected error:', err);
    }
    return;
  }
  
  console.log('✅ Already authenticated!');
  onReady();
});

alexa.on('cookie', (cookie, csrf, macDms) => {
  console.log('\n🎉 Got cookies! Saving...');
  const data = {
    cookie,
    csrf,
    macDms,
    formerRegistrationData: alexa.cookieData
  };
  fs.writeFileSync(COOKIE_FILE, JSON.stringify(data, null, 2));
  console.log('✅ Saved to', COOKIE_FILE);
  console.log('\nYou can now use the API! Press Ctrl+C to exit.');
  
  // Test the connection
  setTimeout(() => {
    console.log('\nTesting connection - fetching lists...');
    alexa.getListsV2((err, lists) => {
      if (err) {
        console.error('Error:', err.message);
      } else {
        console.log('Lists found:', lists?.lists?.length || 0);
        if (lists?.lists) {
          lists.lists.forEach(l => console.log(`  - ${l.name} (${l.listId})`));
        }
      }
    });
  }, 2000);
});

function onReady() {
  alexa.getListsV2((err, lists) => {
    if (err) {
      console.error('Error getting lists:', err);
      return;
    }
    console.log('Shopping Lists:', JSON.stringify(lists, null, 2));
  });
}
