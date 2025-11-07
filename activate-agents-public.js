const { Connection, PublicKey } = require('@solana/web3.js');

const BPF_LOADER_UPGRADEABLE_ID = new PublicKey('BPFLoaderUpgradeab1e11111111111111111111111');
const PUBLIC_RPC = 'https://api.mainnet-beta.solana.com';

const AGENT_WALLETS = [
  'FPf5gnDYmQDkPiRwybBJxxfKAnyhdwa2D3JDtCMguyrW',
  'EdFC98d1BBhJkeh7KDq26TwEGLeznhoyYsY6Y8LFY4y6',
  'CvQZZ23qYDWF2RUpxYJ8y9K4skmuvYEEjH7fK58jtipQ',
  '8cRrU1NzNpjL3k2BwjW3VixAcX6VFc29KHr4KZg8cs2Y'
];

class MCPAgent {
  constructor(agentId) {
    this.conn = new Connection(PUBLIC_RPC);
    this.agentId = agentId;
  }

  async scanUpgradeablePrograms(limit = 20) {
    console.log(`🤖 Agent ${this.agentId}: Scanning upgradeable programs...`);
    
    try {
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
    } catch (e) {
      console.log(`🤖 Agent ${this.agentId}: Error - ${e.message}`);
      return [];
    }
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

  async checkProgramInfo(programId) {
    console.log(`🤖 Agent ${this.agentId}: Checking program ${programId.slice(0, 8)}...`);
    
    try {
      const pubkey = new PublicKey(programId);
      const account = await this.conn.getAccountInfo(pubkey);
      
      if (!account) {
        return { programId, exists: false, scannedBy: this.agentId };
      }

      return {
        programId,
        exists: true,
        owner: account.owner.toBase58(),
        lamports: account.lamports,
        executable: account.executable,
        scannedBy: this.agentId
      };
    } catch (e) {
      return { programId, error: e.message, scannedBy: this.agentId };
    }
  }
}

async function activateMultipleAgents() {
  console.log('🚀 ACTIVATING MULTIPLE MCP AGENTS WITH PUBLIC RPC...\n');
  
  // Create 4 agents
  const agents = [
    new MCPAgent('ALPHA'),
    new MCPAgent('BETA'), 
    new MCPAgent('GAMMA'),
    new MCPAgent('DELTA')
  ];

  console.log('🔄 Starting parallel scans...\n');

  // Sample program IDs to check
  const samplePrograms = [
    '11111111111111111111111111111111',
    'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
    'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL'
  ];

  // Parallel scanning tasks
  const tasks = [
    agents[0].scanUpgradeablePrograms(15),
    agents[1].scanAgentControlledPrograms(),
    agents[2].checkProgramInfo(samplePrograms[0]),
    agents[3].checkProgramInfo(samplePrograms[1])
  ];

  try {
    const [upgradeableResults, controlledResults, program1Info, program2Info] = await Promise.all(tasks);
    
    console.log('\n📊 MULTI-AGENT SCAN RESULTS:');
    console.log(`Upgradeable Programs Found: ${upgradeableResults.length}`);
    console.log(`Agent Controlled Programs: ${controlledResults.length}`);
    console.log(`Program Checks Completed: 2\n`);

    if (controlledResults.length > 0) {
      console.log('🤖 AGENT CONTROLLED PROGRAMS:');
      controlledResults.forEach(p => {
        console.log(`${p.programId}`);
        console.log(`  Authority: ${p.authority}`);
        console.log(`  Value: ${(p.lamports / 1e9).toFixed(4)} SOL`);
        console.log(`  Scanned by: Agent ${p.scannedBy}\n`);
      });
    } else {
      console.log('✅ No agent-controlled programs found (expected for security)\n');
    }

    console.log('🔧 UPGRADEABLE PROGRAMS SAMPLE:');
    upgradeableResults.slice(0, 5).forEach(p => {
      console.log(`${p.programId} - ${p.isUpgradeable ? 'UPGRADEABLE' : 'IMMUTABLE'} - Agent: ${p.scannedBy}`);
      if (p.upgradeAuthority) {
        console.log(`  Authority: ${p.upgradeAuthority.slice(0, 8)}...`);
      }
    });

    console.log('\n🔍 PROGRAM INFO CHECKS:');
    console.log(`System Program: ${program1Info.exists ? 'EXISTS' : 'NOT FOUND'} - Agent: ${program1Info.scannedBy}`);
    console.log(`Token Program: ${program2Info.exists ? 'EXISTS' : 'NOT FOUND'} - Agent: ${program2Info.scannedBy}`);

    console.log('\n🎯 ALL MCP AGENTS ACTIVATED AND SCANNING COMPLETE!');
    console.log(`Total Programs Scanned: ${upgradeableResults.length + controlledResults.length + 2}`);

  } catch (error) {
    console.error('❌ Multi-agent scan failed:', error.message);
  }
}

activateMultipleAgents();