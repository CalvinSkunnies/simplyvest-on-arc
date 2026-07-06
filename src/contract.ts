import { useCallback, useState } from "react";
import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  type Address,
  type Hash,
  type TransactionReceipt,
  parseUnits,
  type UserRejectedRequestError,
} from "viem";
import { formatError } from "./errors";
import { arcTestnet } from "./arc-chain";
import { SIMPLY_VEST_ABI } from "./abi";

const CONTRACT = import.meta.env.VITE_SIMPLY_VEST_ADDRESS as Address;
const USDC = "0x07865c6E87B9F70255377e024ace6630C1Eaa37F";

function publicClient() {
  return createPublicClient({ chain: arcTestnet, transport: http() });
}

function walletClient() {
  return createWalletClient({
    chain: arcTestnet,
    transport: custom(window.ethereum!),
  });
}

async function wait(tx: Hash): Promise<TransactionReceipt> {
  return publicClient().waitForTransactionReceipt({ hash: tx });
}

export interface StreamData {
  creator: Address;
  recipient: Address;
  token: Address;
  amount: bigint;
  amountWithdrawn: bigint;
  startTime: bigint;
  cliffTime: bigint;
  endTime: bigint;
  cancelled: boolean;
}

export interface MilestoneStreamData {
  creator: Address;
  recipient: Address;
  token: Address;
  amount: bigint;
  amountWithdrawn: bigint;
  milestoneAuthority: Address;
  milestoneReached: boolean;
  cancelled: boolean;
}

export function useContract() {
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState<Hash | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setLoading(false);
    setTxHash(null);
    setError(null);
  }, []);

  const exec = useCallback(
    async <T>(fn: () => Promise<T>): Promise<T | undefined> => {
      setLoading(true);
      setTxHash(null);
      setError(null);
      try {
        const result = await fn();
        return result;
      } catch (e) {
        setError(formatError(e));
        return undefined;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const createStream = useCallback(
    async (
      recipient: Address,
      token: Address,
      amount: string,
      startTime: number,
      cliffTime: number,
      endTime: number
    ) => {
      return exec(async () => {
        const wc = walletClient();
        const [addr] = await wc.requestAddresses();
        const tx = await wc.writeContract({
          address: CONTRACT,
          abi: SIMPLY_VEST_ABI,
          functionName: "createStream",
          args: [
            recipient,
            token,
            parseUnits(amount, 18),
            BigInt(startTime),
            BigInt(cliffTime),
            BigInt(endTime),
          ],
          account: addr,
        });
        setTxHash(tx);
        return wait(tx);
      });
    },
    [exec]
  );

  const withdraw = useCallback(
    async (streamId: `0x${string}`, amount: string) => {
      return exec(async () => {
        const wc = walletClient();
        const [addr] = await wc.requestAddresses();
        const tx = await wc.writeContract({
          address: CONTRACT,
          abi: SIMPLY_VEST_ABI,
          functionName: "withdraw",
          args: [streamId, parseUnits(amount, 18)],
          account: addr,
        });
        setTxHash(tx);
        return wait(tx);
      });
    },
    [exec]
  );

  const cancel = useCallback(
    async (streamId: `0x${string}`) => {
      return exec(async () => {
        const wc = walletClient();
        const [addr] = await wc.requestAddresses();
        const tx = await wc.writeContract({
          address: CONTRACT,
          abi: SIMPLY_VEST_ABI,
          functionName: "cancel",
          args: [streamId],
          account: addr,
        });
        setTxHash(tx);
        return wait(tx);
      });
    },
    [exec]
  );

  const createMilestoneStream = useCallback(
    async (recipient: Address, token: Address, amount: string, milestoneAuthority: Address) => {
      return exec(async () => {
        const wc = walletClient();
        const [addr] = await wc.requestAddresses();
        const tx = await wc.writeContract({
          address: CONTRACT,
          abi: SIMPLY_VEST_ABI,
          functionName: "createMilestoneStream",
          args: [recipient, token, parseUnits(amount, 18), milestoneAuthority],
          account: addr,
        });
        setTxHash(tx);
        return wait(tx);
      });
    },
    [exec]
  );

  const triggerMilestone = useCallback(
    async (streamId: `0x${string}`) => {
      return exec(async () => {
        const wc = walletClient();
        const [addr] = await wc.requestAddresses();
        const tx = await wc.writeContract({
          address: CONTRACT,
          abi: SIMPLY_VEST_ABI,
          functionName: "triggerMilestone",
          args: [streamId],
          account: addr,
        });
        setTxHash(tx);
        return wait(tx);
      });
    },
    [exec]
  );

  const withdrawMilestone = useCallback(
    async (streamId: `0x${string}`) => {
      return exec(async () => {
        const wc = walletClient();
        const [addr] = await wc.requestAddresses();
        const tx = await wc.writeContract({
          address: CONTRACT,
          abi: SIMPLY_VEST_ABI,
          functionName: "withdrawMilestone",
          args: [streamId],
          account: addr,
        });
        setTxHash(tx);
        return wait(tx);
      });
    },
    [exec]
  );

  const cancelMilestone = useCallback(
    async (streamId: `0x${string}`) => {
      return exec(async () => {
        const wc = walletClient();
        const [addr] = await wc.requestAddresses();
        const tx = await wc.writeContract({
          address: CONTRACT,
          abi: SIMPLY_VEST_ABI,
          functionName: "cancelMilestone",
          args: [streamId],
          account: addr,
        });
        setTxHash(tx);
        return wait(tx);
      });
    },
    [exec]
  );

  async function fetchStream(streamId: `0x${string}`): Promise<StreamData | null> {
    try {
      return await publicClient().readContract({
        address: CONTRACT,
        abi: SIMPLY_VEST_ABI,
        functionName: "getStream",
        args: [streamId],
      });
    } catch {
      return null;
    }
  }

  async function fetchMilestoneStream(streamId: `0x${string}`): Promise<MilestoneStreamData | null> {
    try {
      return await publicClient().readContract({
        address: CONTRACT,
        abi: SIMPLY_VEST_ABI,
        functionName: "getMilestoneStream",
        args: [streamId],
      });
    } catch {
      return null;
    }
  }

  async function fetchClaimable(streamId: `0x${string}`): Promise<bigint> {
    return publicClient().readContract({
      address: CONTRACT,
      abi: SIMPLY_VEST_ABI,
      functionName: "getClaimable",
      args: [streamId],
    });
  }

  async function fetchMilestoneClaimable(streamId: `0x${string}`): Promise<bigint> {
    return publicClient().readContract({
      address: CONTRACT,
      abi: SIMPLY_VEST_ABI,
      functionName: "getMilestoneClaimable",
      args: [streamId],
    });
  }

  async function fetchStreamCount(): Promise<bigint> {
    return publicClient().readContract({
      address: CONTRACT,
      abi: SIMPLY_VEST_ABI,
      functionName: "getStreamCount",
    });
  }

  async function fetchMilestoneStreamCount(): Promise<bigint> {
    return publicClient().readContract({
      address: CONTRACT,
      abi: SIMPLY_VEST_ABI,
      functionName: "getMilestoneStreamCount",
    });
  }

  return {
    loading,
    txHash,
    error,
    reset,
    createStream,
    withdraw,
    cancel,
    createMilestoneStream,
    triggerMilestone,
    withdrawMilestone,
    cancelMilestone,
    fetchStream,
    fetchMilestoneStream,
    fetchClaimable,
    fetchMilestoneClaimable,
    fetchStreamCount,
    fetchMilestoneStreamCount,
  };
}
