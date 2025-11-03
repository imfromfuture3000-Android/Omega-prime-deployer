const fs = require('fs');

async function heliusDasApi() {
  const authority = '2RtGg6fsFiiF1EQzHqbd66AhW7R5bWeQGpTbv2UMkCdW';
  
  console.log(`🔍 Helius DAS API - Get Assets By Authority`);
  console.log(`Authority: ${authority}`);
  
  try {
    const response = await fetch('https://mainnet.helius-rpc.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getAssetsByAuthority',
        params: {
          authorityAddress: authority,
          page: 1
        }
      })
    });
    
    const data = await response.json();
    
    console.log(`Response:`, JSON.stringify(data, null, 2));
    
    if (data.result) {
      const result = {
        timestamp: new Date().toISOString(),
        authority,
        total: data.result.total || 0,
        items: data.result.items || []
      };
      
      fs.writeFileSync('.cache/helius-das-result.json', JSON.stringify(result, null, 2));
      
      console.log(`\n✅ Total: ${result.total}`);
      
      return result;
    } else {
      console.log(`Error: ${data.error?.message}`);
      return { error: data.error };
    }
    
  } catch (error) {
    console.error('❌ Failed:', error.message);
    throw error;
  }
}

heliusDasApi().catch(console.error);