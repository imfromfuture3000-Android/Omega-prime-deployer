import { Connection, PublicKey } from '@solana/web3.js';

const CORE_PROGRAMS = {
  STAKE_PROGRAM: 'Stake11111111111111111111111111111111111111',
  TOKEN_PROGRAM: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
  ASSOCIATED_TOKEN: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
  METADATA_PROGRAM: 'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s',
  JUPITER_PROGRAM: 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4'
};

const DEPLOYER_GENE_CONTRACTS = [
  '3i62KXuWERyTZJ5HbE7HNbhvBAhEdMjMjLQk3m39PpN4', // Primary Mint
  '4eJZVbbsiLAG6EkWvgEYEWKEpdhJPFBYMeJ6DBX98w6a', // Deployer
  'EdFC98d1BBhJkeh7KDq26TwEGLeznhoyYsY6Y8LFY4y6', // Treasury
  'CvQZZ23qYDWF2RUpxYJ8y9K4skmuvYEEjH7fK58jtipQ', // DAO
  '8cRrU1NzNpjL3k2BwjW3VixAcX6VFc29KHr4KZg8cs2Y', // Relayer
  'FPf5gnDYmQDkPiRwybBJxxfKAnyhdwa2D3JDtCMguyrW', // Generated Auth
  'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA', // Token Program
  'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s', // Metadata Program
  'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4', // Jupiter Program
  'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL'  // Associated Token
];

async function checkReannounceReadiness() {
  console.log('=== SOLANA CORE PROGRAM PDA SCAN ===\n');
  console.log('Scanning 10 contract addresses for reannounce readiness...\n');
  
  const conn = new Connection('https://api.mainnet-beta.solana.com');
  const readyContracts = [];
  
  for (let i = 0; i < 10; i++) {
    const address = DEPLOYER_GENE_CONTRACTS[i];
    console.log(`${i + 1}. Checking ${address}...`);
    
    try {
      const pubkey = new PublicKey(address);
      const accountInfo = await conn.getAccountInfo(pubkey);
      
      if (accountInfo) {
        const isProgram = accountInfo.owner.toBase58() === 'BPFLoaderUpgradeab1e11111111111111111111111';
        const isToken = accountInfo.owner.toBase58() === 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
        
        readyContracts.push({
          address,
          owner: accountInfo.owner.toBase58(),
          lamports: accountInfo.lamports,
          dataLength: accountInfo.data.length,
          type: isProgram ? 'PROGRAM' : isToken ? 'TOKEN' : 'ACCOUNT',
          ready: true
        });
        
        console.log(`   ✅ READY - ${isProgram ? 'PROGRAM' : isToken ? 'TOKEN' : 'ACCOUNT'}`);
        console.log(`   Balance: ${(accountInfo.lamports / 1e9).toFixed(4)} SOL`);
        
      } else {
        readyContracts.push({
          address,
          ready: false,
          reason: 'Account not found'
        });
        console.log(`   ❌ NOT FOUND`);
      }
      
    } catch (error) {
      readyContracts.push({
        address,
        ready: false,
        reason: String(error)
      });
      console.log(`   ❌ ERROR: ${error}`);
    }
    console.log('');
  }
  
  return readyContracts;
}

async function generatePDAAddresses() {
  console.log('=== CORE PROGRAM PDA GENERATION ===\n');
  
  const pdaResults = [];
  
  for (const [name, programId] of Object.entries(CORE_PROGRAMS)) {
    console.log(`Generating PDAs for ${name}:`);
    
    try {
      const program = new PublicKey(programId);
      const pdas = [];
      
      // Common PDA seeds
      const seeds = ['metadata', 'authority', 'config', 'state', 'vault'];
      
      for (const seed of seeds) {
        try {
          const [pda] = PublicKey.findProgramAddressSync(
            [Buffer.from(seed)],
            program
          );
          pdas.push({
            seed,
            address: pda.toBase58()
          });
          console.log(`   ${seed}: ${pda.toBase58()}`);
        } catch (e) {
          // Skip invalid PDAs
        }
      }
      
      pdaResults.push({
        program: name,
        programId,
        pdas
      });
      
    } catch (error) {
      console.log(`   Error: ${error}`);
    }
    console.log('');
  }
  
  return pdaResults;
}

async function main() {
  const reannounceResults = await checkReannounceReadiness();
  const pdaResults = await generatePDAAddresses();
  
  console.log('=== REANNOUNCE READINESS SUMMARY ===');
  const readyCount = reannounceResults.filter(r => r.ready).length;
  console.log(`Ready Contracts: ${readyCount}/10`);
  console.log(`Programs: ${reannounceResults.filter(r => r.ready && r.type === 'PROGRAM').length}`);
  console.log(`Tokens: ${reannounceResults.filter(r => r.ready && r.type === 'TOKEN').length}`);
  console.log(`Accounts: ${reannounceResults.filter(r => r.ready && r.type === 'ACCOUNT').length}`);
  
  console.log('\n=== PDA SUMMARY ===');
  console.log(`Core Programs: ${Object.keys(CORE_PROGRAMS).length}`);
  console.log(`Generated PDAs: ${pdaResults.reduce((sum, p) => sum + p.pdas.length, 0)}`);
  
  console.log('\n=== REANNOUNCE STATUS ===');
  console.log(`Status: ${readyCount >= 8 ? '✅ READY FOR REANNOUNCE' : '❌ NOT READY'}`);
  console.log(`Recommendation: ${readyCount >= 8 ? 'Proceed with reannouncement' : 'Fix missing contracts first'}`);
}

main().catch(console.error);