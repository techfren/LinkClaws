const alexaCookie = require('alexa-cookie2');
const fs = require('fs');

const refreshToken = 'Atnr|EwMDIPmAvN7CL7oVbG7rjhyRIN9oh0Df74KvnVIxHK2Ju1fHPn98Mpd7Lo0SEjr6NK2RT99G1iZzPy4QaMbMgetamje201C6z4Psa2T-MswIbSsz6MMzTWEs9YfQfhP-_figyKP9hOZH8hRCoz5DLlgKpKJWrm3B0NIynO5OII7YgSO41Xvrddf_8Nvk0MZ7gQ0YJZJK4TemcwSNE3h3uFejO3KzUXxsAfRxjF4O4bZwzB9_u-KxEzarHnNlxd0bOa1f0-EzNW50Kvx99ztG5gBQPeI4sEb5GZiulSlcUBviPWgEu1BOw0i4ajJ6yN-LsplCd8HtRDomDihNnyZyS8kWezTZ';

alexaCookie.refreshAlexaCookie({
  refreshToken: refreshToken,
  amazonPage: 'amazon.com',
}, (err, result) => {
  if (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
  
  console.log('✅ Got cookie from refresh token!\n');
  
  const config = {
    refreshToken: refreshToken,
    cookie: result.cookie,
    csrf: result.csrf,
    macDms: result.macDms
  };
  
  fs.writeFileSync(__dirname + '/alexa-config.json', JSON.stringify(config, null, 2));
  console.log('Saved to alexa-config.json');
});
