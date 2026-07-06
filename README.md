# SimplyVest Arc

**Issue, vest, and manage tokenized equity for your team — on Arc Testnet.**

SimplyVest is a tokenized equity vesting platform ported from Solana (Anchor/Rust) to **Arc Testnet** (EVM/Solidity). A full-stack protocol for time-based and milestone-gated token vesting, with a web2-first UX via Privy auth.

## What's Here

```
├── contracts/          Foundry project (Solidity)
│   ├── src/
│   │   ├── SimplyVest.sol          ← Core contract
│   │   └── interfaces/ISimplyVest.sol
│   ├── test/                       ← 38 tests (all passing)
│   └── script/Deploy.s.sol
├── packages/sdk/       TypeScript SDK (viem-based)
├── dapp/               Frontend adaptation configs
├── docs/               Architecture, deployment, integration guides
└── adr/                Architecture Decision Records
```

## Quick Start

```bash
# Build and test the contract
cd contracts
forge build
forge test

# Deploy to Arc Testnet
forge script script/Deploy.s.sol:DeploySimplyVest \
  --rpc-url arc_testnet \
  --broadcast
```

## Key Features

- **Time-based vesting** — linear streaming with optional cliff period
- **Milestone-gated vesting** — release tokens when a milestone authority triggers release
- **Cancel mid-stream** — creator can cancel, splitting vested/unvested tokens
- **Partial withdraws** — recipients claim specific amounts (not just all-or-nothing)
- **Self-vesting** — allowed for testing and self-reward patterns
- **Events** — full event emission for off-chain indexing

## Network

| Param | Value |
|-------|-------|
| Chain ID | 5042002 |
| RPC | `https://rpc.testnet.arc.network` |
| Gas | USDC |
| Faucet | `https://faucet.circle.com` |
| Explorer | `https://testnet.arcscan.app` |

## Docs

- [Architecture](docs/ARCHITECTURE.md)
- [Deployment](docs/DEPLOYMENT.md)
- [Integration Guide](docs/INTEGRATION_GUIDE.md)

## License

MIT
