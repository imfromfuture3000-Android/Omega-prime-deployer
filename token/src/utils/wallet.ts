import { Keypair } from '@solana/web3.js';
import * as fs from 'fs';
import * as path from 'path';

export function loadOrCreateUserAuth(): Keypair {
  const dir = path.join(__dirname, '../../.cache');
  const file = path.join(dir, 'user_auth.json');
  
  if (fs.existsSync(file)) {
    const arr = JSON.parse(fs.readFileSync(file, 'utf-8'));
    return Keypair.fromSecretKey(Uint8Array.from(arr));
  }
  
  const kp = Keypair.generate();
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(file, JSON.stringify(Array.from(kp.secretKey)));
  console.log(`Generated USER_AUTH: ${kp.publicKey.toBase58()}`);
  return kp;
}