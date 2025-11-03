import { Connection, PublicKey } from '@solana/web3.js';
import * as fs from 'fs';
import * as path from 'path';

const OUR_WALLETS = [
  'FPf5gnDYmQDkPiRwybBJxxfKAnyhdwa2D3JDtCMguyrW', // Generated user auth
  'EdFC98d1BBhJkeh7KDq26TwEGLeznhoyYsY6Y8LFY4y6', // Treasury
  'CvQZZ23qYDWF2RUpxYJ8y9K4skmuvYEEjH7fK58jtipQ', // DAO
  '8cRrU1NzNpjL3k2BwjW3VixAcX6VFc29KHr4KZg8cs2Y'  // Relayer
];

const BPF_LOADER_UPGRADEABLE_ID = new PublicKey('BPFLoaderUpgradeab1e11111111111111111111111');

async function scanCacheForContracts() {
  const cacheDir = path.join(__dirname, '../.cache');
  const contracts = [];
  
  if (fs.existsSync(cacheDir)) {
    const files = fs.readdirSync(cacheDir);
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          const content = JSON.parse(fs.readFileSync(path.join(cacheDir, file), 'utf-8'));
          
          if (content.mint) {
            contracts.push({
              type: 'SPL_TOKEN',
              address: content.mint,
              source: file
            });
          }
          
          if (content.programId) {
            contracts.push({
              type: 'PROGRAM',
              address: content.programId,
              source: file
            });
          }
          
        } catch (e) {
          // Skip invalid JSON
        }
      }
    }
  }
  
  return contracts;
}

async function checkProgramAuthorities() {
  const conn = new Connection('https://api.mainnet-beta.solana.com');
  const results = [];
  
  for (const wallet of OUR_WALLETS) {
    console.log(`Checking authorities for ${wallet}...`);
    
    try {
      const accounts = await conn.getProgramAccounts(BPF_LOADER_UPGRADEABLE_ID, {
        filters: [
          { dataSize: 36 },
          { memcmp: { offset: 4, bytes: wallet } }
        ]
      });
      
      for (const account of accounts) {
        results.push({
          programId: account.pubkey.toBase58(),
          authority: wallet,
          lamports: account.account.lamports,
          type: 'UPGRADEABLE_PROGRAM'
        });
      }
      
    } catch (error) {
      console.log(`Error scanning ${wallet}: ${error}`);
    }
  }
  
  return results;
}

async function checkTokenAuthorities() {
  const conn = new Connection('https://api.mainnet-beta.solana.com');
  const cacheContracts = await scanCacheForContracts();
  const results = [];
  
  for (const contract of cacheContracts) {
    if (contract.type === 'SPL_TOKEN') {
      try {
        const mint = new PublicKey(contract.address);
        const supply = await conn.getTokenSupply(mint);
        const accountInfo = await conn.getAccountInfo(mint);
        
        results.push({
          mint: contract.address,
          mintAuthority: 'CHECK_MANUALLY',
          freezeAuthority: 'CHECK_MANUALLY', 
          supply: supply.value.amount,
          decimals: supply.value.decimals,
          source: contract.source,
          exists: !!accountInfo
        });
        
      } catch (error) {
        console.log(`Error checking token ${contract.address}: ${error}`);
      }
    }
  }
  
  return results;
}

async function main() {
  console.log('=== OUR CONTROLLED CONTRACTS SCAN ===\n');
  
  // Check cache for deployed contracts
  const cacheContracts = await scanCacheForContracts();
  console.log('CACHED CONTRACTS:');
  cacheContracts.forEach(c => {
    console.log(`${c.type}: ${c.address} (from ${c.source})`);
  });
  console.log('');
  
  // Check program authorities
  console.log('PROGRAM AUTHORITIES:');
  const programAuthorities = await checkProgramAuthorities();
  if (programAuthorities.length === 0) {
    console.log('No programs found with our wallet authorities');
  } else {
    programAuthorities.forEach(p => {
      console.log(`${p.programId} - Authority: ${p.authority} (${(p.lamports / 1e9).toFixed(4)} SOL)`);
    });
  }
  console.log('');
  
  // Check token authorities
  console.log('TOKEN AUTHORITIES:');
  const tokenAuthorities = await checkTokenAuthorities();
  if (tokenAuthorities.length === 0) {
    console.log('No tokens found in cache');
  } else {
    tokenAuthorities.forEach(t => {
      console.log(`${t.mint}:`);
      console.log(`  Mint Authority: ${t.mintAuthority || 'REVOKED'}`);
      console.log(`  Freeze Authority: ${t.freezeAuthority || 'REVOKED'}`);
      console.log(`  Supply: ${t.supply} (${t.decimals} decimals)`);
      console.log(`  Source: ${t.source}`);
    });
  }
  
  console.log('\n=== SUMMARY ===');
  console.log(`Cached Contracts: ${cacheContracts.length}`);
  console.log(`Program Authorities: ${programAuthorities.length}`);
  console.log(`Token Authorities: ${tokenAuthorities.length}`);
  
  const controlledAssets = programAuthorities.length + tokenAuthorities.filter(t => 
    t.mintAuthority && OUR_WALLETS.includes(t.mintAuthority)
  ).length;
  
  console.log(`Total Controlled Assets: ${controlledAssets}`);
  console.log(`Risk Level: ${controlledAssets > 0 ? 'MEDIUM' : 'LOW'}`);
}

main().catch(console.error);