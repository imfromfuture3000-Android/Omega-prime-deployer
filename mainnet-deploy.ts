import { Connection, Keypair, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { createMint, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import * as fs from 'fs';

async function deployMainnet() {
  const HELIUS_API_KEY = process.env.HELIUS_API_KEY || 'your-helius-key';
  const RPC_URL = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;
  
  const conn = new Connection(RPC_URL, 'confirmed');
  
  // Generate or load deployer keypair
  const deployerPath = './.cache/deployer.json';
  let deployer: Keypair;
  
  if (fs.existsSync(deployerPath)) {
    const keyData = JSON.parse(fs.readFileSync(deployerPath, 'utf-8'));
    deployer = Keypair.fromSecretKey(new Uint8Array(keyData));
  } else {
    deployer = Keypair.generate();
    fs.writeFileSync(deployerPath, JSON.stringify(Array.from(deployer.secretKey)));
  }
  
  console.log(`Deployer: ${deployer.publicKey.toBase58()}`);
  
  // Check balance
  const balance = await conn.getBalance(deployer.publicKey);
  console.log(`Balance: ${balance / LAMPORTS_PER_SOL} SOL`);
  
  if (balance < 0.01 * LAMPORTS_PER_SOL) {
    console.log('❌ Insufficient balance. Need at least 0.01 SOL');
    return;
  }
  
  try {
    // Create mint with Token-2022
    const mintKeypair = Keypair.generate();
    
    const signature = await createMint(
      conn,
      deployer,
      deployer.publicKey,
      deployer.publicKey,
      9,
      mintKeypair,
      undefined,
      TOKEN_2022_PROGRAM_ID
    );
    
    console.log(`✅ Mint created: ${mintKeypair.publicKey.toBase58()}`);
    console.log(`🔗 TX: https://explorer.solana.com/tx/${signature}`);
    
    // Save deployment record
    const deployment = {
      timestamp: new Date().toISOString(),
      deployer: deployer.publicKey.toBase58(),
      mint: mintKeypair.publicKey.toBase58(),
      signature,
      network: 'mainnet-beta',
      rpc: 'helius'
    };
    
    fs.writeFileSync('./.cache/mainnet-deployment.json', JSON.stringify(deployment, null, 2));
    
    return signature;
    
  } catch (error) {
    console.error('❌ Deployment failed:', error);
    throw error;
  }
}

if (require.main === module) {
  deployMainnet().catch(console.error);
}

export { deployMainnet };