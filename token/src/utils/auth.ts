import * as fs from 'fs';
import * as path from 'path';

export function loadSecureApiKey(keyName: string = 'SOLANA_API_KEY'): string {
  const secureEnvPath = path.join(__dirname, '../../.env.secure');
  
  if (!fs.existsSync(secureEnvPath)) {
    throw new Error('Secure environment file not found');
  }
  
  const content = fs.readFileSync(secureEnvPath, 'utf-8');
  const match = content.match(new RegExp(`${keyName}=(.+)`));
  
  if (!match) {
    throw new Error(`${keyName} not found in secure file`);
  }
  
  return match[1].trim();
}

export function loadAlchemyKey(): string {
  return loadSecureApiKey('ALCHEMY_API_KEY');
}

export function loadEtherscanKey(): string {
  return loadSecureApiKey('ETHERSCAN_API_KEY');
}

export function loadMoralisKey(): string {
  return loadSecureApiKey('MORALIS_API_KEY');
}