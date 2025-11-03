const { Connection, Keypair, PublicKey } = require('@solana/web3.js');
const { createMint, TOKEN_2022_PROGRAM_ID } = require('@solana/spl-token');
const fs = require('fs');

const HELIUS_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjcmVhdGVkQXQiOjE3NTQyNzI3ODcxOTgsImVtYWlsIjoicGF1bHBldGUuY2VyY2VuaWFAZ21haWwuY29tIiwiYWN0aW9uIjoidG9rZW4tYXBpIiwiYXBpVmVyc2lvbiI6InYyIiwiaWF0IjoxNzU0MjcyNzg3fQ.IiNATw4EseqTcEU68-16BHnZHboOVXzjENd2XuJvXqw';
const conn = new Connection(`https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`, 'confirmed');

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
      console.log(`❌ Need funding: ${deployer.publicKey.toBase58()}`);
      
      const record = {
        timestamp: new Date().toISOString(),
        network: 'mainnet-beta',
        deployer: deployer.publicKey.toBase58(),
        mint: mintKeypair.publicKey.toBase58(),
        authority: targetAuthority.toBase58(),
        status: 'AWAITING_FUNDING',
        fundingRequired: '0.01 SOL'
      };
      
      fs.writeFileSync('.cache/mainnet-deploy-pending.json', JSON.stringify(record, null, 2));
      fs.writeFileSync('.cache/mainnet-deployer.json', JSON.stringify(Array.from(deployer.secretKey)));
      fs.writeFileSync('.cache/mainnet-mint.json', JSON.stringify(Array.from(mintKeypair.secretKey)));
      
      console.log(`\n📋 Fund address to proceed: ${deployer.publicKey.toBase58()}`);
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
    
    console.log(`✅ Deployed: ${signature}`);
    
    const result = {
      timestamp: new Date().toISOString(),
      network: 'mainnet-beta',
      deployer: deployer.publicKey.toBase58(),
      mint: mintKeypair.publicKey.toBase58(),
      authority: targetAuthority.toBase58(),
      signature,
      explorer: `https://explorer.solana.com/tx/${signature}`,
      status: 'DEPLOYED'
    };
    
    fs.writeFileSync('.cache/mainnet-deployment.json', JSON.stringify(result, null, 2));
    
    console.log(`\n🎉 MAINNET DEPLOYMENT COMPLETE`);
    console.log(`TX: ${signature}`);
    
    return result;
    
  } catch (error) {
    console.error('❌ Failed:', error.message);
    throw error;
  }
}

mainnetDeploy().catch(console.error);