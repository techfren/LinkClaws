const Alexa = require('alexa-remote2');
const fs = require('fs');

const alexa = new Alexa();

const COOKIE_FILE = './alexa-cookies.json';

// Check if we have saved cookies
let savedCookies = null;
if (fs.existsSync(COOKIE_FILE)) {
  try {
    savedCookies = JSON.parse(fs.readFileSync(COOKIE_FILE, 'utf8'));
    console.log('Found saved cookies, attempting to use them...');
  } catch (e) {
    console.log('Could not parse saved cookies, starting fresh auth');
  }
}

const config = {
  // Amazon domain - use .com for US, .co.uk for UK, etc.
  amazonPage: 'amazon.com',
  
  // Use saved cookies if available
  cookie: savedCookies?.cookie,
  formerRegistrationData: savedCookies?.formerRegistrationData,
  
  // Proxy settings for initial auth
  proxyOnly: true,
  proxyOwnIp: '0.0.0.0', // Listen on all interfaces
  proxyPort: 3456,
  proxyLogLevel: 'info',
  
  // Accept language
  acceptLanguage: 'en-US',
  
  // User agent
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
};

alexa.init(config, (err) => {
  if (err) {
    console.error('Init error:', err);
    
    if (err.message?.includes('no csrf')) {
      console.log('\n========================================');
      console.log('AUTH REQUIRED - Open this URL in your browser:');
      console.log(`http://YOUR_SERVER_IP:3456`);
      console.log('========================================\n');
      console.log('Replace YOUR_SERVER_IP with your server\'s IP address');
      console.log('Log in with your Amazon credentials');
      console.log('The auth will complete automatically\n');
    }
    return;
  }
  
  console.log('✅ Alexa Remote initialized successfully!');
  
  // Save cookies for future use
  const cookieData = {
    cookie: alexa.cookieData?.cookie,
    formerRegistrationData: alexa.cookieData?.formerRegistrationData || alexa.cookieData
  };
  fs.writeFileSync(COOKIE_FILE, JSON.stringify(cookieData, null, 2));
  console.log('Cookies saved to', COOKIE_FILE);
  
  // Test: Get shopping lists
  console.log('\nFetching shopping lists...');
  alexa.getListsV2((err, lists) => {
    if (err) {
      console.error('Error getting lists:', err);
      return;
    }
    console.log('Shopping Lists:', JSON.stringify(lists, null, 2));
  });
});

// Handle proxy callback for auth
alexa.on('cookie', (cookie, csrf, macDms) => {
  console.log('Got cookie via proxy!');
  const cookieData = {
    cookie,
    csrf,
    macDms,
    formerRegistrationData: alexa.cookieData
  };
  fs.writeFileSync(COOKIE_FILE, JSON.stringify(cookieData, null, 2));
  console.log('Cookies saved!');
});
