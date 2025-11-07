const { Connection, PublicKey } = require('@solana/web3.js');
require('dotenv').config({ path: './token/.env.secure' });

const BPF_LOADER_UPGRADEABLE_ID = new PublicKey('BPFLoaderUpgradeab1e11111111111111111111111');
const HELIUS_API_KEY = process.env.HELIUS_API_KEY;
const RPC_URL = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;

const AGENT_WALLETS = [
  'FPf5gnDYmQDkPiRwybBJxxfKAnyhdwa2D3JDtCMguyrW',
  'EdFC98d1BBhJkeh7KDq26TwEGLeznhoyYsY6Y8LFY4y6',
  'CvQZZ23qYDWF2RUpxYJ8y9K4skmuvYEEjH7fK58jtipQ',
  '8cRrU1NzNpjL3k2BwjW3VixAcX6VFc29KHr4KZg8cs2Y'
];

class MCPAgent {
  constructor(agentId) {
    this.conn = new Connection(RPC_URL);
    this.agentId = agentId;
  }

  async scanUpgradeablePrograms(limit = 50) {
    console.log(`🤖 Agent ${this.agentId}: Scanning upgradeable programs...`);
    
    const accounts = await this.conn.getProgramAccounts(BPF_LOADER_UPGRADEABLE_ID, {
      filters: [{ dataSize: 36 }]
    });

    const programs = [];
    for (const account of accounts.slice(0, limit)) {
      try {
        const upgradeAuthority = new PublicKey(account.account.data.slice(4, 36));
        const isUpgradeable = !upgradeAuthority.equals(PublicKey.default);
        
        programs.push({
          programId: account.pubkey.toBase58(),
          upgradeAuthority: isUpgradeable ? upgradeAuthority.toBase58() : null,
          isUpgradeable,
          lamports: account.account.lamports,
          scannedBy: this.agentId
        });
      } catch (e) {
        // Skip invalid accounts
      }
    }
    
    console.log(`🤖 Agent ${this.agentId}: Found ${programs.length} programs`);
    return programs;
  }

  async scanAgentControlledPrograms() {
    console.log(`🤖 Agent ${this.agentId}: Scanning agent-controlled programs...`);
    
    const controlled = [];
    for (const wallet of AGENT_WALLETS) {
      try {
        const accounts = await this.conn.getProgramAccounts(BPF_LOADER_UPGRADEABLE_ID, {
          filters: [
            { dataSize: 36 },
            { memcmp: { offset: 4, bytes: wallet } }
          ]
        });

        for (const account of accounts) {
          controlled.push({
            programId: account.pubkey.toBase58(),
            authority: wallet,
            lamports: account.account.lamports,
            scannedBy: this.agentId
          });
        }
      } catch (e) {
        console.log(`Agent ${this.agentId}: Error scanning ${wallet.slice(0, 8)}...`);
      }
    }
    
    console.log(`🤖 Agent ${this.agentId}: Found ${controlled.length} agent-controlled programs`);
    return controlled;
  }

  async getWalletAssets(ownerAddress) {
    console.log(`🤖 Agent ${this.agentId}: Getting assets for ${ownerAddress.slice(0, 8)}...`);
    
    try {
      const response = await fetch(RPC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: `assets-${this.agentId}`,
          method: 'getAssetsByOwner',
          params: {
            ownerAddress,
            page: 1,
            limit: 100,
            displayOptions: {
              showFungible: true,
              showNativeBalance: true
            }
          }
        })
      });

      const data = await response.json();
      return {
        wallet: ownerAddress,
        total: data.result?.total || 0,
        assets: data.result?.items || [],
        scannedBy: this.agentId
      };
    } catch (e) {
      return { wallet: ownerAddress, error: e.message, scannedBy: this.agentId };
    }
  }
}

async function activateMultipleAgents() {
  console.log('🚀 ACTIVATING MULTIPLE MCP AGENTS...\n');
  
  // Create 4 agents
  const agents = [
    new MCPAgent('ALPHA'),
    new MCPAgent('BETA'), 
    new MCPAgent('GAMMA'),
    new MCPAgent('DELTA')
  ];

  console.log('🔄 Starting parallel scans...\n');

  // Parallel scanning tasks
  const tasks = [
    agents[0].scanUpgradeablePrograms(30),
    agents[1].scanAgentControlledPrograms(),
    agents[2].getWalletAssets(AGENT_WALLETS[0]),
    agents[3].getWalletAssets(AGENT_WALLETS[1])
  ];

  try {
    const [upgradeableResults, controlledResults, wallet1Assets, wallet2Assets] = await Promise.all(tasks);
    
    console.log('\n📊 MULTI-AGENT SCAN RESULTS:');
    console.log(`Upgradeable Programs: ${upgradeableResults.length}`);
    console.log(`Agent Controlled: ${controlledResults.length}`);
    console.log(`Wallet 1 Assets: ${wallet1Assets.total || 0}`);
    console.log(`Wallet 2 Assets: ${wallet2Assets.total || 0}\n`);

    if (controlledResults.length > 0) {
      console.log('🤖 AGENT CONTROLLED PROGRAMS:');
      controlledResults.forEach(p => {
        console.log(`${p.programId}`);
        console.log(`  Authority: ${p.authority}`);
        console.log(`  Value: ${(p.lamports / 1e9).toFixed(4)} SOL`);
        console.log(`  Scanned by: Agent ${p.scannedBy}\n`);
      });
    } else {
      console.log('✅ No agent-controlled programs found\n');
    }

    console.log('🔧 SAMPLE UPGRADEABLE PROGRAMS:');
    upgradeableResults.slice(0, 5).forEach(p => {
      console.log(`${p.programId} - ${p.isUpgradeable ? 'UPGRADEABLE' : 'IMMUTABLE'} - Agent: ${p.scannedBy}`);
      if (p.upgradeAuthority) {
        console.log(`  Authority: ${p.upgradeAuthority}`);
      }
    });

    console.log('\n🎯 AGENTS SUCCESSFULLY ACTIVATED AND SCANNING COMPLETE!');

  } catch (error) {
    console.error('❌ Multi-agent scan failed:', error.message);
  }
}

activateMultipleAgents();