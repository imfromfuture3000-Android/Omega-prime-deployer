const fs = require('fs');

async function heliusGetAssets() {
  const HELIUS_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjcmVhdGVkQXQiOjE3NTQyNzI3ODcxOTgsImVtYWlsIjoicGF1bHBldGUuY2VyY2VuaWFAZ21haWwuY29tIiwiYWN0aW9uIjoidG9rZW4tYXBpIiwiYXBpVmVyc2lvbiI6InYyIiwiaWF0IjoxNzU0MjcyNzg3fQ.IiNATw4EseqTcEU68-16BHnZHboOVXzjENd2XuJvXqw';
  const authority = '2RtGg6fsFiiF1EQzHqbd66AhW7R5bWeQGpTbv2UMkCdW';
  
  console.log(`🔍 Helius Get Assets By Authority`);
  console.log(`Authority: ${authority}`);
  
  try {
    const response = await fetch(`https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getAssetsByAuthority',
        params: {
          authorityAddress: authority,
          page: 1,
          limit: 100
        }
      })
    });
    
    const data = await response.json();
    
    if (data.result) {
      console.log(`✅ Found ${data.result.total} assets`);
      console.log(`Items: ${data.result.items?.length || 0}`);
      
      const result = {
        timestamp: new Date().toISOString(),
        authority,
        total: data.result.total,
        items: data.result.items || [],
        page: data.result.page
      };
      
      fs.writeFileSync('.cache/helius-assets.json', JSON.stringify(result, null, 2));
      
      if (data.result.items?.length > 0) {
        console.log(`\n📋 Assets:`);
        data.result.items.forEach((item, i) => {
          console.log(`${i + 1}. ${item.id} - ${item.content?.metadata?.name || 'Unknown'}`);
        });
      }
      
      return result;
    } else {
      console.log(`❌ Error: ${data.error?.message || 'Unknown'}`);
      return { error: data.error };
    }
    
  } catch (error) {
    console.error('❌ Failed:', error.message);
    throw error;
  }
}

heliusGetAssets().catch(console.error);