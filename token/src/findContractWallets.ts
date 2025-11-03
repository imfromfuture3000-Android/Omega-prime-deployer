import { loadMoralisKey } from './utils/auth';

async function getTopWalletsByBalance() {
  const apiKey = loadMoralisKey();
  
  // Get top wallets by ETH balance
  const response = await fetch('https://deep-index.moralis.io/api/v2.2/wallets/top', {
    headers: {
      'X-API-Key': apiKey,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }
  
  return await response.json();
}

async function getWalletTokens(address: string) {
  const apiKey = loadMoralisKey();
  
  const response = await fetch(`https://deep-index.moralis.io/api/v2.2/wallets/${address}/tokens?limit=10`, {
    headers: {
      'X-API-Key': apiKey
    }
  });
  
  if (response.ok) {
    return await response.json();
  }
  return null;
}

async function isContract(address: string) {
  const apiKey = loadMoralisKey();
  
  const response = await fetch(`https://deep-index.moralis.io/api/v2.2/${address}`, {
    headers: {
      'X-API-Key': apiKey
    }
  });
  
  if (response.ok) {
    const data = await response.json();
    return data.is_contract || false;
  }
  return false;
}

const KNOWN_CONTRACT_WALLETS = [
  '0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD', // Uniswap Universal Router
  '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45', // Uniswap V3 Router 2
  '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', // Uniswap V2 Router
  '0x1111111254EEB25477B68fb85Ed929f73A960582', // 1inch Router
  '0xdef1c0ded9bec7f1a1670819833240f027b25eff', // 0x Protocol
  '0x881D40237659C251811CEC9c364ef91dC08D300C', // Metamask Swap Router
  '0x74de5d4FCbf63E00296fd95d33236B9794016631', // Curve Router
  '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F', // SushiSwap Router
  '0x11111112542D85B3EF69AE05771c2dCCff4fAa26', // 1inch V4 Router
  '0x6131B5fae19EA4f9D964eAc0408E4408b66337b5', // Kyber Network
  '0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24', // BasedAI Treasury
  '0x28C6c06298d514Db089934071355E5743bf21d60', // Binance Hot Wallet
  '0x21a31Ee1afC51d94C2eFcCAa2092aD1028285549', // Binance Cold Wallet
  '0xdfd5293d8e347dfe59e90efd55b2956a1343963d', // Binance Wallet
  '0x564286362092D8e7936f0549571a803B203aAceD', // Binance Wallet 2
  '0x0681d8Db095565FE8A346fA0277bFfdE9C0eDBBF', // Crypto.com Wallet
  '0x72A53cDBBcc1b9efa39c834A540550e23463AAcB', // Crypto.com Cold
  '0x46340b20830761efd32832A74d7169B29FEB9758', // Crypto.com Hot
  '0x6cc5f688a315f3dc28a7781717a9a798a59fda7b', // OKEx Wallet
  '0x236928edd60a68808c2b59d76f50b83d2f84bb2a'  // Kraken Wallet
];

async function main() {
  console.log('=== TOP 20 CONTRACT WALLETS WITH ASSETS ===\n');
  
  let found = 0;
  
  for (const address of KNOWN_CONTRACT_WALLETS) {
    if (found >= 20) break;
    
    try {
      console.log(`Scanning ${address}...`);
      
      const tokens = await getWalletTokens(address);
      
      if (tokens && tokens.result && tokens.result.length > 0) {
        found++;
        
        console.log(`\n${found}. ${address}`);
        console.log(`   Total tokens: ${tokens.result.length}`);
        console.log(`   Top assets:`);
        
        tokens.result.slice(0, 3).forEach((token: any, i: number) => {
          const balance = token.balance_formatted || (parseFloat(token.balance) / Math.pow(10, token.decimals || 18)).toFixed(4);
          console.log(`     ${i + 1}. ${token.name || token.symbol}: ${balance}`);
        });
        
        console.log('');
      }
      
      // Rate limiting
      await new Promise(r => setTimeout(r, 200));
      
    } catch (error) {
      console.log(`   Error: ${error}`);
    }
  }
  
  console.log(`\nFound ${found} contract wallets with available assets.`);
}

main().catch(console.error);