const fs = require('fs');

async function heliusGenesis() {
  console.log(`🔍 Helius Genesis Hash & Network Info`);
  
  try {
    // Get genesis hash
    const genesisResponse = await fetch('https://devnet.helius-rpc.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getGenesisHash'
      })
    });
    
    const genesisData = await genesisResponse.json();
    
    if (genesisData.result) {
      console.log(`🧬 Genesis Hash: ${genesisData.result}`);
    }
    
    // Get slot info
    const slotResponse = await fetch('https://devnet.helius-rpc.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 2,
        method: 'getSlot'
      })
    });
    
    const slotData = await slotResponse.json();
    
    if (slotData.result) {
      console.log(`📊 Current Slot: ${slotData.result}`);
    }
    
    // Get version
    const versionResponse = await fetch('https://devnet.helius-rpc.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 3,
        method: 'getVersion'
      })
    });
    
    const versionData = await versionResponse.json();
    
    if (versionData.result) {
      console.log(`🔧 Version: ${versionData.result['solana-core']}`);
    }
    
    const networkInfo = {
      timestamp: new Date().toISOString(),
      network: 'devnet',
      rpc: 'helius',
      genesisHash: genesisData.result,
      currentSlot: slotData.result,
      version: versionData.result
    };
    
    fs.writeFileSync('.cache/helius-network-info.json', JSON.stringify(networkInfo, null, 2));
    
    console.log(`\n✅ Network Info Retrieved`);
    return networkInfo;
    
  } catch (error) {
    console.error('❌ Failed:', error.message);
    throw error;
  }
}

heliusGenesis().catch(console.error);