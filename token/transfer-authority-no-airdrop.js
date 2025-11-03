const { Connection, Keypair, PublicKey } = require('@solana/web3.js');
const { setAuthority, AuthorityType, TOKEN_2022_PROGRAM_ID } = require('@solana/spl-token');
const fs = require('fs');

async function transferAuthority() {
  const conn = new Connection('https://api.devnet.solana.com', 'confirmed');
  
  // Load previous mint and authority
  const reannouncement = JSON.parse(fs.readFileSync('.cache/devnet-reannouncement.json'));
  const newAuthorityKey = JSON.parse(fs.readFileSync('.cache/new-authority.json'));
  const currentAuthority = Keypair.fromSecretKey(new Uint8Array(newAuthorityKey));
  
  // Target address for authority transfer
  const targetAuthority = new PublicKey('4eJZVbbsiLAG6EkWvgEYEWKEpdhJPFBYMeJ6DBX98w6a');
  const mintAddress = new PublicKey(reannouncement.mint);
  
  console.log(`🔄 Transferring authority from: ${currentAuthority.publicKey.toBase58()}`);
  console.log(`🎯 To: ${targetAuthority.toBase58()}`);
  console.log(`📋 Mint: ${mintAddress.toBase58()}`);
  
  try {
    // Transfer authority directly
    const transferSig = await setAuthority(
      conn,
      currentAuthority,
      mintAddress,
      currentAuthority.publicKey,
      AuthorityType.MintTokens,
      targetAuthority,
      undefined,
      undefined,
      TOKEN_2022_PROGRAM_ID
    );
    
    console.log(`✅ Authority Transfer TX: ${transferSig}`);
    
    // Update record
    const transfer = {
      timestamp: new Date().toISOString(),
      network: 'devnet',
      mint: mintAddress.toBase58(),
      fromAuthority: currentAuthority.publicKey.toBase58(),
      toAuthority: targetAuthority.toBase58(),
      transactions: {
        transfer: transferSig
      },
      explorers: {
        transfer: `https://explorer.solana.com/tx/${transferSig}?cluster=devnet`
      }
    };
    
    fs.writeFileSync('.cache/authority-transfer.json', JSON.stringify(transfer, null, 2));
    
    console.log(`\n🎉 AUTHORITY TRANSFER COMPLETE`);
    console.log(`New Authority: ${targetAuthority.toBase58()}`);
    console.log(`Transfer Hash: ${transferSig}`);
    
    return transfer;
    
  } catch (error) {
    console.error('❌ Transfer failed:', error.message);
    throw error;
  }
}

transferAuthority().catch(console.error);