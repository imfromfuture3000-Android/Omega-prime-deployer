const { Connection, PublicKey } = require('@solana/web3.js');
const fs = require('fs');

async function publicRpcCheck() {
  const rpcs = [
    'https://api.devnet.solana.com',
    'https://devnet.solana.com',
    'https://rpc.ankr.com/solana_devnet'
  ];
  
  const addresses = [
    '7D3C97WF93tvvFhQLgde7rttbUEminWEMMybxvYJjwjU', // Authority
    '22kXTBd1rrLXhpkKWCiYm33aeg123r3UM1Sts3DD6JW5', // Deployer
    '4eJZVbbsiLAG6EkWvgEYEWKEpdhJPFBYMeJ6DBX98w6a', // Target
    '8ZnQdZS5RCXEUUPFn7cDdZUCwcUa5MHXhspXNQgkmJnZ'  // New key
  ];
  
  console.log(`🔍 Public RPC Check`);
  
  for (const rpcUrl of rpcs) {
    console.log(`\n📡 Testing: ${rpcUrl}`);
    
    try {
      const conn = new Connection(rpcUrl, 'confirmed');
      
      for (const addr of addresses) {
        try {
          const balance = await conn.getBalance(new PublicKey(addr));
          console.log(`  ${addr.slice(0, 8)}...: ${balance / 1e9} SOL`);
        } catch (e) {
          console.log(`  ${addr.slice(0, 8)}...: Error`);
        }
      }
      
      // Try airdrop on first working RPC
      if (rpcUrl === rpcs[0]) {
        try {
          console.log(`\n💰 Attempting airdrop...`);
          const newKey = new PublicKey('8ZnQdZS5RCXEUUPFn7cDdZUCwcUa5MHXhspXNQgkmJnZ');
          const airdropSig = await conn.requestAirdrop(newKey, 0.05 * 1e9);
          await conn.confirmTransaction(airdropSig);
          
          console.log(`✅ Airdrop Success: ${airdropSig}`);
          
          const result = {
            timestamp: new Date().toISOString(),
            rpc: rpcUrl,
            airdrop: airdropSig,
            address: newKey.toBase58()
          };
          
          fs.writeFileSync('.cache/airdrop-success.json', JSON.stringify(result, null, 2));
          return result;
          
        } catch (e) {
          console.log(`❌ Airdrop failed: ${e.message.slice(0, 50)}...`);
        }
      }
      
    } catch (error) {
      console.log(`❌ RPC failed: ${error.message.slice(0, 50)}...`);
    }
  }
  
  console.log(`\n📊 Public RPC Check Complete`);
}

publicRpcCheck().catch(console.error);