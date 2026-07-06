# SimplyVest Arc — Deployment Guide

## Prerequisites

- [Foundry](https://book.getfoundry.sh/getting-started/installation)
- A wallet with testnet USDC on Arc Testnet
- Registered on [Circle Faucet](https://faucet.circle.com)

## Network Details

| Parameter | Value |
|-----------|-------|
| Network | Arc Testnet |
| Chain ID | `5042002` |
| RPC URL | `https://rpc.testnet.arc.network` |
| Currency | USDC (18 decimals) |
| Explorer | `https://testnet.arcscan.app` |
| Faucet | `https://faucet.circle.com` |

## Step 1: Get Testnet USDC

1. Visit https://faucet.circle.com
2. Select **Arc Testnet**
3. Paste your wallet address
4. Request testnet USDC (this is used for gas)

## Step 2: Configure Environment

```bash
cd contracts
cp .env.example .env
```

Edit `.env` and add your private key:
```
PRIVATE_KEY=your_wallet_private_key_here
```

> **Security:** Never commit `.env`. It's in `.gitignore`.

## Step 3: Deploy

```bash
# Using a private key from .env
forge script script/Deploy.s.sol:DeploySimplyVest \
  --rpc-url arc_testnet \
  --broadcast \
  -vvvv

# Or use a hardware wallet / Ledger (sender signs)
forge script script/Deploy.s.sol:DeploySimplyVestSafe \
  --rpc-url arc_testnet \
  --broadcast \
  --sender $YOUR_ADDRESS \
  -vvvv
```

## Step 4: Verify on Etherscan

```bash
forge verify-contract <DEPLOYED_ADDRESS> \
  src/SimplyVest.sol:SimplyVest \
  --rpc-url arc_testnet \
  --verifier-url https://testnet.arcscan.app/api/ \
  --etherscan-api-key <optional>
```

## Step 5: Update Frontend

Copy the deployed contract address into `dapp/.env.local`:
```
VITE_SIMPLY_VEST_ADDRESS=0x...
```

## Deployments

| Network | Address | Block | Date |
|---------|---------|-------|------|
| Arc Testnet | TBD | TBD | TBD |

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `insufficient funds` | No USDC for gas | Request from faucet |
| `execution reverted` | Contract validation failed | Check event logs via explorer |
| `nonce too low` | Stale local nonce | Reset with `eth_nonce` or wait for pending tx |
