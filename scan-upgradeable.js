const { Connection, PublicKey } = require('@solana/web3.js');

const BPF_LOADER_UPGRADEABLE_ID = new PublicKey('BPFLoaderUpgradeab1e11111111111111111111111');
const conn = new Connection('https://api.mainnet-beta.solana.com');

async function scanUpgradeablePrograms() {
  console.log('Scanning for upgradeable programs...');
  
  const accounts = await conn.getProgramAccounts(BPF_LOADER_UPGRADEABLE_ID, {
    filters: [{ dataSize: 36 }]
  });

  const programs = [];
  
  for (const account of accounts.slice(0, 20)) { // Limit for demo
    try {
      const programData = account.account.data;
      const upgradeAuthority = new PublicKey(programData.slice(4, 36));
      
      programs.push({
        programId: account.pubkey.toBase58(),
        upgradeAuthority: upgradeAuthority.equals(PublicKey.default) ? null : upgradeAuthority.toBase58(),
        isUpgradeable: !upgradeAuthority.equals(PublicKey.default)
      });
    } catch (e) {
      // Skip invalid accounts
    }
  }
  
  console.log(`Found ${programs.length} programs (showing first 20)`);
  console.log(`Upgradeable: ${programs.filter(p => p.isUpgradeable).length}`);
  
  programs.forEach(p => {
    console.log(`${p.programId} - ${p.isUpgradeable ? 'UPGRADEABLE' : 'IMMUTABLE'}`);
  });
}

scanUpgradeablePrograms().catch(console.error);