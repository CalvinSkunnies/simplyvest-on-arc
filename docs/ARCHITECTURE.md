# SimplyVest Arc — Architecture

SimplyVest is a tokenized equity vesting protocol ported from Solana (Anchor/Rust) to Arc Testnet (EVM/Solidity). This document describes the on-chain contract architecture, storage model, instructions, events, and design decisions.

## Contents

1. [Smart Contract Architecture](#smart-contract-architecture)
2. [Storage Model](#storage-model)
3. [Instructions](#instructions)
4. [Events](#events)
5. [Vesting Math](#vesting-math)
6. [Design Decisions](#design-decisions)
7. [Solana → EVM Mapping](#solana--evm-mapping)

---

## Smart Contract Architecture

```
SimplyVest.sol
├── Stream (struct)              → time-based linear/cliff vesting
├── MilestoneStream (struct)     → milestone-gated vesting
├── creatorNonces (mapping)      → per-creator nonce for stream ID generation
├── streamIds (array)            → enumeration of all streams
├── milestoneStreamIds (array)   → enumeration of all milestone streams
└── 7 instructions + 6 view functions
```

The protocol uses a single `SimplyVest` contract holding all tokens in its own balance. No proxy, no factory — the contract is the source of truth.

### Entity Relationship

```
Creator ──┐
           ├── creates ──► Stream (time-based)
           │                    │
           │                    ├── holds tokens in contract balance
           │                    ├── recipient withdraws via `withdraw()`
           │                    └── creator can `cancel()` mid-stream
           │
           └── creates ──► MilestoneStream (milestone-gated)
                                │
                                ├── holds tokens in contract balance
                                ├── milestone_authority calls `triggerMilestone()`
                                ├── recipient calls `withdrawMilestone()`
                                └── creator can `cancelMilestone()` before trigger
```

---

## Storage Model

### Stream

| Field | Type | Description |
|-------|------|-------------|
| `creator` | `address` | Wallet that funded the stream. Only this wallet can cancel. |
| `recipient` | `address` | Wallet that receives vested tokens. Immutable. |
| `token` | `address` | ERC20 token address. |
| `amount` | `uint256` | Total tokens locked in this stream. |
| `amountWithdrawn` | `uint256` | Tokens already claimed. |
| `startTime` | `uint256` | Unix timestamp when vesting begins. |
| `cliffTime` | `uint256` | Unix timestamp of cliff; 0 means no cliff. |
| `endTime` | `uint256` | Unix timestamp when fully vested. |
| `cancelled` | `bool` | True if cancelled by creator. |

### MilestoneStream

| Field | Type | Description |
|-------|------|-------------|
| `creator` | `address` | Wallet that funded the stream. |
| `recipient` | `address` | Wallet that receives tokens. |
| `token` | `address` | ERC20 token address. |
| `amount` | `uint256` | Total tokens locked. |
| `amountWithdrawn` | `uint256` | Tokens already claimed (0 or amount). |
| `milestoneAuthority` | `address` | Wallet authorized to trigger the milestone. |
| `milestoneReached` | `bool` | True once triggered. |
| `cancelled` | `bool` | True if cancelled. |

### Stream ID Generation

```
streamId = keccak256(abi.encodePacked(creator, recipient, token, nonce))
milestoneStreamId = keccak256(abi.encodePacked("milestone", creator, recipient, token, nonce))
```

The `nonce` is an auto-incrementing counter per creator (`creatorNonces[creator]++`), enabling unlimited streams between the same creator-recipient-token triple.

---

## Instructions

### createStream

Initialize a time-based vesting stream. Validates parameters, transfers tokens from caller to contract, emits `StreamCreated`.

**Validations:**
- `amount > 0`
- `startTime < endTime`
- `cliffTime` (if nonzero) between `startTime` and `endTime`
- `endTime - startTime >= 60` seconds
- `startTime > block.timestamp`
- Recipient not zero address

### withdraw

Recipient claims a specific amount of vested tokens.

**Validations:**
- Not cancelled
- `block.timestamp >= cliffTime`
- `amount > 0`
- Claimable > 0
- `amount <= claimable`

**Claimable formula:**
```
if block.timestamp < cliffTime: 0
elif block.timestamp >= endTime: amount - amountWithdrawn
else: (amount * (block.timestamp - startTime) / (endTime - startTime)) - amountWithdrawn
```

### cancel

Creator cancels mid-stream. Recipient gets vested but unclaimed portion; creator gets the rest.

**Validations:**
- Only creator
- Not already cancelled
- `block.timestamp < endTime` (if past end time, use withdraw instead)

### createMilestoneStream

Creates a milestone-gated stream with a designated `milestoneAuthority`.

### triggerMilestone

Milestone authority marks the stream as reached, enabling recipient to withdraw all tokens.

### withdrawMilestone

Recipient claims the full amount after milestone is triggered. One-time operation.

### cancelMilestone

Creator cancels before milestone is triggered. All tokens returned to creator.

---

## Events

| Event | When |
|-------|------|
| `StreamCreated` | After successful `createStream` |
| `TokensClaimed` | On every `withdraw` |
| `StreamCompleted` | After final `withdraw` (amountWithdrawn == amount) |
| `StreamCancelled` | After `cancel` |
| `MilestoneStreamCreated` | After successful `createMilestoneStream` |
| `MilestoneTriggered` | After `triggerMilestone` |
| `MilestoneCompleted` | After `withdrawMilestone` |
| `MilestoneCancelled` | After `cancelMilestone` |

---

## Design Decisions

### Single contract vs factory pattern
Chose a single contract with mappings over a factory pattern. Simpler deployment, no proxy overhead, all data co-located. Trade-off: no upgradeability (intentional — immutability builds trust).

### Stream ID = hash vs sequential ID
Used `keccak256(creator, recipient, token, nonce)` which is deterministic and collision-resistant. Frontends can predict stream IDs before the transaction confirms.

### Status derived from data
`cancelled` is stored; `completed` is derived from `amountWithdrawn == amount`. This avoids sync issues between storage fields.

### block.timestamp
Same as Solana's Clock sysvar — validator-supplied, suitable for vesting applications.

---

## Solana → EVM Mapping

| Solana (Anchor) | EVM (Solidity) |
|----------------|----------------|
| PDA seeds for deterministic address | `keccak256` hash for ID |
| `StreamAccount` account | `Stream` struct in mapping |
| SPL Token vault | Contract's own ERC20 balance |
| CPI `invoke_signed` | Direct ERC20 `transfer`/`transferFrom` |
| Clock sysvar | `block.timestamp` |
| Anchor `emit!` | Solidity `emit` |
| Rent return on close | No rent in EVM — no close logic |
| ATA creation via CPI | Just `transfer` to recipient's address |
| `CreatorConfig` PDA | `mapping(address => uint256) creatorNonces` |
