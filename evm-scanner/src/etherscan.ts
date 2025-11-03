import { loadEtherscanKey } from '../../token/src/utils/auth';

export async function getContractInfo(address: string, network: string = 'mainnet') {
  const apiKey = loadEtherscanKey();
  const baseUrl = network === 'mainnet' 
    ? 'https://api.etherscan.io/api'
    : `https://api-${network}.etherscan.io/api`;
  
  const url = `${baseUrl}?module=contract&action=getsourcecode&address=${address}&apikey=${apiKey}`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (data.status === '1' && data.result[0]) {
    const contract = data.result[0];
    return {
      address,
      name: contract.ContractName,
      compiler: contract.CompilerVersion,
      isProxy: contract.Proxy === '1',
      implementation: contract.Implementation,
      verified: contract.SourceCode !== ''
    };
  }
  
  throw new Error(`Contract not found or not verified: ${address}`);
}

export async function scanProxyContracts(addresses: string[]) {
  const results = [];
  
  for (const address of addresses) {
    try {
      const info = await getContractInfo(address);
      if (info.isProxy) {
        results.push({
          proxy: address,
          implementation: info.implementation,
          name: info.name,
          upgradeable: true
        });
      }
    } catch (error) {
      console.warn(`Failed to scan ${address}: ${error}`);
    }
  }
  
  return results;
}