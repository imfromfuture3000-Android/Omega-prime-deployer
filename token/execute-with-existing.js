const { Connection, Keypair, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const { setAuthority, AuthorityType, TOKEN_2022_PROGRAM_ID } = require('@solana/spl-token');
const fs = require('fs');

async function executeWithExisting() {
  const conn = new Connection('https://api.devnet.solana.com', 'confirmed');
  
  // Load existing data
  const reannouncement = JSON.parse(fs.readFileSync('.cache/devnet-reannouncement.json'));
  const authorityKey = JSON.parse(fs.readFileSync('.cache/new-authority.json'));
  const authority = Keypair.fromSecretKey(new Uint8Array(authorityKey));
  
  // Use deployer from reannouncement data
  const deployerAddress = new PublicKey(reannouncement.deployer);
  const targetAddress = new PublicKey('4eJZVbbsiLAG6EkWvgEYEWKEpdhJPFBYMeJ6DBX98w6a');
  const mintAddress = new PublicKey(reannouncement.mint);
  
  console.log(`🚀 EXECUTING WITH EXISTING DATA`);
  console.log(`Authority: ${authority.publicKey.toBase58()}`);
  console.log(`Target: ${targetAddress.toBase58()}`);
  console.log(`Mint: ${mintAddress.toBase58()}`);
  
  try {
    // Check current balances
    const authBalance = await conn.getBalance(authority.publicKey);
    const deployerBalance = await conn.getBalance(deployerAddress);
    
    console.log(`💰 Authority: ${authBalance / LAMPORTS_PER_SOL} SOL`);
    console.log(`💰 Deployer: ${deployerBalance / LAMPORTS_PER_SOL} SOL`);
    
    // Since we can't access deployer keys, try direct authority transfer
    if (authBalance > 5000) {
      console.log(`✅ Authority has funds, proceeding with transfer...`);
      
      const authSig = await setAuthority(
        conn,
        authority,
        mintAddress,
        authority.publicKey,
        AuthorityType.MintTokens,
        targetAddress,
        undefined,
        undefined,
        TOKEN_2022_PROGRAM_ID
      );
      
      console.log(`🔑 Authority Transfer: ${authSig}`);
      
      // Send remaining SOL
      const remainingBalance = await conn.getBalance(authority.publicKey);
      if (remainingBalance > 5000) {
        const solTx = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: authority.publicKey,
            toPubkey: targetAddress,
            lamports: remainingBalance - 5000
          })
        );
        
        const solSig = await conn.sendTransaction(solTx, [authority]);
        await conn.confirmTransaction(solSig);
        console.log(`💸 SOL Transfer: ${solSig}`);
      }
      
      const result = {
        timestamp: new Date().toISOString(),
        network: 'devnet',
        mint: mintAddress.toBase58(),
        authorityTransfer: authSig,
        solTransfer: solSig || null,
        newAuthority: targetAddress.toBase58(),
        status: 'COMPLETE'
      };
      
      fs.writeFileSync('.cache/final-execution.json', JSON.stringify(result, null, 2));
      
      console.log(`\n🎉 EXECUTION COMPLETE`);
      console.log(`Authority TX: ${authSig}`);
      
      return result;
    } else {
      console.log(`❌ Authority has insufficient funds (${authBalance} lamports)`);
      console.log(`Need to fund authority first`);
    }
    
  } catch (error) {
    console.error('❌ Execution failed:', error.message);
    throw error;
  }
}

executeWithExisting().catch(console.error);