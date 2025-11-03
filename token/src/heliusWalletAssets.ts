import { SolanaAgentKit, createSolanaTools } from 'solana-agent-kit';
import { Keypair } from '@solana/web3.js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config({ path: '.env.secure' });

const HELIUS_API_KEY = process.env.HELIUS_API_KEY!;
const RPC_URL = `https://devnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;

async function getWalletAssets(useExisting = true) {
  let keypair: Keypair;

  if (useExisting && fs.existsSync('.cache/new-authority.json')) {
    const secretKey = JSON.parse(fs.readFileSync('.cache/new-authority.json', 'utf-8'));
    keypair = Keypair.fromSecretKey(new Uint8Array(secretKey));
    console.log('Using existing wallet:', keypair.publicKey.toString());
  } else {
    keypair = Keypair.generate();
    fs.mkdirSync('.cache', { recursive: true });
    fs.writeFileSync('.cache/wallet.json', JSON.stringify(Array.from(keypair.secretKey)));
    console.log('Generated new wallet:', keypair.publicKey.toString());
  }

  const agent = new SolanaAgentKit(
    keypair.secretKey.toString(),
    RPC_URL,
    process.env.OPENAI_API_KEY
  );

  // Get all assets owned by wallet
  const assets = await agent.getWalletAddress();
  console.log('\nWallet Address:', assets);

  // Fetch assets using Helius DAS API
  const response = await fetch(RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 'wallet-assets',
      method: 'getAssetsByOwner',
      params: {
        ownerAddress: keypair.publicKey.toString(),
        page: 1,
        limit: 1000,
        displayOptions: {
          showFungible: true,
          showNativeBalance: true
        }
      }
    })
  });

  const data = await response.json();
  console.log('\nTotal Assets:', data.result?.total || 0);
  console.log('Assets:', JSON.stringify(data.result?.items || [], null, 2));

  return { wallet: keypair.publicKey.toString(), assets: data.result };
}

getWalletAssets(true).catch(console.error);
