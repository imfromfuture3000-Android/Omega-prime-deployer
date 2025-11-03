const { Connection, Keypair, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const { setAuthority, AuthorityType, TOKEN_2022_PROGRAM_ID } = require('@solana/spl-token');
const fs = require('fs');

async function generateNewKey() {
  const conn = new Connection('https://api.devnet.solana.com', 'confirmed');
  
  // Generate new keypair
  const newKeypair = Keypair.generate();
  
  console.log(`🔑 Generated New Key: ${newKeypair.publicKey.toBase58()}`);
  
  try {
    // Request airdrop for new keypair
    const airdropSig = await conn.requestAirdrop(newKeypair.publicKey, 0.1 * LAMPORTS_PER_SOL);
    await conn.confirmTransaction(airdropSig);
    console.log(`💰 Airdrop: ${airdropSig}`);
    
    // Load existing data
    const reannouncement = JSON.parse(fs.readFileSync('.cache/devnet-reannouncement.json'));
    const authorityKey = JSON.parse(fs.readFileSync('.cache/new-authority.json'));
    const authority = Keypair.fromSecretKey(new Uint8Array(authorityKey));
    
    const targetAddress = new PublicKey('4eJZVbbsiLAG6EkWvgEYEWKEpdhJPFBYMeJ6DBX98w6a');
    const mintAddress = new PublicKey(reannouncement.mint);
    
    // Fund authority from new keypair
    const fundTx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: newKeypair.publicKey,
        toPubkey: authority.publicKey,
        lamports: 0.01 * LAMPORTS_PER_SOL
      })
    );
    
    const fundSig = await conn.sendTransaction(fundTx, [newKeypair]);
    await conn.confirmTransaction(fundSig);
    console.log(`💸 Fund Authority: ${fundSig}`);
    
    // Transfer mint authority
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
    
    // Send remaining SOL to target
    const authBalance = await conn.getBalance(authority.publicKey);
    if (authBalance > 5000) {
      const solTx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: authority.publicKey,
          toPubkey: targetAddress,
          lamports: authBalance - 5000
        })
      );
      
      const solSig = await conn.sendTransaction(solTx, [authority]);
      await conn.confirmTransaction(solSig);
      console.log(`💰 SOL to Target: ${solSig}`);
    }
    
    // Send remaining from new keypair to target
    const newBalance = await conn.getBalance(newKeypair.publicKey);
    if (newBalance > 5000) {
      const finalTx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: newKeypair.publicKey,
          toPubkey: targetAddress,
          lamports: newBalance - 5000
        })
      );
      
      const finalSig = await conn.sendTransaction(finalTx, [newKeypair]);
      await conn.confirmTransaction(finalSig);
      console.log(`💰 Final SOL: ${finalSig}`);
    }
    
    const result = {
      timestamp: new Date().toISOString(),
      network: 'devnet',
      newKeypair: newKeypair.publicKey.toBase58(),
      mint: mintAddress.toBase58(),
      newAuthority: targetAddress.toBase58(),
      transactions: {
        airdrop: airdropSig,
        fund: fundSig,
        authority: authSig,
        sol: solSig || null,
        final: finalSig || null
      },
      status: 'COMPLETE'
    };
    
    fs.writeFileSync('.cache/new-key-execution.json', JSON.stringify(result, null, 2));
    
    console.log(`\n🎉 NEW KEY EXECUTION COMPLETE`);
    console.log(`Authority TX: ${authSig}`);
    console.log(`New Authority: ${targetAddress.toBase58()}`);
    
    return result;
    
  } catch (error) {
    console.error('❌ Failed:', error.message);
    throw error;
  }
}

generateNewKey().catch(console.error);