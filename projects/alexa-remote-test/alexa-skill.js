const Alexa = require('alexa-remote2');
const fs = require('fs');

const CONFIG_FILE = __dirname + '/alexa-config.json';
const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));

const alexa = new Alexa();

async function init() {
  return new Promise((resolve, reject) => {
    alexa.init({
      cookie: config.loginCookie,
      amazonPage: config.amazonPage || 'amazon.com',
      acceptLanguage: 'en-US',
      formerRegistrationData: {
        frc: config.frc,
        'map-md': config['map-md'],
        deviceId: config.deviceId,
        deviceSerial: config.deviceSerial,
        refreshToken: config.refreshToken,
        macDms: config.macDms
      },
      logger: process.env.DEBUG ? console.log : () => {},
    }, (err) => {
      if (err) reject(err);
      else resolve();
    });

    alexa.on('cookie', (cookie, csrf, macDms) => {
      config.loginCookie = cookie;
      config.csrf = csrf;
      if (macDms) config.macDms = macDms;
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
      console.log('Cookie refreshed and saved');
    });
  });
}

async function getShoppingList() {
  return new Promise((resolve, reject) => {
    alexa.getListsV2((err, lists) => {
      if (err) return reject(err);
      
      const shoppingList = lists?.lists?.find(l => 
        l.name?.toLowerCase().includes('shopping') || l.defaultList
      );
      
      if (!shoppingList) return resolve({ list: null, items: [] });
      
      alexa.getListV2(shoppingList.listId, (err, data) => {
        if (err) return reject(err);
        resolve({
          list: shoppingList,
          items: data?.listItems?.filter(i => i.status === 'active') || []
        });
      });
    });
  });
}

async function addToShoppingList(item) {
  return new Promise((resolve, reject) => {
    alexa.getListsV2((err, lists) => {
      if (err) return reject(err);
      
      const shoppingList = lists?.lists?.find(l => 
        l.name?.toLowerCase().includes('shopping') || l.defaultList
      );
      
      if (!shoppingList) return reject(new Error('Shopping list not found'));
      
      alexa.addListItemV2(shoppingList.listId, item, (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });
  });
}

async function getDevices() {
  return new Promise((resolve, reject) => {
    alexa.getDevices((err, devices) => {
      if (err) return reject(err);
      resolve(devices?.devices || []);
    });
  });
}

async function speak(deviceSerial, text) {
  return new Promise((resolve, reject) => {
    alexa.sendSequenceCommand(deviceSerial, 'speak', text, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

// CLI interface
const [,, command, ...args] = process.argv;

(async () => {
  try {
    await init();
    console.log('✅ Connected to Alexa\n');
    
    switch (command) {
      case 'list':
        const { items } = await getShoppingList();
        console.log('🛒 Shopping List:');
        if (items.length === 0) {
          console.log('  (empty)');
        } else {
          items.forEach(i => console.log(`  - ${i.value}`));
        }
        break;
        
      case 'add':
        const item = args.join(' ');
        if (!item) {
          console.log('Usage: node alexa-skill.js add <item>');
          break;
        }
        await addToShoppingList(item);
        console.log(`✅ Added "${item}" to shopping list`);
        break;
        
      case 'devices':
        const devices = await getDevices();
        console.log('📱 Devices:');
        devices.forEach(d => console.log(`  - ${d.accountName} (${d.deviceFamily})`));
        break;
        
      case 'speak':
        const [deviceName, ...textParts] = args;
        if (!deviceName || textParts.length === 0) {
          console.log('Usage: node alexa-skill.js speak <device-name> <text>');
          break;
        }
        const allDevices = await getDevices();
        const device = allDevices.find(d => 
          d.accountName?.toLowerCase().includes(deviceName.toLowerCase())
        );
        if (!device) {
          console.log('Device not found. Available:', allDevices.map(d => d.accountName).join(', '));
          break;
        }
        await speak(device.serialNumber, textParts.join(' '));
        console.log('✅ Spoke on', device.accountName);
        break;
        
      default:
        console.log('Usage:');
        console.log('  node alexa-skill.js list              - Show shopping list');
        console.log('  node alexa-skill.js add <item>        - Add item to list');
        console.log('  node alexa-skill.js devices           - List devices');
        console.log('  node alexa-skill.js speak <dev> <txt> - Speak on device');
    }
  } catch (err) {
    console.error('Error:', err.message);
    if (process.env.DEBUG) console.error(err);
  }
  process.exit(0);
})();
