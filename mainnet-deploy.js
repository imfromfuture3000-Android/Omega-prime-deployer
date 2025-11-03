const { Connection, Keypair, PublicKey, SystemProgram, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const { createMint, TOKEN_2022_PROGRAM_ID } = require('@solana/spl-token');
const fs = require('fs');

async function deployMainnet() {
  const HELIUS_API_KEY = process.env.HELIUS_API_KEY || 'demo';
  const RPC_URL = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;
  
  const conn = new Connection(RPC_URL, 'confirmed');
  
  // Generate deployer keypair
  const deployer = Keypair.generate();
  
  console.log(`Deployer: ${deployer.publicKey.toBase58()}`);
  
  // Check balance
  const balance = await conn.getBalance(deployer.publicKey);
  console.log(`Balance: ${balance / LAMPORTS_PER_SOL} SOL`);
  
  if (balance < 0.01 * LAMPORTS_PER_SOL) {
    console.log('❌ Insufficient balance. Need funding.');
    console.log(`Fund this address: ${deployer.publicKey.toBase58()}`);
    
    // Save keypair for funding
    fs.writeFileSync('./.cache/deployer.json', JSON.stringify(Array.from(deployer.secretKey)));
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
    console.error('❌ Deployment failed:', error.message);
    throw error;
  }
}

deployMainnet().catch(console.error);