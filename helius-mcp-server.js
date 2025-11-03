const { Connection, Keypair, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const { setAuthority, AuthorityType, TOKEN_2022_PROGRAM_ID } = require('@solana/spl-token');
const fs = require('fs');

const HELIUS_API_KEY = process.env.HELIUS_API_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjcmVhdGVkQXQiOjE3NTQyNzI3ODcxOTgsImVtYWlsIjoicGF1bHBldGUuY2VyY2VuaWFAZ21haWwuY29tIiwiYWN0aW9uIjoidG9rZW4tYXBpIiwiYXBpVmVyc2lvbiI6InYyIiwiaWF0IjoxNzU0MjcyNzg3fQ.IiNATw4EseqTcEU68-16BHnZHboOVXzjENd2XuJvXqw';
const HELIUS_RPC = `https://devnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;

async function executeReannouncement() {
  const conn = new Connection(HELIUS_RPC, 'confirmed');
  
  const authorityKey = JSON.parse(fs.readFileSync('./token/.cache/new-authority.json'));
  const authority = Keypair.fromSecretKey(new Uint8Array(authorityKey));
  const reannouncement = JSON.parse(fs.readFileSync('./token/.cache/devnet-reannouncement.json'));
  
  const targetAddress = new PublicKey('4eJZVbbsiLAG6EkWvgEYEWKEpdhJPFBYMeJ6DBX98w6a');
  const mintAddress = new PublicKey(reannouncement.mint);
  
  console.log(`🚀 MCP HELIUS REANNOUNCEMENT`);
  console.log(`Authority: ${authority.publicKey.toBase58()}`);
  console.log(`Target: ${targetAddress.toBase58()}`);
  
  try {
    const newKeypair = Keypair.generate();
    const airdropSig = await conn.requestAirdrop(newKeypair.publicKey, 0.1 * LAMPORTS_PER_SOL);
    await conn.confirmTransaction(airdropSig);
    console.log(`💰 Airdrop: ${airdropSig}`);
    
    const fundTx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: newKeypair.publicKey,
        toPubkey: authority.publicKey,
        lamports: 0.01 * LAMPORTS_PER_SOL
      })
    );
    
    const fundSig = await conn.sendTransaction(fundTx, [newKeypair]);
    await conn.confirmTransaction(fundSig);
    console.log(`💸 Fund: ${fundSig}`);
    
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
    console.log(`🔑 Authority: ${authSig}`);
    
    const result = {
      timestamp: new Date().toISOString(),
      network: 'devnet',
      mint: mintAddress.toBase58(),
      newAuthority: targetAddress.toBase58(),
      transactions: { airdrop: airdropSig, fund: fundSig, authority: authSig },
      status: 'COMPLETE'
    };
    
    fs.writeFileSync('./token/.cache/mcp-helius-result.json', JSON.stringify(result, null, 2));
    
    console.log(`\n🎉 MCP REANNOUNCEMENT COMPLETE`);
    console.log(`TX: ${authSig}`);
    
    return result;
  } catch (error) {
    console.error('❌ Failed:', error.message);
    throw error;
  }
}

executeReannouncement().catch(console.error);