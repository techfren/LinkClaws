const Alexa = require('alexa-remote2');
const fs = require('fs');

const alexa = new Alexa();

// Cookies from AJ's browser
const cookieString = 'session-id=138-3193349-9044331; session-id-time=2082787201l; x-main="pFOpxnqnGlSzpbXSMSX0ZapFScdzPIdsjnAt71KOyh4Jn5R@lespyXwmAzihCmns"; at-main=Atza|IwEBIN6gtsTE-eVRfQRmcQ5Ec0OcLCI4MArJVamLai2-jvGOmq3QwTh3yQK6FzjtsmwikI338ZNja6JwZiusvu4fPuV5VplvGEftnBT8Zr0EsgG7upKWEUKszW7CzjYxf9a8sVK5pcUlgd6Rn8KDT0pCB2dI0J5HfIwOXsUID-kKojRBEf9kuuYnz4pcceUalo1i0lUuMi64T4m0ukl6om3Jc6TyUt-JwCLGj4_2SeC_AJJ2RA; ubid-main=133-2009864-1712133';

alexa.init({
  cookie: cookieString,
  amazonPage: 'amazon.com',
  acceptLanguage: 'en-US',
  logger: console.log
}, (err) => {
  if (err) {
    console.error('Init error:', err.message);
    return;
  }
  
  console.log('\n✅ Connected to Alexa!\n');
  
  // Get shopping lists
  alexa.getListsV2((err, lists) => {
    if (err) {
      console.error('Lists error:', err.message);
      return;
    }
    
    console.log('📋 Lists found:');
    if (lists && lists.lists) {
      lists.lists.forEach(list => {
        console.log(`  - ${list.name} (${list.listId})`);
      });
      
      // Find shopping list
      const shoppingList = lists.lists.find(l => 
        l.name.toLowerCase().includes('shopping') || 
        l.defaultList
      );
      
      if (shoppingList) {
        console.log(`\n🛒 Shopping list: ${shoppingList.name}`);
        
        // Get items
        alexa.getListV2(shoppingList.listId, (err, items) => {
          if (err) {
            console.error('Items error:', err.message);
            return;
          }
          
          console.log('\nItems:');
          if (items && items.listItems) {
            items.listItems.forEach(item => {
              console.log(`  ${item.status === 'active' ? '☐' : '☑'} ${item.value}`);
            });
          }
          process.exit(0);
        });
      }
    }
  });
});

alexa.on('cookie', (cookie) => {
  console.log('Cookie refreshed, saving...');
  fs.writeFileSync('alexa-cookies.json', JSON.stringify({ cookie }, null, 2));
});
