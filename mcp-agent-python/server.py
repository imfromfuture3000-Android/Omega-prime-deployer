#!/usr/bin/env python3
import os
import json
import asyncio
import httpx
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Tool, TextContent
from solders.keypair import Keypair

HELIUS_API_KEY = os.getenv("HELIUS_API_KEY", "")
RPC_URL = f"https://mainnet.helius-rpc.com/?api-key={HELIUS_API_KEY}" if HELIUS_API_KEY else "https://api.mainnet-beta.solana.com"

app = Server("helius-solana-mcp")

def load_wallet():
    wallet_path = os.getenv("WALLET_PATH", "../token/.cache/new-authority.json")
    if not os.path.exists(wallet_path):
        raise FileNotFoundError(f"Wallet not found: {wallet_path}")
    with open(wallet_path) as f:
        secret = json.load(f)
    return Keypair.from_bytes(bytes(secret))

@app.list_tools()
async def list_tools() -> list[Tool]:
    return [
        Tool(
            name="get_wallet_assets",
            description="Get all assets owned by wallet",
            inputSchema={
                "type": "object",
                "properties": {
                    "owner": {"type": "string", "description": "Wallet address (optional)"}
                }
            }
        ),
        Tool(
            name="get_token_info",
            description="Get token supply and metadata",
            inputSchema={
                "type": "object",
                "properties": {
                    "mint": {"type": "string", "description": "Token mint address"}
                },
                "required": ["mint"]
            }
        ),
        Tool(
            name="get_account_info",
            description="Get Solana account information",
            inputSchema={
                "type": "object",
                "properties": {
                    "address": {"type": "string", "description": "Account address"}
                },
                "required": ["address"]
            }
        ),
        Tool(
            name="get_latest_block",
            description="Get the latest block information",
            inputSchema={
                "type": "object",
                "properties": {}
            }
        ),
        Tool(
            name="get_token_holders",
            description="Get all holders of a token",
            inputSchema={
                "type": "object",
                "properties": {
                    "mint": {"type": "string", "description": "Token mint address"}
                },
                "required": ["mint"]
            }
        ),
        Tool(
            name="get_nft_metadata",
            description="Get NFT metadata and ownership",
            inputSchema={
                "type": "object",
                "properties": {
                    "mint": {"type": "string", "description": "NFT mint address"}
                },
                "required": ["mint"]
            }
        ),
        Tool(
            name="get_transaction_history",
            description="Get transaction history for address",
            inputSchema={
                "type": "object",
                "properties": {
                    "address": {"type": "string", "description": "Wallet address"},
                    "limit": {"type": "number", "description": "Number of transactions (default 100)"}
                },
                "required": ["address"]
            }
        ),
        Tool(
            name="parse_transaction",
            description="Parse and decode transaction details",
            inputSchema={
                "type": "object",
                "properties": {
                    "signature": {"type": "string", "description": "Transaction signature"}
                },
                "required": ["signature"]
            }
        )
    ]

@app.call_tool()
async def call_tool(name: str, arguments: dict) -> list[TextContent]:
    async with httpx.AsyncClient() as client:
        if name == "get_wallet_assets":
            owner = arguments.get("owner")
            if not owner:
                wallet = load_wallet()
                owner = str(wallet.pubkey())
            
            response = await client.post(RPC_URL, json={
                "jsonrpc": "2.0",
                "id": "assets",
                "method": "getAssetsByOwner",
                "params": {
                    "ownerAddress": owner,
                    "page": 1,
                    "limit": 1000,
                    "displayOptions": {
                        "showFungible": True,
                        "showNativeBalance": True
                    }
                }
            })
            data = response.json()
            result = {
                "wallet": owner,
                "total": data.get("result", {}).get("total", 0),
                "assets": data.get("result", {}).get("items", [])
            }
            return [TextContent(type="text", text=json.dumps(result, indent=2))]
        
        elif name == "get_token_info":
            mint = arguments["mint"]
            response = await client.post(RPC_URL, json={
                "jsonrpc": "2.0",
                "id": "token",
                "method": "getAsset",
                "params": {"id": mint}
            })
            return [TextContent(type="text", text=json.dumps(response.json(), indent=2))]
        
        elif name == "get_account_info":
            address = arguments["address"]
            response = await client.post(RPC_URL, json={
                "jsonrpc": "2.0",
                "id": "account",
                "method": "getAccountInfo",
                "params": [address, {"encoding": "jsonParsed"}]
            })
            return [TextContent(type="text", text=json.dumps(response.json(), indent=2))]
        
        elif name == "get_latest_block":
            slot_response = await client.post(RPC_URL, json={
                "jsonrpc": "2.0",
                "id": "slot",
                "method": "getSlot"
            })
            slot = slot_response.json()["result"]
            
            block_response = await client.post(RPC_URL, json={
                "jsonrpc": "2.0",
                "id": "block",
                "method": "getBlock",
                "params": [slot, {"maxSupportedTransactionVersion": 0}]
            })
            return [TextContent(type="text", text=json.dumps(block_response.json(), indent=2))]
        
        elif name == "get_token_holders":
            mint = arguments["mint"]
            response = await client.post(RPC_URL, json={
                "jsonrpc": "2.0",
                "id": "holders",
                "method": "getTokenAccounts",
                "params": {"mint": mint}
            })
            return [TextContent(type="text", text=json.dumps(response.json(), indent=2))]
        
        elif name == "get_nft_metadata":
            mint = arguments["mint"]
            response = await client.post(RPC_URL, json={
                "jsonrpc": "2.0",
                "id": "nft",
                "method": "getAsset",
                "params": {"id": mint}
            })
            return [TextContent(type="text", text=json.dumps(response.json(), indent=2))]
        
        elif name == "get_transaction_history":
            address = arguments["address"]
            limit = arguments.get("limit", 100)
            response = await client.post(RPC_URL, json={
                "jsonrpc": "2.0",
                "id": "history",
                "method": "getSignaturesForAddress",
                "params": [address, {"limit": limit}]
            })
            return [TextContent(type="text", text=json.dumps(response.json(), indent=2))]
        
        elif name == "parse_transaction":
            signature = arguments["signature"]
            response = await client.post(RPC_URL, json={
                "jsonrpc": "2.0",
                "id": "parse",
                "method": "getParsedTransaction",
                "params": [signature, {"maxSupportedTransactionVersion": 0}]
            })
            return [TextContent(type="text", text=json.dumps(response.json(), indent=2))]
        
        raise ValueError(f"Unknown tool: {name}")

async def main():
    async with stdio_server() as (read_stream, write_stream):
        await app.run(read_stream, write_stream, app.create_initialization_options())

if __name__ == "__main__":
    asyncio.run(main())
