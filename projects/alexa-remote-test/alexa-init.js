const Alexa = require('alexa-remote2');
const fs = require('fs');

const CONFIG_FILE = __dirname + '/alexa-config.json';
const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));

const alexa = new Alexa();

// Build formerRegistrationData
const formerData = {
  loginCookie: config.loginCookie,
  frc: config.frc,
  'map-md': config['map-md'],
  deviceId: config.deviceId,
  deviceSerial: config.deviceSerial,
  refreshToken: config.refreshToken,
  macDms: config.macDms
};

alexa.init({
  cookie: config.loginCookie,
  formerRegistrationData: formerData,
  amazonPage: 'amazon.com',  // Uses amazon.com for auth, redirects to amazon.com.au
  acceptLanguage: 'en-US',
  useWsMqtt: false,
  logger: () => {},  // Silent
}, (err) => {
  if (err) {
    console.error('Init error:', err.message);
    process.exit(1);
  }
  
  console.log('✅ Connected to Alexa!\n');
  
  // Get shopping lists
  alexa.getListsV2((err, lists) => {
    if (err) {
      console.error('Lists error:', err.message);
      process.exit(1);
    }
    
    console.log('📋 Lists found:');
    if (lists && lists.lists) {
      lists.lists.forEach(list => {
        console.log(`  - ${list.name} (${list.listId})`);
      });
      
      // Find shopping list
      const shoppingList = lists.lists.find(l => 
        l.name?.toLowerCase().includes('shopping') || l.defaultList
      );
      
      if (shoppingList) {
        console.log(`\n🛒 Shopping list: ${shoppingList.name}`);
        
        alexa.getListV2(shoppingList.listId, (err, data) => {
          if (err) {
            console.error('Items error:', err.message);
            process.exit(1);
          }
          
          console.log('\nActive items:');
          const items = data?.listItems?.filter(i => i.status === 'active') || [];
          if (items.length === 0) {
            console.log('  (empty)');
          } else {
            items.forEach(i => console.log(`  ☐ ${i.value}`));
          }
          process.exit(0);
        });
      } else {
        console.log('No shopping list found');
        process.exit(0);
      }
    } else {
      console.log('No lists found');
      process.exit(0);
    }
  });
});

alexa.on('cookie', (cookie) => {
  console.log('Saving fresh cookie...');
  config.loginCookie = cookie;
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
});
