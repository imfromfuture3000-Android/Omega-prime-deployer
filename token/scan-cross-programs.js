const { Connection, PublicKey } = require('@solana/web3.js');
const fs = require('fs');

async function scanCrossPrograms() {
  const conn = new Connection('https://api.devnet.solana.com', 'confirmed');
  
  // Load current authority
  const authorityKey = JSON.parse(fs.readFileSync('.cache/new-authority.json'));
  const authority = new PublicKey('7D3C97WF93tvvFhQLgde7rttbUEminWEMMybxvYJjwjU');
  
  console.log(`🔍 Scanning cross-programs for: ${authority.toBase58()}`);
  
  try {
    // Get all accounts owned by authority
    const accounts = await conn.getProgramAccounts(new PublicKey('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb'), {
      filters: [
        { memcmp: { offset: 4, bytes: authority.toBase58() } }
      ]
    });
    
    console.log(`📋 Found ${accounts.length} token accounts`);
    
    const crossPrograms = [];
    
    for (const account of accounts.slice(0, 5)) {
      const balance = await conn.getBalance(account.pubkey);
      
      if (balance > 0) {
        console.log(`💰 ${account.pubkey.toBase58()}: ${balance / 1e9} SOL`);
        
        crossPrograms.push({
          address: account.pubkey.toBase58(),
          balance: balance,
          balanceSOL: balance / 1e9,
          type: 'token_account'
        });
      }
    }
    
    // Check authority balance
    const authorityBalance = await conn.getBalance(authority);
    console.log(`🔑 Authority: ${authorityBalance / 1e9} SOL`);
    
    // Scan for related programs
    const relatedPrograms = [
      'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb',
      'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
      '11111111111111111111111111111111'
    ];
    
    const scan = {
      timestamp: new Date().toISOString(),
      authority: authority.toBase58(),
      authorityBalance: authorityBalance,
      crossPrograms,
      relatedPrograms,
      totalAccounts: accounts.length,
      fundedAccounts: crossPrograms.length
    };
    
    fs.writeFileSync('.cache/cross-program-scan.json', JSON.stringify(scan, null, 2));
    
    console.log(`\n📊 Cross-Program Scan Complete`);
    console.log(`Total Accounts: ${accounts.length}`);
    console.log(`Funded Accounts: ${crossPrograms.length}`);
    
    return scan;
    
  } catch (error) {
    console.error('❌ Scan failed:', error.message);
    throw error;
  }
}

scanCrossPrograms().catch(console.error);