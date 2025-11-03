import * as fs from 'fs';
import * as path from 'path';
import { findMetadataPda, findAssociatedTokenAddress } from './utils/pdas';
import { Connection, PublicKey } from '@solana/web3.js';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
  const cacheDir = path.join(__dirname, '../.cache');
  const mintFile = path.join(cacheDir, 'mint.json');
  const authFile = path.join(cacheDir, 'user_auth.json');
  const auditFile = path.join(cacheDir, 'audit.json');
  
  if (fs.existsSync(mintFile)) {
    const mint = new PublicKey(JSON.parse(fs.readFileSync(mintFile, 'utf-8')).mint);
    const conn = new Connection(process.env.RPC_URL!, 'confirmed');
    const meta = findMetadataPda(mint);
    const ata = findAssociatedTokenAddress(new PublicKey(process.env.TREASURY_PUBKEY!), mint);
    
    console.log(`On-chain objects cannot be deleted. Local cache will be cleared.`);
    fs.unlinkSync(mintFile);
    console.log('mint cache removed');
  }
  
  if (fs.existsSync(authFile)) { fs.unlinkSync(authFile); console.log('user_auth removed'); }
  if (fs.existsSync(auditFile)) { fs.unlinkSync(auditFile); console.log('audit log removed'); }
  
  console.log('Rollback complete – run `npm run mainnet:all` to redeploy');
}

main().catch(e => console.error(e.message));