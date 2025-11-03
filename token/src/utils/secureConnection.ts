import { Connection } from '@solana/web3.js';
import { loadSecureApiKey } from './auth';

export function createSecureConnection(rpcUrl: string): Connection {
  const apiKey = loadSecureApiKey();
  
  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  };
  
  return new Connection(rpcUrl, {
    commitment: 'confirmed',
    httpHeaders: headers
  });
}