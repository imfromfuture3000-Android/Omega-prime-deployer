const { Connection, PublicKey } = require('@solana/web3.js');
const fs = require('fs');

async function scanAuthoritySimple() {
  const conn = new Connection('https://api.devnet.solana.com', 'confirmed');
  
  const authority = new PublicKey('7D3C97WF93tvvFhQLgde7rttbUEminWEMMybxvYJjwjU');
  const deployer = new PublicKey('22kXTBd1rrLXhpkKWCiYm33aeg123r3UM1Sts3DD6JW5');
  
  console.log(`🔍 Scanning project addresses...`);
  
  try {
    // Check balances
    const authorityBalance = await conn.getBalance(authority);
    const deployerBalance = await conn.getBalance(deployer);
    
    console.log(`🔑 Authority: ${authorityBalance / 1e9} SOL`);
    console.log(`🚀 Deployer: ${deployerBalance / 1e9} SOL`);
    
    // Get transaction history for authority
    const signatures = await conn.getSignaturesForAddress(authority, { limit: 10 });
    console.log(`📋 Recent transactions: ${signatures.length}`);
    
    const addresses = [
      { name: 'Authority', address: authority.toBase58(), balance: authorityBalance },
      { name: 'Deployer', address: deployer.toBase58(), balance: deployerBalance }
    ];
    
    // Check if any have funds
    const fundedAddresses = addresses.filter(addr => addr.balance > 0);
    
    const scan = {
      timestamp: new Date().toISOString(),
      network: 'devnet',
      addresses,
      fundedAddresses,
      totalBalance: addresses.reduce((sum, addr) => sum + addr.balance, 0),
      recentTransactions: signatures.length
    };
    
    fs.writeFileSync('.cache/authority-scan.json', JSON.stringify(scan, null, 2));
    
    console.log(`\n📊 Authority Scan Complete`);
    console.log(`Funded Addresses: ${fundedAddresses.length}`);
    console.log(`Total Balance: ${scan.totalBalance / 1e9} SOL`);
    
    return scan;
    
  } catch (error) {
    console.error('❌ Scan failed:', error.message);
    throw error;
  }
}

scanAuthoritySimple().catch(console.error);