const fs = require('fs');

const AGENT_ID = '4fe39d22-5043-40d3-b2a1-dd8968ecf8a6';
const HELIUS_KEY = '4fe39d22-5043-40d3-b2a1-dd8968ecf8a6';
const authority = '2RtGg6fsFiiF1EQzHqbd66AhW7R5bWeQGpTbv2UMkCdW';

async function agentHeliusQuery() {
  console.log(`🤖 Agent: ${AGENT_ID}`);
  console.log(`🔍 Query Authority: ${authority}`);
  
  try {
    const response = await fetch(`https://mainnet.helius-rpc.com/?api-key=${HELIUS_KEY}`, {
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
      console.log(`✅ Total: ${data.result.total}`);
      console.log(`📋 Items: ${data.result.items?.length || 0}`);
      
      const result = {
        agentId: AGENT_ID,
        timestamp: new Date().toISOString(),
        authority,
        total: data.result.total,
        items: data.result.items || []
      };
      
      fs.writeFileSync('.cache/agent-assets.json', JSON.stringify(result, null, 2));
      
      if (data.result.items?.length > 0) {
        console.log(`\n📦 Assets:`);
        data.result.items.slice(0, 10).forEach((item, i) => {
          console.log(`${i + 1}. ${item.id}`);
        });
      }
      
      return result;
    } else {
      console.log(`❌ ${data.error?.message || 'Error'}`);
      return { error: data.error };
    }
    
  } catch (error) {
    console.error('❌ Failed:', error.message);
    throw error;
  }
}

agentHeliusQuery().catch(console.error);