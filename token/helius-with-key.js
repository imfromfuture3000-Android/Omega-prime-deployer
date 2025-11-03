const { Connection, Keypair, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const { setAuthority, AuthorityType, TOKEN_2022_PROGRAM_ID } = require('@solana/spl-token');
const fs = require('fs');

async function heliusWithKey() {
  // Load Helius API key from secure file
  const secureContent = fs.readFileSync('.env.secure', 'utf-8');
  const heliusMatch = secureContent.match(/HELIUS_API_KEY=(.+)/);
  const HELIUS_API_KEY = heliusMatch ? heliusMatch[1].trim() : process.env.HELIUS_API_KEY;
  
  if (!HELIUS_API_KEY) {
    console.log('❌ No Helius API key found');
    return;
  }
  
  const conn = new Connection(`https://devnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`, 'confirmed');
  
  console.log(`🔑 Using Helius API Key: ${HELIUS_API_KEY.slice(0, 8)}...`);
  
  // Load existing data
  const reannouncement = JSON.parse(fs.readFileSync('.cache/devnet-reannouncement.json'));
  const authorityKey = JSON.parse(fs.readFileSync('.cache/new-authority.json'));
  const authority = Keypair.fromSecretKey(new Uint8Array(authorityKey));
  
  const targetAddress = new PublicKey('4eJZVbbsiLAG6EkWvgEYEWKEpdhJPFBYMeJ6DBX98w6a');
  const mintAddress = new PublicKey(reannouncement.mint);
  
  console.log(`🔄 HELIUS REANNOUNCEMENT`);
  console.log(`Authority: ${authority.publicKey.toBase58()}`);
  console.log(`Target: ${targetAddress.toBase58()}`);
  
  try {
    // Check balances
    const authBalance = await conn.getBalance(authority.publicKey);
    console.log(`💰 Authority: ${authBalance / LAMPORTS_PER_SOL} SOL`);
    
    // Generate new funded keypair
    const newKeypair = Keypair.generate();
    const airdropSig = await conn.requestAirdrop(newKeypair.publicKey, 0.1 * LAMPORTS_PER_SOL);
    await conn.confirmTransaction(airdropSig);
    console.log(`💰 Airdrop: ${airdropSig}`);
    
    // Fund authority
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
    
    // Transfer authority
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
    
    const result = {
      timestamp: new Date().toISOString(),
      network: 'devnet',
      rpc: 'helius',
      mint: mintAddress.toBase58(),
      newAuthority: targetAddress.toBase58(),
      transactions: {
        airdrop: airdropSig,
        fund: fundSig,
        authority: authSig
      },
      status: 'COMPLETE'
    };
    
    fs.writeFileSync('.cache/helius-reannouncement.json', JSON.stringify(result, null, 2));
    
    console.log(`\n🎉 HELIUS REANNOUNCEMENT COMPLETE`);
    console.log(`Authority TX: ${authSig}`);
    
    return result;
    
  } catch (error) {
    console.error('❌ Failed:', error.message);
    throw error;
  }
}

heliusWithKey().catch(console.error);