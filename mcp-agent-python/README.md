# Helius Solana MCP Agent (Python)

Minimal Python MCP server with Helius RPC integration.

## Setup

```bash
pip install mcp httpx solders
chmod +x server.py
```

## Run

```bash
export HELIUS_API_KEY="your_key_here"
python server.py
```

## Claude Desktop Config

```json
{
  "mcpServers": {
    "helius-solana": {
      "command": "python",
      "args": ["/workspaces/Omega-prime-deployer/mcp-agent-python/server.py"],
      "env": {
        "HELIUS_API_KEY": "your_helius_key_here"
      }
    }
  }
}
```

## Tools

- `get_wallet_assets` - Get all assets from your wallet
- `get_token_info` - Get token metadata
- `get_account_info` - Get account details
- `get_latest_block` - Get current block and slot
- `get_token_holders` - Get all holders of a token
- `get_nft_metadata` - Get NFT metadata and ownership
- `get_transaction_history` - Get transaction history for address
- `parse_transaction` - Parse and decode transaction details
