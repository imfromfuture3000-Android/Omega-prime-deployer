const { Connection, Keypair, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const { createMint, setAuthority, AuthorityType, TOKEN_2022_PROGRAM_ID } = require('@solana/spl-token');
const fs = require('fs');

async function devnetReannounce() {
  const conn = new Connection('https://api.devnet.solana.com', 'confirmed');
  
  // Generate authority keypairs
  const deployer = Keypair.generate();
  const newAuthority = Keypair.generate();
  
  console.log(`🚀 Deployer: ${deployer.publicKey.toBase58()}`);
  console.log(`🔑 New Authority: ${newAuthority.publicKey.toBase58()}`);
  
  try {
    // Request airdrop for deployer
    const airdropSig = await conn.requestAirdrop(deployer.publicKey, 2 * LAMPORTS_PER_SOL);
    await conn.confirmTransaction(airdropSig);
    console.log(`💰 Airdrop: ${airdropSig}`);
    
    // Create mint
    const mintKeypair = Keypair.generate();
    const createSig = await createMint(
      conn,
      deployer,
      deployer.publicKey,
      deployer.publicKey,
      9,
      mintKeypair,
      undefined,
      TOKEN_2022_PROGRAM_ID
    );
    
    console.log(`✅ Mint Created: ${mintKeypair.publicKey.toBase58()}`);
    console.log(`📋 Create TX: ${createSig}`);
    
    // Transfer authority
    const transferSig = await setAuthority(
      conn,
      deployer,
      mintKeypair.publicKey,
      deployer.publicKey,
      AuthorityType.MintTokens,
      newAuthority.publicKey,
      undefined,
      undefined,
      TOKEN_2022_PROGRAM_ID
    );
    
    console.log(`🔄 Authority Transfer TX: ${transferSig}`);
    
    // Reannouncement record
    const reannouncement = {
      timestamp: new Date().toISOString(),
      network: 'devnet',
      deployer: deployer.publicKey.toBase58(),
      mint: mintKeypair.publicKey.toBase58(),
      oldAuthority: deployer.publicKey.toBase58(),
      newAuthority: newAuthority.publicKey.toBase58(),
      transactions: {
        airdrop: airdropSig,
        create: createSig,
        transfer: transferSig
      },
      explorers: {
        mint: `https://explorer.solana.com/address/${mintKeypair.publicKey.toBase58()}?cluster=devnet`,
        create: `https://explorer.solana.com/tx/${createSig}?cluster=devnet`,
        transfer: `https://explorer.solana.com/tx/${transferSig}?cluster=devnet`
      }
    };
    
    // Save records
    if (!fs.existsSync('.cache')) fs.mkdirSync('.cache');
    fs.writeFileSync('.cache/devnet-reannouncement.json', JSON.stringify(reannouncement, null, 2));
    fs.writeFileSync('.cache/new-authority.json', JSON.stringify(Array.from(newAuthority.secretKey)));
    
    console.log(`\n🎉 REANNOUNCEMENT COMPLETE`);
    console.log(`Contract: ${mintKeypair.publicKey.toBase58()}`);
    console.log(`Authority: ${newAuthority.publicKey.toBase58()}`);
    console.log(`Transfer Hash: ${transferSig}`);
    
    return reannouncement;
    
  } catch (error) {
    console.error('❌ Reannouncement failed:', error.message);
    throw error;
  }
}

devnetReannounce().catch(console.error);