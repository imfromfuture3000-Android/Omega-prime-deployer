#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import { config } from 'dotenv';
import { readFileSync } from 'fs';

config({ path: '../token/.env.secure' });

const HELIUS_API_KEY = process.env.HELIUS_API_KEY!;
const RPC_URL = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;

const server = new Server(
  {
    name: 'solscan-mcp-agent',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'get_account_info',
        description: 'Get detailed account information from Solana',
        inputSchema: {
          type: 'object',
          properties: {
            address: { type: 'string', description: 'Solana account address' }
          },
          required: ['address']
        }
      },
      {
        name: 'get_token_info',
        description: 'Get token supply information',
        inputSchema: {
          type: 'object',
          properties: {
            address: { type: 'string', description: 'Token mint address' }
          },
          required: ['address']
        }
      },
      {
        name: 'get_transaction',
        description: 'Get transaction details by signature',
        inputSchema: {
          type: 'object',
          properties: {
            signature: { type: 'string', description: 'Transaction signature' }
          },
          required: ['signature']
        }
      },
      {
        name: 'scan_upgradeable_programs',
        description: 'Scan all upgradeable programs on Solana',
        inputSchema: {
          type: 'object',
          properties: {},
          required: []
        }
      },
      {
        name: 'check_program_upgradeable',
        description: 'Check if specific program is upgradeable',
        inputSchema: {
          type: 'object',
          properties: {
            programId: { type: 'string', description: 'Program ID to check' }
          },
          required: ['programId']
        }
      },
      {
        name: 'get_wallet_assets',
        description: 'Get all assets owned by wallet using Helius DAS API',
        inputSchema: {
          type: 'object',
          properties: {
            ownerAddress: { type: 'string', description: 'Wallet address (optional, uses default wallet if not provided)' }
          },
          required: []
        }
      }
    ]
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (!args) {
    throw new Error('Arguments required');
  }

  try {
    switch (name) {
      case 'get_account_info': {
        const conn = new Connection(RPC_URL);
        const address = (args as any).address as string;
        const pubkey = new PublicKey(address);
        const info = await conn.getAccountInfo(pubkey);
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              address,
              lamports: info?.lamports || 0,
              owner: info?.owner.toBase58() || null,
              executable: info?.executable || false,
              rentEpoch: info?.rentEpoch || null
            }, null, 2)
          }]
        };
      }

      case 'get_token_info': {
        const conn = new Connection(RPC_URL);
        const address = (args as any).address as string;
        const mint = new PublicKey(address);
        const supply = await conn.getTokenSupply(mint);
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              mint: address,
              supply: supply.value.amount,
              decimals: supply.value.decimals
            }, null, 2)
          }]
        };
      }

      case 'get_transaction': {
        const conn = new Connection(RPC_URL);
        const signature = (args as any).signature as string;
        const tx = await conn.getTransaction(signature, {
          maxSupportedTransactionVersion: 0
        });
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              signature,
              slot: tx?.slot || null,
              blockTime: tx?.blockTime || null,
              fee: tx?.meta?.fee || null,
              status: tx?.meta?.err ? 'failed' : 'success'
            }, null, 2)
          }]
        };
      }

      case 'scan_upgradeable_programs': {
        const { scanUpgradeablePrograms } = await import('./upgradeable-scanner.js');
        const conn = new Connection(RPC_URL);
        const programs = await scanUpgradeablePrograms(conn);
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              total: programs.length,
              upgradeable: programs.filter(p => p.isUpgradeable).length,
              programs: programs.slice(0, 50) // Limit output
            }, null, 2)
          }]
        };
      }

      case 'check_program_upgradeable': {
        const { checkProgramUpgradeability } = await import('./upgradeable-scanner.js');
        const conn = new Connection(RPC_URL);
        const programId = (args as any).programId as string;
        const result = await checkProgramUpgradeability(conn, programId);
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }

      case 'get_wallet_assets': {
        let ownerAddress = (args as any).ownerAddress as string | undefined;
        
        if (!ownerAddress) {
          const secretKey = JSON.parse(readFileSync('../token/.cache/new-authority.json', 'utf-8'));
          const keypair = Keypair.fromSecretKey(new Uint8Array(secretKey));
          ownerAddress = keypair.publicKey.toString();
        }

        const response = await fetch(RPC_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 'wallet-assets',
            method: 'getAssetsByOwner',
            params: {
              ownerAddress,
              page: 1,
              limit: 1000,
              displayOptions: {
                showFungible: true,
                showNativeBalance: true
              }
            }
          })
        });

        const data = await response.json();
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              wallet: ownerAddress,
              total: data.result?.total || 0,
              assets: data.result?.items || []
            }, null, 2)
          }]
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `Error: ${error instanceof Error ? error.message : String(error)}`
      }],
      isError: true
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);