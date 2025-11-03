import { Connection, Keypair, PublicKey, Transaction, SystemProgram, sendAndConfirmTransaction } from '@solana/web3.js';
import { TOKEN_2022_PROGRAM_ID, createInitializeMintInstruction, getMintLen } from '@solana/spl-token';
import * as fs from 'fs';
import * as path from 'path';

async function deploySimple() {
  console.log('🚀 SIMPLE MAINNET DEPLOYMENT');
  console.log('⚡ Creating new contracts for reannounce\n');
  
  const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');
  
  // Use existing funded wallet from environment
  const privateKey = process.env.SIGNER_WALLET_PRIVATE_KEY;
  if (!privateKey) {
    console.log('❌ No SIGNER_WALLET_PRIVATE_KEY found');
    return;
  }
  
  const keyArray = JSON.parse(privateKey);
  const deployer = Keypair.fromSecretKey(Uint8Array.from(keyArray));
  
  console.log('🔑 Deployer:', deployer.publicKey.toBase58());
  
  // Check balance
  const balance = await connection.getBalance(deployer.publicKey);
  console.log('💰 Balance:', (balance / 1e9).toFixed(4), 'SOL\n');
  
  if (balance === 0) {
    console.log('❌ CRITICAL: 0 SOL balance - cannot deploy');
    return;
  }
  
  const deployments = [];
  
  // Deploy 3 new contracts to replace missing ones
  for (let i = 0; i < 3; i++) {
    console.log(`${i + 1}. Creating new contract...`);
    
    try {
      // Generate new mint
      const mintKeypair = Keypair.generate();
      const mint = mintKeypair.publicKey;
      
      console.log('   🪙 Mint:', mint.toBase58());
      
      // Create mint transaction
      const mintLen = getMintLen([]);
      const mintRent = await connection.getMinimumBalanceForRentExemption(mintLen);
      
      const tx = new Transaction().add(
        SystemProgram.createAccount({
          fromPubkey: deployer.publicKey,
          newAccountPubkey: mint,
          space: mintLen,
          lamports: mintRent,
          programId: TOKEN_2022_PROGRAM_ID,
        }),
        createInitializeMintInstruction(
          mint,
          9,
          deployer.publicKey,
          deployer.publicKey,
          TOKEN_2022_PROGRAM_ID
        )
      );
      
      const signature = await sendAndConfirmTransaction(connection, tx, [deployer, mintKeypair]);
      
      console.log('   ✅ Deployed:', signature);
      console.log('   🔗 Explorer:', `https://explorer.solana.com/address/${mint.toBase58()}`);
      
      deployments.push({
        address: mint.toBase58(),
        signature,
        status: 'DEPLOYED'
      });
      
    } catch (error) {
      console.log('   ❌ Failed:', error);
      deployments.push({
        status: 'FAILED',
        error: String(error)
      });
    }
    
    console.log('');
  }
  
  // Save deployment results
  const cacheDir = path.join(__dirname, '../.cache');
  if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
  
  const deploymentReport = {
    timestamp: new Date().toISOString(),
    deployer: deployer.publicKey.toBase58(),
    network: 'mainnet-beta',
    deployments,
    summary: {
      total: deployments.length,
      deployed: deployments.filter(d => d.status === 'DEPLOYED').length,
      failed: deployments.filter(d => d.status === 'FAILED').length
    }
  };
  
  fs.writeFileSync(path.join(cacheDir, 'simple-deployment.json'), JSON.stringify(deploymentReport, null, 2));
  
  console.log('=== DEPLOYMENT SUMMARY ===');
  console.log(`Total: ${deploymentReport.summary.total}`);
  console.log(`Deployed: ${deploymentReport.summary.deployed}`);
  console.log(`Failed: ${deploymentReport.summary.failed}`);
  
  if (deploymentReport.summary.deployed > 0) {
    console.log('\n✅ NEW CONTRACTS DEPLOYED');
    console.log('📝 Update contract list with new addresses');
    console.log('🔄 Re-run scan to verify reannounce readiness');
    
    console.log('\nNEW CONTRACT ADDRESSES:');
    deployments.filter(d => d.status === 'DEPLOYED').forEach((d, i) => {
      console.log(`${i + 1}. ${d.address}`);
    });
  }
  
  return deploymentReport;
}

deploySimple().catch(console.error);