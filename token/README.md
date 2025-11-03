# Omega Prime Token – Zero-Cost SPL Token-2022 Deployment

Deploy a **Token-2022** mint, mint **1,000,000,000 ΩAGENT**, set Metaplex Core metadata, and lock authorities – **all paid by a relayer**.

## Setup

```bash
git clone <repo>
cd token
npm install
cp .env.sample .env
# edit .env with your values
```

## One-Command Deploy

```bash
npm run mainnet:all
```

## Scripts

| Script | Purpose |
|--------|---------|
| `dev:check` | Validate env + RPC + relayer health |
| `mainnet:create-mint` | Create mint (idempotent) |
| `mainnet:mint-initial` | Create ATA + mint supply |
| `mainnet:set-metadata` | Upsert Metaplex Core metadata |
| `mainnet:lock` | Set mint/freeze authorities |
| `mainnet:rollback` | Delete local cache (on-chain stays) |

## .env variables

```
RPC_URL=...
RELAYER_URL=...
RELAYER_PUBKEY=...
TREASURY_PUBKEY=...
DAO_PUBKEY=...               # optional
AUTHORITY_MODE=null          # null | dao | treasury
DRY_RUN=false
RELAYER_API_KEY=...          # optional
CONFIRMATION_TIMEOUT=30000
```

## Dry-run

```bash
DRY_RUN=true npm run mainnet:all
```

Shows base64, size, priority fee – no transaction is sent.

## Security & Safety

- **No private keys in repo** – USER_AUTH is generated locally (`.cache/user_auth.json`).
- **Relayer pays everything** – user needs 0 SOL.
- **Authority lock** – `AUTHORITY_MODE=null` permanently disables minting & freezing.

**WARNING**: Once set to `null` you cannot mint more tokens or unfreeze accounts.
Use `dao` or `treasury` if you need future control.

- **Idempotent** – every script checks on-chain state and skips if complete.
- **Replay guard** – fresh `recentBlockhash` on every tx.
- **Audit log** – `.cache/audit.json` records every signature, size, fee.

## Rollback

```bash
npm run mainnet:rollback
```

Deletes local cache. On-chain objects remain. Re-run `mainnet:all` to start over.

## Re-minting (if authority not null)

Edit `mintInitial.ts` → change supply → sign with the current mint authority.

## Explorer Links

- **Mint**: https://explorer.solana.com/address/<MINT>
- **Treasury ATA**: https://explorer.solana.com/address/<ATA>
- **Tx**: https://explorer.solana.com/tx/<SIG>