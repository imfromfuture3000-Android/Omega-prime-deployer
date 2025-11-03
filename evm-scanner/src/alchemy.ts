import { loadAlchemyKey } from '../../token/src/utils/auth';

export async function getContractMetadata(address: string, network: string = 'eth-mainnet') {
  const apiKey = loadAlchemyKey();
  const url = `https://${network}.g.alchemy.com/v2/${apiKey}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: 1,
      jsonrpc: '2.0',
      method: 'alchemy_getTokenMetadata',
      params: [address]
    })
  });
  
  const data = await response.json();
  return data.result;
}

export async function isContractUpgradeable(address: string, network: string = 'eth-mainnet') {
  const apiKey = loadAlchemyKey();
  const url = `https://${network}.g.alchemy.com/v2/${apiKey}`;
  
  // Check for proxy patterns
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: 1,
      jsonrpc: '2.0',
      method: 'eth_getStorageAt',
      params: [address, '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc', 'latest']
    })
  });
  
  const data = await response.json();
  const implementationSlot = data.result;
  
  return {
    address,
    isProxy: implementationSlot !== '0x0000000000000000000000000000000000000000000000000000000000000000',
    implementation: implementationSlot !== '0x0000000000000000000000000000000000000000000000000000000000000000' 
      ? '0x' + implementationSlot.slice(-40) : null
  };
}