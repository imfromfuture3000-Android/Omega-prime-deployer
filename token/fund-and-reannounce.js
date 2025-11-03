const { Connection, Keypair, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const { setAuthority, AuthorityType, TOKEN_2022_PROGRAM_ID } = require('@solana/spl-token');
const fs = require('fs');

async function fundAndReannounce() {
  const conn = new Connection('https://api.devnet.solana.com', 'confirmed');
  
  // Load authority
  const authorityKey = JSON.parse(fs.readFileSync('.cache/new-authority.json'));
  const authority = Keypair.fromSecretKey(new Uint8Array(authorityKey));
  const reannouncement = JSON.parse(fs.readFileSync('.cache/devnet-reannouncement.json'));
  
  const targetAddress = new PublicKey('4eJZVbbsiLAG6EkWvgEYEWKEpdhJPFBYMeJ6DBX98w6a');
  const mintAddress = new PublicKey(reannouncement.mint);
  
  console.log(`🔄 FUND & REANNOUNCE`);
  console.log(`Authority: ${authority.publicKey.toBase58()}`);
  console.log(`Target: ${targetAddress.toBase58()}`);
  
  try {
    // Fund authority with airdrop
    console.log(`💰 Requesting airdrop...`);
    const airdropSig = await conn.requestAirdrop(authority.publicKey, 0.1 * LAMPORTS_PER_SOL);
    await conn.confirmTransaction(airdropSig);
    console.log(`✅ Airdrop: ${airdropSig}`);
    
    // Check balance
    const balance = await conn.getBalance(authority.publicKey);
    console.log(`💰 Balance: ${balance / LAMPORTS_PER_SOL} SOL`);
    
    // Transfer authority
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
    
    // Transfer remaining SOL
    const newBalance = await conn.getBalance(authority.publicKey);
    const transferAmount = newBalance - 5000; // Keep fees
    
    if (transferAmount > 0) {
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
    }
    
    // Record
    const record = {
      timestamp: new Date().toISOString(),
      network: 'devnet',
      mint: mintAddress.toBase58(),
      authority_transfer: authoritySig,
      sol_transfer: transferAmount > 0 ? transferSig : null,
      airdrop: airdropSig,
      explorers: {
        authority: `https://explorer.solana.com/tx/${authoritySig}?cluster=devnet`,
        airdrop: `https://explorer.solana.com/tx/${airdropSig}?cluster=devnet`
      }
    };
    
    fs.writeFileSync('.cache/final-reannouncement.json', JSON.stringify(record, null, 2));
    
    console.log(`\n🎉 REANNOUNCEMENT COMPLETE`);
    console.log(`Authority TX: ${authoritySig}`);
    
    return record;
    
  } catch (error) {
    console.error('❌ Failed:', error.message);
    throw error;
  }
}

fundAndReannounce().catch(console.error);