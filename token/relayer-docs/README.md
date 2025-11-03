# Relayer Integration Documentation

## Overview

The Omega Prime deployer uses a relayer service to enable zero-cost transactions for users. The relayer covers all transaction fees while maintaining security through proper transaction validation.

## Relayer Endpoints

### Health Check
```
GET /health
```
Returns 200 OK if relayer is operational.

### Send Transaction
```
POST /relay/sendRawTransaction
Content-Type: application/json
Authorization: Bearer <API_KEY> (optional)

{
  "signedTransactionBase64": "<base64_encoded_transaction>"
}
```

**Response:**
```json
{
  "success": true,
  "txSignature": "signature_string"
}
```

## Security Model

1. **Fee Payer Override**: Relayer replaces the fee payer field with its own public key
2. **Priority Fee Management**: Dynamic priority fees based on network conditions
3. **Retry Logic**: 3 attempts with exponential backoff
4. **Confirmation**: Waits for transaction confirmation before returning

## Configuration

Set these environment variables:
- `RELAYER_URL`: Full endpoint URL
- `RELAYER_PUBKEY`: Public key of the relayer's fee payer account
- `RELAYER_API_KEY`: Optional authentication token

## Audit Trail

All transactions are logged to `.cache/audit.json` with:
- Timestamp
- Transaction signature
- Transaction size
- Priority fee paid
- Program ID of first instruction