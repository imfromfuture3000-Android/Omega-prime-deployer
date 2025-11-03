const fs = require('fs');

async function heliusCheck() {
  // Use Helius API key from allowlist
  const HELIUS_API_KEY = process.env.HELIUS_API_KEY || 'your-helius-key';
  
  const addresses = [
    '7D3C97WF93tvvFhQLgde7rttbUEminWEMMybxvYJjwjU', // Authority
    '22kXTBd1rrLXhpkKWCiYm33aeg123r3UM1Sts3DD6JW5', // Deployer
    '4eJZVbbsiLAG6EkWvgEYEWKEpdhJPFBYMeJ6DBX98w6a'  // Target
  ];
  
  console.log(`🔍 Helius Account Check`);
  console.log(`API Key: ${HELIUS_API_KEY.slice(0, 8)}...`);
  
  const results = [];
  
  for (const address of addresses) {
    try {
      const response = await fetch(`https://devnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getBalance',
          params: [address]
        })
      });
      
      const data = await response.json();
      
      if (data.result !== undefined) {
        const balance = data.result.value / 1e9;
        console.log(`💰 ${address.slice(0, 8)}...: ${balance} SOL`);
        
        results.push({
          address,
          balance: data.result.value,
          balanceSOL: balance,
          status: 'success'
        });
      } else {
        console.log(`❌ ${address.slice(0, 8)}...: ${data.error?.message || 'Error'}`);
        results.push({
          address,
          error: data.error?.message || 'Unknown error',
          status: 'error'
        });
      }
      
    } catch (error) {
      console.log(`❌ ${address.slice(0, 8)}...: ${error.message}`);
      results.push({
        address,
        error: error.message,
        status: 'error'
      });
    }
  }
  
  const report = {
    timestamp: new Date().toISOString(),
    network: 'devnet',
    rpc: 'helius',
    results
  };
  
  fs.writeFileSync('.cache/helius-check.json', JSON.stringify(report, null, 2));
  
  console.log(`\n📊 Helius Check Complete`);
  return report;
}

heliusCheck().catch(console.error);