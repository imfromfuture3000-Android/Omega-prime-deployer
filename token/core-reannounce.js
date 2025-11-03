const { Connection, Keypair, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const { setAuthority, AuthorityType, TOKEN_2022_PROGRAM_ID } = require('@solana/spl-token');
const fs = require('fs');

async function coreReannounce() {
  const conn = new Connection('https://api.devnet.solana.com', 'confirmed');
  
  // Load authority and data
  const authorityKey = JSON.parse(fs.readFileSync('.cache/new-authority.json'));
  const authority = Keypair.fromSecretKey(new Uint8Array(authorityKey));
  const reannouncement = JSON.parse(fs.readFileSync('.cache/devnet-reannouncement.json'));
  
  const targetAddress = new PublicKey('4eJZVbbsiLAG6EkWvgEYEWKEpdhJPFBYMeJ6DBX98w6a');
  const mintAddress = new PublicKey(reannouncement.mint);
  
  console.log(`🔄 CORE PROGRAM REANNOUNCEMENT`);
  console.log(`Authority: ${authority.publicKey.toBase58()}`);
  console.log(`Mint: ${mintAddress.toBase58()}`);
  console.log(`Target: ${targetAddress.toBase58()}`);
  
  try {
    // Check authority balance
    const balance = await conn.getBalance(authority.publicKey);
    console.log(`💰 Authority Balance: ${balance / LAMPORTS_PER_SOL} SOL`);
    
    const transactions = [];
    
    // Transfer SOL if available
    if (balance > 0.001 * LAMPORTS_PER_SOL) {
      const transferAmount = balance - 5000; // Keep 5000 lamports for fees
      
      const transferTx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: authority.publicKey,
          toPubkey: targetAddress,
          lamports: transferAmount
        })
      );
      
      const transferSig = await conn.sendTransaction(transferTx, [authority]);
      await conn.confirmTransaction(transferSig);
      
      console.log(`💸 SOL Transfer: ${transferSig}`);
      transactions.push({ type: 'sol_transfer', signature: transferSig, amount: transferAmount });
    }
    
    // Transfer mint authority
    const authoritySig = await setAuthority(
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
    
    console.log(`🔑 Authority Transfer: ${authoritySig}`);
    transactions.push({ type: 'authority_transfer', signature: authoritySig });
    
    // Core reannouncement record
    const coreReannouncement = {
      timestamp: new Date().toISOString(),
      network: 'devnet',
      type: 'CORE_PROGRAM_REANNOUNCEMENT',
      mint: mintAddress.toBase58(),
      fromAuthority: authority.publicKey.toBase58(),
      toAuthority: targetAddress.toBase58(),
      transactions,
      explorers: transactions.map(tx => ({
        type: tx.type,
        url: `https://explorer.solana.com/tx/${tx.signature}?cluster=devnet`
      })),
      status: 'COMPLETE'
    };
    
    fs.writeFileSync('.cache/core-reannouncement.json', JSON.stringify(coreReannouncement, null, 2));
    
    console.log(`\n🎉 CORE REANNOUNCEMENT COMPLETE`);
    console.log(`New Authority: ${targetAddress.toBase58()}`);
    console.log(`Authority TX: ${authoritySig}`);
    
    return coreReannouncement;
    
  } catch (error) {
    console.error('❌ Core reannouncement failed:', error.message);
    throw error;
  }
}

coreReannounce().catch(console.error);