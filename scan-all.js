const { Connection, PublicKey } = require('@solana/web3.js');

const BPF_LOADER_UPGRADEABLE_ID = new PublicKey('BPFLoaderUpgradeab1e11111111111111111111111');
const AGENT_WALLETS = [
  'FPf5gnDYmQDkPiRwybBJxxfKAnyhdwa2D3JDtCMguyrW',
  'EdFC98d1BBhJkeh7KDq26TwEGLeznhoyYsY6Y8LFY4y6', 
  'CvQZZ23qYDWF2RUpxYJ8y9K4skmuvYEEjH7fK58jtipQ',
  '8cRrU1NzNpjL3k2BwjW3VixAcX6VFc29KHr4KZg8cs2Y'
];

async function scanPrograms() {
  const conn = new Connection('https://api.mainnet-beta.solana.com');
  console.log('🔍 Scanning programs...\n');

  const accounts = await conn.getProgramAccounts(BPF_LOADER_UPGRADEABLE_ID, {
    filters: [{ dataSize: 36 }]
  });

  const results = { upgradeable: 0, immutable: 0, agentControlled: [] };

  for (const account of accounts.slice(0, 50)) {
    try {
      const upgradeAuthority = new PublicKey(account.account.data.slice(4, 36));
      const isUpgradeable = !upgradeAuthority.equals(PublicKey.default);
      const authorityStr = isUpgradeable ? upgradeAuthority.toBase58() : null;
      
      if (isUpgradeable) results.upgradeable++;
      else results.immutable++;

      if (authorityStr && AGENT_WALLETS.includes(authorityStr)) {
        results.agentControlled.push({
          programId: account.pubkey.toBase58(),
          authority: authorityStr,
          lamports: account.account.lamports
        });
      }
    } catch (e) {}
  }

  console.log(`📊 RESULTS (first 50 programs):`);
  console.log(`Upgradeable: ${results.upgradeable}`);
  console.log(`Immutable: ${results.immutable}`);
  console.log(`Agent Controlled: ${results.agentControlled.length}\n`);

  if (results.agentControlled.length > 0) {
    console.log('🤖 AGENT CONTROLLED:');
    results.agentControlled.forEach(p => {
      console.log(`${p.programId}`);
      console.log(`  Authority: ${p.authority}`);
      console.log(`  Value: ${(p.lamports / 1e9).toFixed(4)} SOL\n`);
    });
  }
}

scanPrograms().catch(console.error);