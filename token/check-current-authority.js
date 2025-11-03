const { Keypair } = require('@solana/web3.js');
const fs = require('fs');

function checkCurrentAuthority() {
  console.log(`🔍 Checking current authority keys...`);
  
  // Load current authority from reannouncement
  const reannouncement = JSON.parse(fs.readFileSync('.cache/devnet-reannouncement.json'));
  const currentAuthorityAddress = reannouncement.newAuthority;
  
  console.log(`📋 Current Authority: ${currentAuthorityAddress}`);
  
  // Check if we have the keys
  if (fs.existsSync('.cache/new-authority.json')) {
    const keyData = JSON.parse(fs.readFileSync('.cache/new-authority.json'));
    const keypair = Keypair.fromSecretKey(new Uint8Array(keyData));
    
    console.log(`🔑 Keypair Address: ${keypair.publicKey.toBase58()}`);
    
    if (keypair.publicKey.toBase58() === currentAuthorityAddress) {
      console.log(`✅ WE HAVE KEYS for current authority`);
      return { 
        hasKeys: true, 
        address: currentAuthorityAddress,
        keypair: keypair
      };
    } else {
      console.log(`❌ Key mismatch`);
    }
  } else {
    console.log(`❌ No authority keys file found`);
  }
  
  return { hasKeys: false };
}

const result = checkCurrentAuthority();
console.log(`\nResult:`, result.hasKeys ? 'Keys available' : 'No keys');

module.exports = { checkCurrentAuthority };