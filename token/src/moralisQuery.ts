import { loadMoralisKey } from './utils/auth';

async function queryMoralis(query: string) {
  const apiKey = loadMoralisKey();
  
  // Moralis Web3 Data API endpoint
  const response = await fetch('https://deep-index.moralis.io/api/v2.2/wallets/0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045/tokens', {
    headers: {
      'X-API-Key': apiKey,
      'Content-Type': 'application/json'
    }
  });
  
  const data = await response.json();
  return data;
}

async function getWalletTokens(address: string) {
  const apiKey = loadMoralisKey();
  
  const response = await fetch(`https://deep-index.moralis.io/api/v2.2/wallets/${address}/tokens`, {
    headers: {
      'X-API-Key': apiKey
    }
  });
  
  return await response.json();
}

async function main() {
  console.log('=== MORALIS CORTEX TEST ===\n');
  
  try {
    // Test with vitalik.eth address
    const vitalikAddress = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
    const tokens = await getWalletTokens(vitalikAddress);
    
    console.log(`Tokens for ${vitalikAddress}:`);
    console.log(`Total tokens: ${tokens.result?.length || 0}`);
    
    if (tokens.result) {
      tokens.result.slice(0, 5).forEach((token: any) => {
        console.log(`- ${token.name} (${token.symbol}): ${token.balance_formatted || token.balance}`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

main().catch(console.error);