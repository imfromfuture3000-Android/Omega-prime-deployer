import { Connection, PublicKey, VersionedTransaction, TransactionMessage } from '@solana/web3.js';
import { getOrCreateAssociatedTokenAccount, mintTo, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { sendViaRelayer } from './utils/relayer';
import { loadOrCreateUserAuth } from './utils/wallet';
import { findAssociatedTokenAddress } from './utils/pdas';

dotenv.config();

async function main() {
  const conn = new Connection(process.env.RPC_URL!, 'confirmed');
  const user = loadOrCreateUserAuth();
  const relayerPk = new PublicKey(process.env.RELAYER_PUBKEY!);
  const treasury = new PublicKey(process.env.TREASURY_PUBKEY!);
  
  const mintFile = path.join(__dirname, '../.cache/mint.json');
  if (!fs.existsSync(mintFile)) throw new Error('Run createMint first');
  
  const mint = new PublicKey(JSON.parse(fs.readFileSync(mintFile, 'utf-8')).mint);
  const ata = findAssociatedTokenAddress(treasury, mint);
  const supply = BigInt('1000000000') * BigInt(10 ** 9);
  
  const ataInfo = await conn.getAccountInfo(ata);
  if (ataInfo) {
    const bal = await conn.getTokenAccountBalance(ata);
    if (BigInt(bal.value.amount) === supply) {
      console.log(`Supply already minted to ${ata.toBase58()}`);
      return;
    }
  }
  
  const ixs: any[] = [];
  
  if (!ataInfo) {
    ixs.push(
      (await getOrCreateAssociatedTokenAccount(
        conn,
        user,
        mint,
        treasury,
        false,
        'confirmed',
        { commitment: 'confirmed' },
        TOKEN_2022_PROGRAM_ID
      )).instruction
    );
  }
  
  ixs.push(
    await mintTo(
      conn,
      user,
      mint,
      ata,
      user.publicKey,
      supply,
      [],
      { commitment: 'confirmed' },
      TOKEN_2022_PROGRAM_ID
    )
  );
  
  const { blockhash } = await conn.getLatestBlockhash();
  const message = new TransactionMessage({
    payerKey: user.publicKey,
    recentBlockhash: blockhash,
    instructions: ixs
  }).compileToV0Message();
  
  const tx = new VersionedTransaction(message);
  tx.sign([user]);
  
  await sendViaRelayer(conn, relayerPk, process.env.RELAYER_URL!, tx, process.env.RELAYER_API_KEY);
  console.log(`Minted ${supply} to ${ata.toBase58()}`);
}

main().catch(e => {
  console.error(e.message);
  process.exit(1);
});