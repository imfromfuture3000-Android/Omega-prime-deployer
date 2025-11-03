import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { loadOrCreateUserAuth } from './utils/wallet';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
  const conn = new Connection(process.env.RPC_URL!, 'confirmed');
  const user = loadOrCreateUserAuth();
  
  console.log(`Requesting airdrop for ${user.publicKey.toBase58()}`);
  
  const signature = await conn.requestAirdrop(user.publicKey, 2 * LAMPORTS_PER_SOL);
  await conn.confirmTransaction(signature);
  
  const balance = await conn.getBalance(user.publicKey);
  console.log(`Balance: ${balance / LAMPORTS_PER_SOL} SOL`);
}

main().catch(console.error);