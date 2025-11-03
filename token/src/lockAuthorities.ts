import { Connection, PublicKey, VersionedTransaction, TransactionMessage } from '@solana/web3.js';
import { setAuthority, AuthorityType, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { sendViaRelayer } from './utils/relayer';
import { loadOrCreateUserAuth } from './utils/wallet';

dotenv.config();

async function main() {
  const conn = new Connection(process.env.RPC_URL!, 'confirmed');
  const user = loadOrCreateUserAuth();
  const relayerPk = new PublicKey(process.env.RELAYER_PUBKEY!);
  const treasury = new PublicKey(process.env.TREASURY_PUBKEY!);
  const dao = process.env.DAO_PUBKEY ? new PublicKey(process.env.DAO_PUBKEY) : null;
  const mode = (process.env.AUTHORITY_MODE ?? 'null') as 'null' | 'dao' | 'treasury';
  
  const mintFile = path.join(__dirname, '../.cache/mint.json');
  if (!fs.existsSync(mintFile)) throw new Error('Run createMint first');
  
  const mint = new PublicKey(JSON.parse(fs.readFileSync(mintFile, 'utf-8')).mint);
  const target = mode === 'dao' && dao ? dao : mode === 'treasury' ? treasury : null;
  
  const types = [AuthorityType.MintTokens, AuthorityType.FreezeAccount] as const;
  
  for (const type of types) {
    const supply = await conn.getTokenSupply(mint);
    const current = type === AuthorityType.MintTokens ? supply.value.mintAuthority : supply.value.freezeAuthority;
    
    if (current && (!target || !current.equals(target))) {
      const ix = await setAuthority(
        conn,
        user,
        mint,
        user.publicKey,
        type,
        target,
        [],
        { commitment: 'confirmed' },
        TOKEN_2022_PROGRAM_ID
      );
      
      const { blockhash } = await conn.getLatestBlockhash();
      const message = new TransactionMessage({
        payerKey: user.publicKey,
        recentBlockhash: blockhash,
        instructions: [ix]
      }).compileToV0Message();
      
      const tx = new VersionedTransaction(message);
      tx.sign([user]);
      
      await sendViaRelayer(conn, relayerPk, process.env.RELAYER_URL!, tx, process.env.RELAYER_API_KEY);
    }
  }
  
  await new Promise(r => setTimeout(r, 1500));
  const final = await conn.getTokenSupply(mint);
  console.log(`Mint authority: ${final.value.mintAuthority?.toBase58() ?? 'null'}`);
  console.log(`Freeze authority: ${final.value.freezeAuthority?.toBase58() ?? 'null'}`);
}

main().catch(e => {
  console.error(e.message);
  process.exit(1);
});