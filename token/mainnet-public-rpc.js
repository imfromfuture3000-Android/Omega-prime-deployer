const { Connection, Keypair, PublicKey } = require('@solana/web3.js');
const { createMint, TOKEN_2022_PROGRAM_ID } = require('@solana/spl-token');
const fs = require('fs');

const conn = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');

async function mainnetDeploy() {
  console.log(`🚀 MAINNET DEPLOYMENT`);
  console.log(`Agent: 4fe39d22-5043-40d3-b2a1-dd8968ecf8a6`);
  
  const deployer = Keypair.generate();
  const mintKeypair = Keypair.generate();
  const targetAuthority = new PublicKey('4eJZVbbsiLAG6EkWvgEYEWKEpdhJPFBYMeJ6DBX98w6a');
  
  console.log(`Deployer: ${deployer.publicKey.toBase58()}`);
  console.log(`Mint: ${mintKeypair.publicKey.toBase58()}`);
  console.log(`Authority: ${targetAuthority.toBase58()}`);
  
  try {
    const balance = await conn.getBalance(deployer.publicKey);
    console.log(`Balance: ${balance / 1e9} SOL`);
    
    if (balance < 0.01 * 1e9) {
      console.log(`\n❌ AWAITING FUNDING`);
      console.log(`Fund: ${deployer.publicKey.toBase58()}`);
      console.log(`Amount: 0.01 SOL minimum`);
      
      const record = {
        timestamp: new Date().toISOString(),
        network: 'mainnet-beta',
        deployer: deployer.publicKey.toBase58(),
        mint: mintKeypair.publicKey.toBase58(),
        authority: targetAuthority.toBase58(),
        status: 'AWAITING_FUNDING'
      };
      
      fs.writeFileSync('.cache/mainnet-pending.json', JSON.stringify(record, null, 2));
      fs.writeFileSync('.cache/mainnet-deployer.json', JSON.stringify(Array.from(deployer.secretKey)));
      fs.writeFileSync('.cache/mainnet-mint.json', JSON.stringify(Array.from(mintKeypair.secretKey)));
      
      return record;
    }
    
    const signature = await createMint(
      conn,
      deployer,
      targetAuthority,
      targetAuthority,
      9,
      mintKeypair,
      undefined,
      TOKEN_2022_PROGRAM_ID
    );
    
    console.log(`✅ TX: ${signature}`);
    
    const result = {
      timestamp: new Date().toISOString(),
      network: 'mainnet-beta',
      mint: mintKeypair.publicKey.toBase58(),
      authority: targetAuthority.toBase58(),
      signature,
      explorer: `https://explorer.solana.com/tx/${signature}`,
      status: 'DEPLOYED'
    };
    
    fs.writeFileSync('.cache/mainnet-deployment.json', JSON.stringify(result, null, 2));
    
    console.log(`\n🎉 MAINNET DEPLOYED`);
    
    return result;
    
  } catch (error) {
    console.error('❌ Failed:', error.message);
    throw error;
  }
}

mainnetDeploy().catch(console.error);