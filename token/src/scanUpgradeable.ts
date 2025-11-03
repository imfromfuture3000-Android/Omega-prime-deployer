import { Connection, PublicKey } from '@solana/web3.js';

const BPF_LOADER_UPGRADEABLE_ID = new PublicKey('BPFLoaderUpgradeab1e11111111111111111111111');

async function main() {
  const conn = new Connection('https://api.mainnet-beta.solana.com');
  console.log('Scanning for upgradeable programs...');
  
  const accounts = await conn.getProgramAccounts(BPF_LOADER_UPGRADEABLE_ID, {
    filters: [{ dataSize: 36 }]
  });

  const programs = [];
  
  for (const account of accounts.slice(0, 10)) {
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
  
  console.log(`\nFound ${accounts.length} total programs`);
  console.log(`Showing first ${programs.length} programs:`);
  console.log(`Upgradeable: ${programs.filter(p => p.isUpgradeable).length}`);
  console.log(`Immutable: ${programs.filter(p => !p.isUpgradeable).length}\n`);
  
  programs.forEach(p => {
    console.log(`${p.programId} - ${p.isUpgradeable ? 'UPGRADEABLE' : 'IMMUTABLE'}`);
    if (p.upgradeAuthority) {
      console.log(`  Authority: ${p.upgradeAuthority}`);
    }
  });
}

main().catch(console.error);