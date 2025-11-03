# Security Guidelines

## Sensitive Files Protected

### Environment Files
- `.env*` - All environment configuration files
- `.env.secure` - API keys and credentials

### Wallet & Keypairs
- `**/.cache/` - All cache directories containing keypairs
- `**/new-authority.json` - Wallet keypairs
- `**/mint-keypair.json` - Token mint keys
- `**/wallet.json` - Wallet files
- `*.key`, `*.pem` - Private keys

### Configuration
All sensitive files are gitignored and should NEVER be committed.

## Setup Secure Environment

1. Copy example files:
```bash
cp .env.example .env
cp mcp-agent-python/.env.example mcp-agent-python/.env
```

2. Add your API keys to `.env` files

3. Generate new wallet if needed:
```bash
cd token
node generate-new-key.js
```

## API Keys Required

- `HELIUS_API_KEY` - Helius RPC access
- `MORALIS_API_KEY` - Moralis Web3 API
- `ALCHEMY_API_KEY` - Alchemy RPC
- `ETHERSCAN_API_KEY` - Etherscan verification

## Best Practices

- Never commit `.env` files
- Never commit wallet keypairs
- Use environment variables for all secrets
- Rotate API keys regularly
- Keep `.cache/` directories local only
