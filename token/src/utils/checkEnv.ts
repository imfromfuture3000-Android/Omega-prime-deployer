import { Connection, PublicKey } from '@solana/web3.js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

async function check() {
  const required = ['RPC_URL', 'RELAYER_URL', 'RELAYER_PUBKEY', 'TREASURY_PUBKEY'];
  for (const k of required) if (!process.env[k]) throw new Error(`Missing ${k}`);
  
  new PublicKey(process.env.RELAYER_PUBKEY!);
  new PublicKey(process.env.TREASURY_PUBKEY!);
  if (process.env.DAO_PUBKEY) new PublicKey(process.env.DAO_PUBKEY);
  
  if (!['null', 'dao', 'treasury'].includes(process.env.AUTHORITY_MODE ?? '')) {
    throw new Error('AUTHORITY_MODE must be null|dao|treasury');
  }
  
  if (process.env.AUTHORITY_MODE === 'dao' && !process.env.DAO_PUBKEY) {
    throw new Error('DAO_PUBKEY required when AUTHORITY_MODE=dao');
  }
  
  const conn = new Connection(process.env.RPC_URL!, 'confirmed');
  const start = Date.now();
  await conn.getLatestBlockhash();
  console.log(`RPC OK (${Date.now() - start}ms)`);
  
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (process.env.RELAYER_API_KEY) headers['Authorization'] = `Bearer ${process.env.RELAYER_API_KEY}`;
  
  const rstart = Date.now();
  const health = await fetch(process.env.RELAYER_URL!, { method: 'GET', headers });
  if (health.status !== 200) throw new Error(`Relayer health failed (${health.status})`);
  console.log(`Relayer OK (${Date.now() - rstart}ms)`);
  
  const audit = path.join(__dirname, '../../.cache/audit.json');
  if (!fs.existsSync(audit)) {
    fs.mkdirSync(path.dirname(audit), { recursive: true });
    fs.writeFileSync(audit, '[]');
    console.log('audit log initialized');
  }
}

check().catch(e => {
  console.error(e.message);
  process.exit(1);
});