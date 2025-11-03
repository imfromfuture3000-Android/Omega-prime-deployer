const { Connection, Keypair, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const { setAuthority, AuthorityType, TOKEN_2022_PROGRAM_ID } = require('@solana/spl-token');
const fs = require('fs');

async function executeReannounce() {
  const conn = new Connection('https://api.devnet.solana.com', 'confirmed');
  
  // Load keys
  const deployerKey = JSON.parse(fs.readFileSync('.cache/devnet-reannouncement.json'));
  const deployer = Keypair.fromSecretKey(new Uint8Array(JSON.parse(fs.readFileSync('.cache/deployer.json'))));
  const authorityKey = JSON.parse(fs.readFileSync('.cache/new-authority.json'));
  const authority = Keypair.fromSecretKey(new Uint8Array(authorityKey));
  
  const targetAddress = new PublicKey('4eJZVbbsiLAG6EkWvgEYEWKEpdhJPFBYMeJ6DBX98w6a');
  const mintAddress = new PublicKey(deployerKey.mint);
  
  console.log(`🚀 EXECUTING REANNOUNCEMENT`);
  console.log(`Deployer: ${deployer.publicKey.toBase58()}`);
  console.log(`Authority: ${authority.publicKey.toBase58()}`);
  console.log(`Target: ${targetAddress.toBase58()}`);
  
  const transactions = [];
  
  try {
    // 1. Fund authority from deployer
    const fundTx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: deployer.publicKey,
        toPubkey: authority.publicKey,
        lamports: 0.01 * LAMPORTS_PER_SOL
      })
    );
    
    const fundSig = await conn.sendTransaction(fundTx, [deployer]);
    await conn.confirmTransaction(fundSig);
    console.log(`💰 Fund Authority: ${fundSig}`);
    transactions.push({ type: 'fund', signature: fundSig });
    
    // 2. Transfer mint authority
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
    console.log(`🔑 Transfer Authority: ${authSig}`);
    transactions.push({ type: 'authority', signature: authSig });
    
    // 3. Send remaining SOL to target
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
      console.log(`💸 Send SOL: ${solSig}`);
      transactions.push({ type: 'sol_transfer', signature: solSig });
    }
    
    // Record execution
    const execution = {
      timestamp: new Date().toISOString(),
      network: 'devnet',
      mint: mintAddress.toBase58(),
      fromAuthority: authority.publicKey.toBase58(),
      toAuthority: targetAddress.toBase58(),
      transactions,
      explorers: transactions.map(tx => `https://explorer.solana.com/tx/${tx.signature}?cluster=devnet`),
      status: 'EXECUTED'
    };
    
    fs.writeFileSync('.cache/execution-complete.json', JSON.stringify(execution, null, 2));
    
    console.log(`\n🎉 REANNOUNCEMENT EXECUTED`);
    console.log(`Authority TX: ${authSig}`);
    console.log(`New Authority: ${targetAddress.toBase58()}`);
    
    return execution;
    
  } catch (error) {
    console.error('❌ Execution failed:', error.message);
    throw error;
  }
}

executeReannounce().catch(console.error);