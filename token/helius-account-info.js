const { Connection, PublicKey } = require('@solana/web3.js');
const fs = require('fs');

async function heliusAccountInfo() {
  const HELIUS_API_KEY = process.env.HELIUS_API_KEY || 'demo';
  const conn = new Connection(`https://devnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`, 'confirmed');
  
  const addresses = [
    '7D3C97WF93tvvFhQLgde7rttbUEminWEMMybxvYJjwjU', // Authority
    '22kXTBd1rrLXhpkKWCiYm33aeg123r3UM1Sts3DD6JW5', // Deployer
    '4eJZVbbsiLAG6EkWvgEYEWKEpdhJPFBYMeJ6DBX98w6a', // Target
    '8ZnQdZS5RCXEUUPFn7cDdZUCwcUa5MHXhspXNQgkmJnZ'  // New key
  ];
  
  console.log(`🔍 Helius Account Info Check`);
  
  const results = [];
  
  for (const addr of addresses) {
    try {
      const pubkey = new PublicKey(addr);
      const balance = await conn.getBalance(pubkey);
      const accountInfo = await conn.getAccountInfo(pubkey);
      
      console.log(`📋 ${addr}: ${balance / 1e9} SOL`);
      
      results.push({
        address: addr,
        balance: balance,
        balanceSOL: balance / 1e9,
        exists: accountInfo !== null,
        owner: accountInfo?.owner?.toBase58() || null
      });
      
    } catch (error) {
      console.log(`❌ ${addr}: Error - ${error.message}`);
      results.push({
        address: addr,
        error: error.message
      });
    }
  }
  
  // Try airdrop with Helius
  const newKey = new PublicKey('8ZnQdZS5RCXEUUPFn7cDdZUCwcUa5MHXhspXNQgkmJnZ');
  
  try {
    console.log(`\n💰 Attempting Helius airdrop...`);
    const airdropSig = await conn.requestAirdrop(newKey, 0.1 * 1e9);
    await conn.confirmTransaction(airdropSig);
    
    console.log(`✅ Helius Airdrop: ${airdropSig}`);
    
    const newBalance = await conn.getBalance(newKey);
    console.log(`💰 New Balance: ${newBalance / 1e9} SOL`);
    
    results.push({
      type: 'airdrop',
      signature: airdropSig,
      newBalance: newBalance
    });
    
  } catch (error) {
    console.log(`❌ Helius airdrop failed: ${error.message}`);
  }
  
  const report = {
    timestamp: new Date().toISOString(),
    rpc: 'helius-devnet',
    results
  };
  
  fs.writeFileSync('.cache/helius-account-info.json', JSON.stringify(report, null, 2));
  
  console.log(`\n📊 Helius Check Complete`);
  return report;
}

heliusAccountInfo().catch(console.error);