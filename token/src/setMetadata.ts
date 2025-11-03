import { Connection, PublicKey, VersionedTransaction, TransactionMessage } from '@solana/web3.js';
import {
  createMetadataAccountV3,
  updateMetadataAccountV3,
  DataV2
} from '@metaplex-foundation/mpl-token-metadata';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { sendViaRelayer } from './utils/relayer';
import { loadOrCreateUserAuth } from './utils/wallet';
import { findMetadataPda } from './utils/pdas';

dotenv.config();

const METADATA = {
  name: 'Omega Prime Token',
  symbol: 'ΩAGENT',
  description: 'Agent guild utility token powering Ω-Prime automations on Solana.',
  image: 'https://<hosted-image>/logo.png',
  external_url: 'https://<site>'
};

async function main() {
  const conn = new Connection(process.env.RPC_URL!, 'confirmed');
  const user = loadOrCreateUserAuth();
  const relayerPk = new PublicKey(process.env.RELAYER_PUBKEY!);
  
  const mintFile = path.join(__dirname, '../.cache/mint.json');
  if (!fs.existsSync(mintFile)) throw new Error('Run createMint first');
  
  const mint = new PublicKey(JSON.parse(fs.readFileSync(mintFile, 'utf-8')).mint);
  const metaPda = findMetadataPda(mint);
  
  const data: DataV2 = {
    name: METADATA.name.slice(0, 32),
    symbol: METADATA.symbol.slice(0, 10),
    uri: `data:application/json;base64,${Buffer.from(
      JSON.stringify({
        name: METADATA.name,
        symbol: METADATA.symbol,
        description: METADATA.description.slice(0, 200),
        image: METADATA.image,
        external_url: METADATA.external_url
      })
    ).toString('base64')}`,
    sellerFeeBasisPoints: 0,
    creators: null,
    collection: null,
    uses: null
  };
  
  if (data.uri.length > 1232) throw new Error('URI too long');
  
  const existing = await conn.getAccountInfo(metaPda);
  const ix = existing
    ? updateMetadataAccountV3({ metadata: metaPda, updateAuthority: user.publicKey, data })
    : createMetadataAccountV3({
        metadata: metaPda,
        mint,
        mintAuthority: user.publicKey,
        payer: user.publicKey,
        updateAuthority: user.publicKey,
        data
      });
  
  const { blockhash } = await conn.getLatestBlockhash();
  const message = new TransactionMessage({
    payerKey: user.publicKey,
    recentBlockhash: blockhash,
    instructions: [ix]
  }).compileToV0Message();
  
  const tx = new VersionedTransaction(message);
  tx.sign([user]);
  
  await sendViaRelayer(conn, relayerPk, process.env.RELAYER_URL!, tx, process.env.RELAYER_API_KEY);
  console.log(`Metadata set (uri length=${data.uri.length})`);
}

main().catch(e => {
  console.error(e.message);
  process.exit(1);
});