const fs = require('fs');

async function heliusWorkingCheck() {
  // Use working Helius endpoint from your example
  const addresses = [
    '7D3C97WF93tvvFhQLgde7rttbUEminWEMMybxvYJjwjU', // Authority
    '22kXTBd1rrLXhpkKWCiYm33aeg123r3UM1Sts3DD6JW5', // Deployer
    '4eJZVbbsiLAG6EkWvgEYEWKEpdhJPFBYMeJ6DBX98w6a'  // Target
  ];
  
  console.log(`🔍 Helius Working Check`);
  
  const results = [];
  
  for (const address of addresses) {
    try {
      // Use the same endpoint that worked in your example
      const response = await fetch('https://devnet.helius-rpc.com', {
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
          balanceSOL: balance
        });
      } else {
        console.log(`❌ ${address.slice(0, 8)}...: ${data.error?.message || 'Error'}`);
      }
      
    } catch (error) {
      console.log(`❌ ${address.slice(0, 8)}...: ${error.message}`);
    }
  }
  
  fs.writeFileSync('.cache/helius-working-check.json', JSON.stringify(results, null, 2));
  
  console.log(`\n📊 Helius Working Check Complete`);
  return results;
}

heliusWorkingCheck().catch(console.error);