import { Connection, PublicKey } from '@solana/web3.js';

const AGENT_WALLETS = [
  'FPf5gnDYmQDkPiRwybBJxxfKAnyhdwa2D3JDtCMguyrW', // Generated user auth
  'EdFC98d1BBhJkeh7KDq26TwEGLeznhoyYsY6Y8LFY4y6', // Treasury
  'CvQZZ23qYDWF2RUpxYJ8y9K4skmuvYEEjH7fK58jtipQ', // DAO
  '8cRrU1NzNpjL3k2BwjW3VixAcX6VFc29KHr4KZg8cs2Y'  // Relayer
];

const BPF_LOADER_UPGRADEABLE_ID = new PublicKey('BPFLoaderUpgradeab1e11111111111111111111111');

async function scanAgentAuthorities() {
  const conn = new Connection('https://api.mainnet-beta.solana.com');
  const results = [];

  for (const wallet of AGENT_WALLETS) {
    console.log(`Scanning ${wallet}...`);
    
    const accounts = await conn.getProgramAccounts(BPF_LOADER_UPGRADEABLE_ID, {
      filters: [
        { dataSize: 36 },
        { memcmp: { offset: 4, bytes: wallet } }
      ]
    });

    const programs = accounts.map(acc => ({
      programId: acc.pubkey.toBase58(),
      authority: wallet,
      lamports: acc.account.lamports
    }));

    results.push({
      wallet,
      programCount: programs.length,
      programs
    });

    console.log(`Found ${programs.length} programs with authority ${wallet}`);
  }

  console.log('\n=== AGENT AUTHORITY SUMMARY ===');
  results.forEach(r => {
    console.log(`${r.wallet}: ${r.programCount} programs`);
    r.programs.forEach(p => console.log(`  ${p.programId}`));
  });

  return results;
}

scanAgentAuthorities().catch(console.error);