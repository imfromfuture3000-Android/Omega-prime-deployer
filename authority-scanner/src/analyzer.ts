import { Connection, PublicKey } from '@solana/web3.js';

const KNOWN_PATTERNS = {
  'imfromfuture3000': /future|3000|agent|copilot/i,
  'paulpete': /paul|pete|cercenia/i,
  'omega': /omega|prime|nexus/i
};

async function analyzeWalletAuthorities(walletAddress: string) {
  const conn = new Connection('https://api.mainnet-beta.solana.com');
  const BPF_LOADER_UPGRADEABLE_ID = new PublicKey('BPFLoaderUpgradeab1e11111111111111111111111');
  
  try {
    const accounts = await conn.getProgramAccounts(BPF_LOADER_UPGRADEABLE_ID, {
      filters: [
        { dataSize: 36 },
        { memcmp: { offset: 4, bytes: walletAddress } }
      ]
    });

    const analysis = {
      wallet: walletAddress,
      totalPrograms: accounts.length,
      totalValue: accounts.reduce((sum, acc) => sum + acc.account.lamports, 0),
      programs: accounts.map(acc => ({
        programId: acc.pubkey.toBase58(),
        lamports: acc.account.lamports,
        riskLevel: 'HIGH' // All upgradeable programs are high risk
      }))
    };

    return analysis;
  } catch (error) {
    return { wallet: walletAddress, error: error.message };
  }
}

async function scanAllAgentWallets() {
  const wallets = [
    'FPf5gnDYmQDkPiRwybBJxxfKAnyhdwa2D3JDtCMguyrW',
    'EdFC98d1BBhJkeh7KDq26TwEGLeznhoyYsY6Y8LFY4y6', 
    'CvQZZ23qYDWF2RUpxYJ8y9K4skmuvYEEjH7fK58jtipQ',
    '8cRrU1NzNpjL3k2BwjW3VixAcX6VFc29KHr4KZg8cs2Y'
  ];

  console.log('=== AGENT COPILOT AUTHORITY ANALYSIS ===\n');
  
  for (const wallet of wallets) {
    const analysis = await analyzeWalletAuthorities(wallet);
    
    if (analysis.error) {
      console.log(`${wallet}: ERROR - ${analysis.error}`);
      continue;
    }

    console.log(`WALLET: ${wallet}`);
    console.log(`Programs: ${analysis.totalPrograms}`);
    console.log(`Total Value: ${(analysis.totalValue / 1e9).toFixed(4)} SOL`);
    
    if (analysis.programs.length > 0) {
      console.log('CONTROLLED PROGRAMS:');
      analysis.programs.forEach(p => {
        console.log(`  ${p.programId} (${(p.lamports / 1e9).toFixed(4)} SOL) - ${p.riskLevel} RISK`);
      });
    }
    console.log('');
  }
}

scanAllAgentWallets().catch(console.error);