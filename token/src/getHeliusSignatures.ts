const HELIUS_API_KEY = '4fe39d22-5043-40d3-b2a1-dd8968ecf8a6';
const HELIUS_RPC = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;
const HELIUS_API = `https://api-mainnet.helius-rpc.com/v0`;

const TARGET_ADDRESSES = [
  'CvQZZ23qYDWF2RUpxYJ8y9K4skmuvYEEjH7fK58jtipQ', // DAO (exists)
  '8cRrU1NzNpjL3k2BwjW3VixAcX6VFc29KHr4KZg8cs2Y', // Relayer (exists)
  'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA', // Token Program (exists)
  'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s', // Metadata Program (exists)
  'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4', // Jupiter Program (exists)
  'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL'  // Associated Token (exists)
];

async function getTransactionHistory(address: string) {
  const url = `${HELIUS_API}/addresses/${address}/transactions/?api-key=${HELIUS_API_KEY}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data;
  } catch (error) {
    console.log(`Error fetching ${address}: ${error}`);
    return null;
  }
}

async function parseTransactions(signatures: string[]) {
  const url = `${HELIUS_API}/transactions/?api-key=${HELIUS_API_KEY}`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transactions: signatures })
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.log(`Error parsing transactions: ${error}`);
    return null;
  }
}

async function main() {
  console.log('=== HELIUS DAS API SIGNATURE SCAN ===\n');
  console.log('Fetching transaction signatures for ready contracts...\n');
  
  const results = [];
  
  for (const address of TARGET_ADDRESSES) {
    console.log(`Scanning ${address}...`);
    
    try {
      const history = await getTransactionHistory(address);
      
      if (history && history.length > 0) {
        const signatures = history.slice(0, 5).map((tx: any) => tx.signature);
        
        console.log(`  Found ${history.length} transactions`);
        console.log(`  Recent signatures:`);
        signatures.forEach((sig: string, i: number) => {
          console.log(`    ${i + 1}. ${sig}`);
        });
        
        // Parse recent transactions
        const parsed = await parseTransactions(signatures);
        
        results.push({
          address,
          totalTransactions: history.length,
          recentSignatures: signatures,
          parsedTransactions: parsed ? parsed.length : 0,
          status: 'SUCCESS'
        });
        
      } else {
        console.log(`  No transactions found`);
        results.push({
          address,
          totalTransactions: 0,
          status: 'NO_TRANSACTIONS'
        });
      }
      
    } catch (error) {
      console.log(`  Error: ${error}`);
      results.push({
        address,
        status: 'ERROR',
        error: String(error)
      });
    }
    
    console.log('');
  }
  
  console.log('=== SIGNATURE SUMMARY ===');
  const successCount = results.filter(r => r.status === 'SUCCESS').length;
  const totalSignatures = results.reduce((sum, r) => sum + (r.recentSignatures?.length || 0), 0);
  const totalTransactions = results.reduce((sum, r) => sum + (r.totalTransactions || 0), 0);
  
  console.log(`Addresses Scanned: ${results.length}`);
  console.log(`Successful Scans: ${successCount}`);
  console.log(`Total Transactions: ${totalTransactions}`);
  console.log(`Recent Signatures: ${totalSignatures}`);
  
  console.log('\n=== REANNOUNCE READY SIGNATURES ===');
  const readySignatures = [];
  
  results.forEach(result => {
    if (result.status === 'SUCCESS' && result.recentSignatures) {
      console.log(`${result.address}:`);
      result.recentSignatures.forEach((sig: string, i: number) => {
        console.log(`  ${i + 1}. ${sig}`);
        readySignatures.push({
          address: result.address,
          signature: sig,
          explorer: `https://explorer.solana.com/tx/${sig}`
        });
      });
      console.log('');
    }
  });
  
  console.log('=== REANNOUNCE STATUS ===');
  console.log(`Ready Addresses: ${successCount}/6`);
  console.log(`Available Signatures: ${readySignatures.length}`);
  console.log(`Status: ${successCount >= 4 ? '✅ READY FOR REANNOUNCE' : '❌ NEED MORE SIGNATURES'}`);
  
  if (readySignatures.length > 0) {
    console.log('\n🔄 REANNOUNCE PROTOCOL READY');
    console.log('📝 Use signatures for address reannouncement');
  }
  
  return {
    results,
    summary: {
      scanned: results.length,
      successful: successCount,
      totalTransactions,
      readySignatures: readySignatures.length,
      status: successCount >= 4 ? 'READY' : 'NOT_READY'
    },
    signatures: readySignatures
  };
}

main().catch(console.error);