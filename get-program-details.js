const { Connection, PublicKey } = require('@solana/web3.js');

const BPF_LOADER_UPGRADEABLE_ID = new PublicKey('BPFLoaderUpgradeab1e11111111111111111111111');
const conn = new Connection('https://api.mainnet-beta.solana.com');

async function getProgramDetails() {
  console.log('📋 DETAILED PROGRAM INFORMATION\n');
  
  const accounts = await conn.getProgramAccounts(BPF_LOADER_UPGRADEABLE_ID, {
    filters: [{ dataSize: 36 }]
  });

  for (let i = 0; i < 15 && i < accounts.length; i++) {
    const account = accounts[i];
    try {
      const upgradeAuthority = new PublicKey(account.account.data.slice(4, 36));
      const isUpgradeable = !upgradeAuthority.equals(PublicKey.default);
      
      console.log(`${i + 1}. PROGRAM ID: ${account.pubkey.toBase58()}`);
      console.log(`   Status: ${isUpgradeable ? 'UPGRADEABLE' : 'IMMUTABLE'}`);
      console.log(`   Authority: ${isUpgradeable ? upgradeAuthority.toBase58() : 'None (Immutable)'}`);
      console.log(`   Balance: ${(account.account.lamports / 1e9).toFixed(6)} SOL`);
      console.log(`   Owner: ${account.account.owner.toBase58()}`);
      console.log('');
    } catch (e) {
      console.log(`${i + 1}. PROGRAM ID: ${account.pubkey.toBase58()} - ERROR PARSING`);
    }
  }
}

getProgramDetails().catch(console.error);