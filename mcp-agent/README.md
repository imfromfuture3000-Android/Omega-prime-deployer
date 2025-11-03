# Solscan MCP Agent

Model Context Protocol (MCP) agent for Solana blockchain data queries.

## Installation

```bash
npm install
npm run build
```

## Usage

The agent provides three tools:

### get_account_info
Get detailed account information from Solana RPC.

```json
{
  "name": "get_account_info",
  "arguments": {
    "address": "3fu7ALfc1XrA1rZxRrq4ifhs1SPp6TkW9exkestRbGrH"
  }
}
```

### get_token_info
Get token supply and metadata information.

```json
{
  "name": "get_token_info", 
  "arguments": {
    "address": "3fu7ALfc1XrA1rZxRrq4ifhs1SPp6TkW9exkestRbGrH"
  }
}
```

### get_transaction
Get transaction details by signature.

```json
{
  "name": "get_transaction",
  "arguments": {
    "signature": "PH9UyFinsqtiWBh3ji9Jqrmk3vtaYAmfLz96PAufDYvpCpcAh46VAkaRjmYpJgAqfooWUJLnmKarnEWBvnMSnUE"
  }
}
```

## MCP Configuration

Add to your MCP client configuration:

```json
{
  "mcpServers": {
    "solscan": {
      "command": "node",
      "args": ["/path/to/mcp-agent/dist/index.js"]
    }
  }
}
```