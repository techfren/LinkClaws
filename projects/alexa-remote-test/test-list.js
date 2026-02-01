const Alexa = require('alexa-remote2');
const fs = require('fs');

const tokens = JSON.parse(fs.readFileSync('.alexa-tokens.json', 'utf8'));

const alexa = new Alexa();

// Configure with saved tokens
const config = {
  cookie: '', // Not needed with refresh token
  macDms: tokens.macDms,
  deviceSerial: tokens.deviceSerial,
  refreshToken: tokens.refreshToken,
  amazonPage: 'amazon.com',
  acceptLanguage: 'en-US',
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
};

alexa.init(config, (err) => {
  if (err) {
    console.error('Init error:', err.message || err);
    process.exit(1);
  }
  
  console.log('✅ Alexa authenticated!');
  
  // Get shopping list
  alexa.getLists((err, lists) => {
    if (err) {
      console.error('Lists error:', err.message || err);
      return;
    }
    
    console.log('\n📋 Lists:', JSON.stringify(lists, null, 2));
    
    // Find shopping list
    const shoppingList = lists?.lists?.find(l => 
      l.defaultList && l.listId?.includes('shopping')
    ) || lists?.lists?.[0];
    
    if (shoppingList) {
      alexa.getList(shoppingList.listId, (err, items) => {
        if (err) {
          console.error('Get list error:', err);
          return;
        }
        console.log('\n🛒 Shopping items:', JSON.stringify(items, null, 2));
      });
    }
  });
});
