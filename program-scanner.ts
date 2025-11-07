import { Connection, PublicKey } from '@solana/web3.js';

const BPF_LOADER_UPGRADEABLE_ID = new PublicKey('BPFLoaderUpgradeab1e11111111111111111111111');
const BPF_LOADER_ID = new PublicKey('BPFLoader2111111111111111111111111111111111');

const AGENT_WALLETS = [
  'FPf5gnDYmQDkPiRwybBJxxfKAnyhdwa2D3JDtCMguyrW',
  'EdFC98d1BBhJkeh7KDq26TwEGLeznhoyYsY6Y8LFY4y6',
  'CvQZZ23qYDWF2RUpxYJ8y9K4skmuvYEEjH7fK58jtipQ',
  '8cRrU1NzNpjL3k2BwjW3VixAcX6VFc29KHr4KZg8cs2Y'
];

async function scanAllPrograms() {
  const conn = new Connection(process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com');
  
  console.log('🔍 Scanning all programs...\n');

  // Scan upgradeable programs
  const upgradeableAccounts = await conn.getProgramAccounts(BPF_LOADER_UPGRADEABLE_ID, {
    filters: [{ dataSize: 36 }]
  });

  // Scan immutable programs  
  const immutableAccounts = await conn.getProgramAccounts(BPF_LOADER_ID);

  interface ProgramInfo {
    programId: string;
    type: string;
    upgradeAuthority: string | null;
    isUpgradeable: boolean;
    lamports: number;
    isAgentControlled: boolean;
  }

  const results: {
    upgradeable: ProgramInfo[];
    immutable: ProgramInfo[];
    agentControlled: ProgramInfo[];
  } = {
    upgradeable: [],
    immutable: [],
    agentControlled: []
  };

  // Process upgradeable programs
  for (const account of upgradeableAccounts) {
    try {
      const upgradeAuthority = new PublicKey(account.account.data.slice(4, 36));
      const isUpgradeable = !upgradeAuthority.equals(PublicKey.default);
      const authorityStr = isUpgradeable ? upgradeAuthority.toBase58() : null;
      
      const program = {
        programId: account.pubkey.toBase58(),
        type: 'upgradeable',
        upgradeAuthority: authorityStr,
        isUpgradeable,
        lamports: account.account.lamports,
        isAgentControlled: !!(authorityStr && AGENT_WALLETS.includes(authorityStr))
      };

      results.upgradeable.push(program);
      if (program.isAgentControlled) results.agentControlled.push(program);
    } catch (e) {
      // Skip invalid accounts
    }
  }

  // Process immutable programs
  for (const account of immutableAccounts.slice(0, 100)) { // Limit for performance
    results.immutable.push({
      programId: account.pubkey.toBase58(),
      type: 'immutable',
      upgradeAuthority: null,
      isUpgradeable: false,
      lamports: account.account.lamports,
      isAgentControlled: false
    });
  }

  return results;
}

async function main() {
  try {
    const results = await scanAllPrograms();
    
    console.log('📊 PROGRAM SCAN RESULTS\n');
    console.log(`Total Upgradeable: ${results.upgradeable.length}`);
    console.log(`Total Immutable: ${results.immutable.length}`);
    console.log(`Agent Controlled: ${results.agentControlled.length}\n`);

    if (results.agentControlled.length > 0) {
      console.log('🤖 AGENT CONTROLLED PROGRAMS:');
      results.agentControlled.forEach(p => {
        console.log(`${p.programId}`);
        console.log(`  Authority: ${p.upgradeAuthority}`);
        console.log(`  Value: ${(p.lamports / 1e9).toFixed(4)} SOL\n`);
      });
    }

    console.log(`🔧 UPGRADEABLE PROGRAMS (showing first 10):`);
    results.upgradeable.slice(0, 10).forEach(p => {
      console.log(`${p.programId} - ${p.isUpgradeable ? 'UPGRADEABLE' : 'IMMUTABLE'}`);
      if (p.upgradeAuthority) console.log(`  Authority: ${p.upgradeAuthority}`);
    });

  } catch (error: any) {
    console.error('❌ Scan failed:', error.message);
  }
}

main();