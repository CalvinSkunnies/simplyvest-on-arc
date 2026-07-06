# SimplyVest Arc — Integration Guide

This guide shows how to integrate SimplyVest into your dApp or script using the SDK and wagmi/viem.

## Installation

```bash
npm install @simplyvest/sdk viem wagmi
```

## Setup

```ts
import { createConfig, http } from "wagmi";
import { defineChain } from "viem";
import { SIMPLY_VEST_ABI } from "@simplyvest/sdk";

const arcTestnet = defineChain({
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.testnet.arc.network"] } },
  blockExplorers: { default: { name: "Arcscan", url: "https://testnet.arcscan.app" } },
});

const config = createConfig({
  chains: [arcTestnet],
  transports: { [arcTestnet.id]: http() },
});
```

## Create a Vesting Stream

```ts
import { useWriteContract } from "wagmi";

const { writeContract } = useWriteContract();

// Create a linear vesting stream with a 1-year cliff and 4-year total
writeContract({
  address: "0x<deployed-contract>",
  abi: SIMPLY_VEST_ABI,
  functionName: "createStream",
  args: [
    "0x<recipient>",   // recipient address
    "0x<token>",       // ERC20 token address
    1000000n,          // amount (in token decimals)
    1700000000n,       // startTime (unix timestamp)
    1730000000n,       // cliffTime  (unix timestamp, 0 = no cliff)
    1820000000n,       // endTime    (unix timestamp)
  ],
});
```

## Withdraw Vested Tokens

```ts
// Read claimable amount
const { data: claimable } = useReadContract({
  address: "0x<contract>",
  abi: SIMPLY_VEST_ABI,
  functionName: "getClaimable",
  args: [streamId],
});

// Claim
writeContract({
  address: "0x<contract>",
  abi: SIMPLY_VEST_ABI,
  functionName: "withdraw",
  args: [streamId, claimable],
});
```

## Cancel a Stream

```ts
writeContract({
  address: "0x<contract>",
  abi: SIMPLY_VEST_ABI,
  functionName: "cancel",
  args: [streamId],
});
```

## Milestone Stream Flow

```ts
// 1. Creator creates milestone stream
writeContract({
  address: "0x<contract>",
  abi: SIMPLY_VEST_ABI,
  functionName: "createMilestoneStream",
  args: ["0x<recipient>", "0x<token>", 1000000n, "0x<milestone-authority>"],
});

// 2. Milestone authority triggers it
writeContract({
  address: "0x<contract>",
  abi: SIMPLY_VEST_ABI,
  functionName: "triggerMilestone",
  args: [streamId],
});

// 3. Recipient withdraws
writeContract({
  address: "0x<contract>",
  abi: SIMPLY_VEST_ABI,
  functionName: "withdrawMilestone",
  args: [streamId],
});
```

## Off-chain Vesting Math

The SDK provides stateless vesting calculations for UIs:

```ts
import { getClaimableAmount, computeVested, getVestedPercent } from "@simplyvest/sdk";

const stream = await getStream(streamId);
const now = BigInt(Math.floor(Date.now() / 1000));

const claimable = getClaimableAmount(stream, now);
const percent = getVestedPercent(stream, now);
console.log(`Vested: ${percent}%, Claimable: ${claimable}`);
```

## Event Indexing

Parse events from transaction receipts using viem:

```ts
import { parseEventLogs } from "viem";

const logs = parseEventLogs({
  abi: SIMPLY_VEST_ABI,
  logs: receipt.logs,
  eventName: "StreamCreated",
});
// logs[0].args.creator, logs[0].args.recipient, etc.
```

## Approvals

Before calling `createStream` or `createMilestoneStream`, the caller must approve the SimplyVest contract to spend their tokens:

```ts
// ERC20 approve
writeContract({
  address: tokenAddress,
  abi: erc20Abi,
  functionName: "approve",
  args: [simplyVestAddress, amount],
});
```

## Error Reference

| Error | Cause |
|-------|-------|
| `ZeroAmount()` | Amount is 0 |
| `InvalidTimeRange()` | `startTime >= endTime` |
| `InvalidCliffTime()` | Cliff outside [start, end] |
| `DurationTooShort()` | Duration < 60 seconds |
| `StartTimeInPast()` | `startTime <= block.timestamp` |
| `CliffNotReached()` | Withdraw before cliff |
| `NothingToWithdraw()` | No tokens available |
| `ExceedsClaimable()` | Amount > claimable |
| `Unauthorized()` | Wrong caller |
| `StreamExpired()` | Cancel after end time |
| `AlreadyTriggered()` | Milestone already triggered |
| `FullyVested()` | Cancel after milestone reached |
