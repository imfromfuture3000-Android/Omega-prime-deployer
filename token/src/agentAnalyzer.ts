import { Connection, PublicKey } from '@solana/web3.js';

const AGENT_WALLETS = [
  'FPf5gnDYmQDkPiRwybBJxxfKAnyhdwa2D3JDtCMguyrW', // Generated user auth
  'EdFC98d1BBhJkeh7KDq26TwEGLeznhoyYsY6Y8LFY4y6', // Treasury
  'CvQZZ23qYDWF2RUpxYJ8y9K4skmuvYEEjH7fK58jtipQ', // DAO
  '8cRrU1NzNpjL3k2BwjW3VixAcX6VFc29KHr4KZg8cs2Y'  // Relayer
];

const BPF_LOADER_UPGRADEABLE_ID = new PublicKey('BPFLoaderUpgradeab1e11111111111111111111111');

async function main() {
  const conn = new Connection('https://api.mainnet-beta.solana.com');
  
  console.log('=== AGENT COPILOT AUTHORITY SCAN ===\n');
  
  let totalPrograms = 0;
  let totalValue = 0;
  
  for (const wallet of AGENT_WALLETS) {
    console.log(`Scanning ${wallet}...`);
    
    try {
      const accounts = await conn.getProgramAccounts(BPF_LOADER_UPGRADEABLE_ID, {
        filters: [
          { dataSize: 36 },
          { memcmp: { offset: 4, bytes: wallet } }
        ]
      });

      const programCount = accounts.length;
      const walletValue = accounts.reduce((sum, acc) => sum + acc.account.lamports, 0);
      
      totalPrograms += programCount;
      totalValue += walletValue;
      
      console.log(`  Programs: ${programCount}`);
      console.log(`  Value: ${(walletValue / 1e9).toFixed(4)} SOL`);
      
      if (programCount > 0) {
        console.log('  CONTROLLED PROGRAMS:');
        accounts.forEach(acc => {
          console.log(`    ${acc.pubkey.toBase58()} (${(acc.account.lamports / 1e9).toFixed(4)} SOL)`);
        });
      }
      console.log('');
      
    } catch (error) {
      console.log(`  ERROR: ${error}`);
    }
  }
  
  console.log('=== SUMMARY ===');
  console.log(`Total Programs Under Agent Control: ${totalPrograms}`);
  console.log(`Total Value: ${(totalValue / 1e9).toFixed(4)} SOL`);
  console.log(`Risk Level: ${totalPrograms > 0 ? 'HIGH' : 'LOW'}`);
}

main().catch(console.error);