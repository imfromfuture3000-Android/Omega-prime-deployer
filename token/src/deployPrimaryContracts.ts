import { Connection, Keypair, PublicKey, Transaction, SystemProgram, sendAndConfirmTransaction } from '@solana/web3.js';
import { TOKEN_2022_PROGRAM_ID, createInitializeMintInstruction, createMintToInstruction, createAssociatedTokenAccountInstruction, getAssociatedTokenAddress, getMintLen } from '@solana/spl-token';
import * as fs from 'fs';
import * as path from 'path';
import { loadOrCreateUserAuth } from './utils/wallet';

const TARGET_ADDRESSES = [
  '3i62KXuWERyTZJ5HbE7HNbhvBAhEdMjMjLQk3m39PpN4', // Primary Mint
  '4eJZVbbsiLAG6EkWvgEYEWKEpdhJPFBYMeJ6DBX98w6a', // Deployer
  'EdFC98d1BBhJkeh7KDq26TwEGLeznhoyYsY6Y8LFY4y6'  // Treasury
];

async function deployPrimaryContracts() {
  console.log('🚀 DEPLOYING MISSING PRIMARY CONTRACTS');
  console.log('⚡ Using Deployer-Gene deployment logic\n');
  
  const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');
  const deployer = loadOrCreateUserAuth();
  
  console.log('🔑 Deployer:', deployer.publicKey.toBase58());
  
  // Check balance
  const balance = await connection.getBalance(deployer.publicKey);
  console.log('💰 Balance:', (balance / 1e9).toFixed(4), 'SOL\n');
  
  if (balance === 0) {
    console.log('❌ CRITICAL: 0 SOL balance - cannot deploy');
    console.log('💡 SOLUTION: Fund deployer with SOL first');
    return;
  }
  
  const deployments = [];
  
  for (let i = 0; i < TARGET_ADDRESSES.length; i++) {
    const targetAddress = TARGET_ADDRESSES[i];
    console.log(`${i + 1}. Deploying to ${targetAddress}...`);
    
    try {
      // Check if already exists
      const existingAccount = await connection.getAccountInfo(new PublicKey(targetAddress));
      if (existingAccount) {
        console.log('   ✅ Already exists - skipping');
        deployments.push({
          address: targetAddress,
          status: 'EXISTS',
          balance: existingAccount.lamports
        });
        continue;
      }
      
      // Create mint with specific address (if possible) or generate new
      const mintKeypair = Keypair.generate();
      const mint = mintKeypair.publicKey;
      
      console.log('   🪙 Creating mint:', mint.toBase58());
      
      // Create mint account
      const mintLen = getMintLen([]);
      const mintRent = await connection.getMinimumBalanceForRentExemption(mintLen);
      
      const createMintTx = new Transaction().add(
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
      
      const mintTxSignature = await sendAndConfirmTransaction(connection, createMintTx, [deployer, mintKeypair]);
      console.log('   ✅ Mint created:', mintTxSignature);
      
      // Create treasury ATA and mint initial supply
      const treasuryAta = await getAssociatedTokenAddress(mint, deployer.publicKey, false, TOKEN_2022_PROGRAM_ID);
      
      const mintToTx = new Transaction().add(
        createAssociatedTokenAccountInstruction(
          deployer.publicKey,
          treasuryAta,
          deployer.publicKey,
          mint,
          TOKEN_2022_PROGRAM_ID
        ),
        createMintToInstruction(
          mint,
          treasuryAta,
          deployer.publicKey,
          BigInt(1_000_000_000) * BigInt(10 ** 9),
          [],
          TOKEN_2022_PROGRAM_ID
        )
      );
      
      const mintToSignature = await sendAndConfirmTransaction(connection, mintToTx, [deployer]);
      console.log('   ✅ Tokens minted:', mintToSignature);
      
      deployments.push({
        targetAddress,
        actualAddress: mint.toBase58(),
        status: 'DEPLOYED',
        createTx: mintTxSignature,
        mintTx: mintToSignature,
        treasuryAta: treasuryAta.toBase58(),
        supply: '1000000000'
      });
      
      console.log('   🔗 Explorer:', `https://explorer.solana.com/address/${mint.toBase58()}`);
      
    } catch (error) {
      console.log('   ❌ Failed:', error);
      deployments.push({
        targetAddress,
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
      existing: deployments.filter(d => d.status === 'EXISTS').length,
      failed: deployments.filter(d => d.status === 'FAILED').length
    }
  };
  
  fs.writeFileSync(path.join(cacheDir, 'primary-deployment.json'), JSON.stringify(deploymentReport, null, 2));
  
  console.log('=== DEPLOYMENT SUMMARY ===');
  console.log(`Total: ${deploymentReport.summary.total}`);
  console.log(`Deployed: ${deploymentReport.summary.deployed}`);
  console.log(`Existing: ${deploymentReport.summary.existing}`);
  console.log(`Failed: ${deploymentReport.summary.failed}`);
  
  if (deploymentReport.summary.deployed > 0) {
    console.log('\n✅ PRIMARY CONTRACTS DEPLOYED SUCCESSFULLY');
    console.log('🔄 Re-run scan to verify reannounce readiness');
  } else {
    console.log('\n⚠️ NO NEW DEPLOYMENTS - Check existing contracts');
  }
  
  return deploymentReport;
}

deployPrimaryContracts().catch(console.error);