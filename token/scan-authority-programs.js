const { Connection, PublicKey } = require('@solana/web3.js');
const fs = require('fs');

async function scanAuthorityPrograms() {
  const conn = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');
  
  const authorityKey = JSON.parse(fs.readFileSync('.cache/new-authority.json'));
  const authority = new PublicKey('7D3C97WF93tvvFhQLgde7rttbUEminWEMMybxvYJjwjU');
  
  console.log(`🔍 Scanning programs for authority: ${authority.toBase58()}`);
  
  try {
    // Get signatures with pagination
    let allSignatures = [];
    let before = null;
    
    for (let i = 0; i < 5; i++) {
      const options = { limit: 1000 };
      if (before) options.before = before;
      
      const signatures = await conn.getSignaturesForAddress(authority, options);
      console.log(`📋 Page ${i + 1}: ${signatures.length} signatures`);
      
      if (signatures.length === 0) break;
      
      allSignatures = allSignatures.concat(signatures);
      before = signatures[signatures.length - 1].signature;
      
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log(`\n📊 Total signatures: ${allSignatures.length}`);
    
    // Get program accounts
    const programs = [];
    
    for (let i = 0; i < Math.min(10, allSignatures.length); i++) {
      const sig = allSignatures[i];
      
      try {
        const tx = await conn.getTransaction(sig.signature, { maxSupportedTransactionVersion: 0 });
        
        if (tx && tx.transaction) {
          const programIds = tx.transaction.message.staticAccountKeys || [];
          
          programIds.forEach(key => {
            const addr = key.toBase58();
            if (!programs.includes(addr)) {
              programs.push(addr);
            }
          });
        }
      } catch (e) {
        console.log(`⚠️ Skip tx ${i}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    const result = {
      timestamp: new Date().toISOString(),
      authority: authority.toBase58(),
      totalSignatures: allSignatures.length,
      programs: programs.slice(0, 20),
      recentSignatures: allSignatures.slice(0, 10).map(s => ({
        signature: s.signature,
        slot: s.slot,
        err: s.err
      }))
    };
    
    fs.writeFileSync('.cache/authority-programs.json', JSON.stringify(result, null, 2));
    
    console.log(`\n✅ Found ${programs.length} programs`);
    console.log(`Programs:`, programs.slice(0, 5));
    
    return result;
    
  } catch (error) {
    console.error('❌ Failed:', error.message);
    throw error;
  }
}

scanAuthorityPrograms().catch(console.error);