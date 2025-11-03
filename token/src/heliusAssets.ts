import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.secure' });

const HELIUS_API_KEY = process.env.HELIUS_API_KEY;
const HELIUS_RPC = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;

interface AssetsByGroupParams {
  groupKey: 'collection' | 'creator' | 'owner' | 'authority';
  groupValue: string;
  page?: number;
  limit?: number;
}

export async function getAssetsByProgram(programId: string, page = 1, limit = 1000) {
  const response = await axios.post(HELIUS_RPC, {
    jsonrpc: '2.0',
    id: 'asset-query',
    method: 'getAssetsByGroup',
    params: {
      groupKey: 'authority',
      groupValue: programId,
      page,
      limit
    }
  });

  return response.data.result;
}

// Alternative: Get assets by owner
export async function getAssetsByOwner(ownerAddress: string, page = 1, limit = 1000) {
  const response = await axios.post(HELIUS_RPC, {
    jsonrpc: '2.0',
    id: 'asset-query',
    method: 'getAssetsByOwner',
    params: {
      ownerAddress,
      page,
      limit,
      displayOptions: {
        showFungible: true,
        showNativeBalance: true
      }
    }
  });

  return response.data.result;
}

// Example usage
async function main() {
  const TOKEN_2022_PROGRAM = 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb';
  
  const assets = await getAssetsByProgram(TOKEN_2022_PROGRAM, 1, 100);
  console.log('Total assets:', assets.total);
  console.log('Assets:', JSON.stringify(assets.items, null, 2));
}

if (require.main === module) {
  main().catch(console.error);
}
