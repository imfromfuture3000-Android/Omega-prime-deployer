import { loadEtherscanKey } from './utils/auth';

async function getContractInfo(address: string) {
  const apiKey = loadEtherscanKey();
  const url = `https://api.etherscan.io/api?module=contract&action=getsourcecode&address=${address}&apikey=${apiKey}`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  return {
    address,
    status: data.status,
    result: data.result?.[0] || null,
    raw: data
  };
}

async function main() {
  // Real verified contracts
  const contracts = [
    '0xdAC17F958D2ee523a2206206994597C13D831ec7', // USDT
    '0xA0b86a33E6441E13C7d3fF4E4b1f3d3e5e5e5e5e', // USDC  
    '0x6B175474E89094C44Da98b954EedeAC495271d0F'  // DAI
  ];
  
  console.log('=== CONTRACT INFO ===\n');
  
  for (const address of contracts) {
    try {
      const info = await getContractInfo(address);
      
      console.log(`${address}:`);
      console.log(`Status: ${info.status}`);
      
      if (info.result) {
        console.log(`Name: ${info.result.ContractName || 'Unknown'}`);
        console.log(`Verified: ${info.result.SourceCode ? 'Yes' : 'No'}`);
        console.log(`Proxy: ${info.result.Proxy === '1' ? 'Yes' : 'No'}`);
        if (info.result.Implementation) {
          console.log(`Implementation: ${info.result.Implementation}`);
        }
      } else {
        console.log('No contract data found');
      }
      
      console.log('');
      
    } catch (error) {
      console.log(`${address}: Error - ${error}`);
      console.log('');
    }
  }
}

main().catch(console.error);