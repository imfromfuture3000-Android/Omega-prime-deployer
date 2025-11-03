const { Keypair } = require('@solana/web3.js');
const fs = require('fs');

function checkAuthorityKeys() {
  const targetAddress = '4eJZVbbsiLAG6EkWvgEYEWKEpdhJPFBYMeJ6DBX98w6a';
  
  console.log(`🔍 Checking for keys of: ${targetAddress}`);
  
  // Check cache files
  const cacheFiles = [
    '.cache/new-authority.json',
    '.cache/deployer.json',
    '.cache/authority-transfer.json',
    '.cache/devnet-reannouncement.json'
  ];
  
  for (const file of cacheFiles) {
    if (fs.existsSync(file)) {
      try {
        const data = JSON.parse(fs.readFileSync(file));
        
        // Check if it's a keypair array
        if (Array.isArray(data) && data.length === 64) {
          const kp = Keypair.fromSecretKey(new Uint8Array(data));
          console.log(`📁 ${file}: ${kp.publicKey.toBase58()}`);
          
          if (kp.publicKey.toBase58() === targetAddress) {
            console.log(`✅ FOUND KEYS for ${targetAddress} in ${file}`);
            return { found: true, file, keypair: kp };
          }
        }
        
        // Check JSON object fields
        for (const [key, value] of Object.entries(data)) {
          if (typeof value === 'string' && value === targetAddress) {
            console.log(`📋 ${file}.${key}: ${value}`);
          }
        }
      } catch (e) {
        console.log(`⚠️ ${file}: Invalid format`);
      }
    }
  }
  
  console.log(`❌ No keys found for ${targetAddress}`);
  return { found: false };
}

const result = checkAuthorityKeys();
module.exports = { checkAuthorityKeys };