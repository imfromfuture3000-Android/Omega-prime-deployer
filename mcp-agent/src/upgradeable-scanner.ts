import { Connection, PublicKey } from '@solana/web3.js';

const BPF_LOADER_UPGRADEABLE_ID = new PublicKey('BPFLoaderUpgradeab1e11111111111111111111111');

export async function scanUpgradeablePrograms(conn: Connection): Promise<any[]> {
  const accounts = await conn.getProgramAccounts(BPF_LOADER_UPGRADEABLE_ID, {
    filters: [
      { dataSize: 36 }, // Program account size
    ]
  });

  const programs = [];
  
  for (const account of accounts) {
    try {
      const programData = account.account.data;
      const upgradeAuthority = new PublicKey(programData.slice(4, 36));
      
      programs.push({
        programId: account.pubkey.toBase58(),
        upgradeAuthority: upgradeAuthority.equals(PublicKey.default) ? null : upgradeAuthority.toBase58(),
        isUpgradeable: !upgradeAuthority.equals(PublicKey.default),
        lamports: account.account.lamports
      });
    } catch (e) {
      // Skip invalid accounts
    }
  }
  
  return programs;
}

export async function checkProgramUpgradeability(conn: Connection, programId: string): Promise<any> {
  const pubkey = new PublicKey(programId);
  const account = await conn.getAccountInfo(pubkey);
  
  if (!account || !account.owner.equals(BPF_LOADER_UPGRADEABLE_ID)) {
    return { upgradeable: false, reason: 'Not an upgradeable program' };
  }
  
  const programData = account.data;
  const upgradeAuthority = new PublicKey(programData.slice(4, 36));
  
  return {
    programId,
    upgradeable: !upgradeAuthority.equals(PublicKey.default),
    upgradeAuthority: upgradeAuthority.equals(PublicKey.default) ? null : upgradeAuthority.toBase58(),
    lamports: account.lamports
  };
}