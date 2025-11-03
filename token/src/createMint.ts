import { Connection, Keypair, PublicKey, Transaction, SystemProgram, sendAndConfirmTransaction } from '@solana/web3.js';
import { createInitializeMintInstruction, getMintLen, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
  const conn = new Connection(process.env.RPC_URL!, 'confirmed');
  const user = JSON.parse(fs.readFileSync(path.join(__dirname, '../.cache/user_auth.json'), 'utf-8'));
  const userKp = Keypair.fromSecretKey(Uint8Array.from(user));
  
  const cache = path.join(__dirname, '../.cache/mint.json');
  if (fs.existsSync(cache)) {
    const mint = new PublicKey(JSON.parse(fs.readFileSync(cache, 'utf-8')).mint);
    const info = await conn.getAccountInfo(mint);
    if (info) {
      console.log(`Mint already exists: ${mint.toBase58()}`);
      return;
    }
  }
  
  const mintKp = Keypair.generate();
  const mintLen = getMintLen([]);
  const lamports = await conn.getMinimumBalanceForRentExemption(mintLen);
  
  const tx = new Transaction();
  
  tx.add(SystemProgram.createAccount({
    fromPubkey: userKp.publicKey,
    newAccountPubkey: mintKp.publicKey,
    space: mintLen,
    lamports,
    programId: TOKEN_2022_PROGRAM_ID,
  }));
  
  tx.add(createInitializeMintInstruction(
    mintKp.publicKey,
    9,
    userKp.publicKey,
    userKp.publicKey,
    TOKEN_2022_PROGRAM_ID
  ));
  
  const signature = await sendAndConfirmTransaction(conn, tx, [userKp, mintKp]);
  
  console.log(`Confirmed https://explorer.solana.com/tx/${signature}?cluster=devnet`);
  console.log(`Mint created: ${mintKp.publicKey.toBase58()}`);
  
  fs.mkdirSync(path.dirname(cache), { recursive: true });
  fs.writeFileSync(cache, JSON.stringify({ mint: mintKp.publicKey.toBase58() }));
}

main().catch(e => {
  console.error(e.message);
  process.exit(1);
});