# Omega Prime Deployer

Multi-chain deployment framework with AI-powered blockchain intelligence.

## Components

### 1. Token Deployment (`/token`)
- SPL Token-2022 deployment on Solana
- Zero-cost relayer integration
- Secure environment management

### 2. MCP Agent (`/mcp-agent`) 
- Solana blockchain query tools
- Account, token, and transaction analysis
- Upgradeable program scanning

### 3. Moralis Cortex Integration
- AI-powered Web3 intelligence
- Natural language blockchain queries
- Multi-chain portfolio analysis

## API Keys Secured
- ✅ Solana API (JWT)
- ✅ Alchemy API 
- ✅ Etherscan API
- ✅ Moralis API

## Quick Start

### Deploy Token
```bash
cd token
npm install
npm run devnet:all
```

### Run MCP Agent
```bash
cd mcp-agent
npm run build
node dist/index.js
```

### Test Moralis Integration
```bash
cd token
npx ts-node src/moralisQuery.ts
```

## Moralis Cortex Setup

Add to Claude Desktop config:
```json
{
  "mcpServers": {
    "moralis": {
      "command": "npx",
      "args": ["@moralisweb3/api-mcp-server", "--transport", "stdio"],
      "env": {
        "MORALIS_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

## Example Queries
- "What tokens does vitalik.eth hold?"
- "Show me the current price of PEPE and Ethereum"
- "Analyze wallet 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"

## Security
All API keys stored in `.env.secure` (gitignored)