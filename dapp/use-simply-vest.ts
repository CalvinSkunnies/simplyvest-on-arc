import { useReadContract, useWriteContract } from "wagmi";
import { SIMPLY_VEST_ABI } from "@simplyvest/sdk";

const SIMPLY_VEST_ADDRESS = import.meta.env.VITE_SIMPLY_VEST_ADDRESS as `0x${string}`;

// ── Reads ──

export function useGetClaimable(streamId: `0x${string}`) {
  return useReadContract({
    address: SIMPLY_VEST_ADDRESS,
    abi: SIMPLY_VEST_ABI,
    functionName: "getClaimable",
    args: [streamId],
  });
}

export function useGetStream(streamId: `0x${string}`) {
  return useReadContract({
    address: SIMPLY_VEST_ADDRESS,
    abi: SIMPLY_VEST_ABI,
    functionName: "getStream",
    args: [streamId],
  });
}

export function useGetStreamCount() {
  return useReadContract({
    address: SIMPLY_VEST_ADDRESS,
    abi: SIMPLY_VEST_ABI,
    functionName: "getStreamCount",
  });
}

// ── Writes ──

export function useCreateStream() {
  return useWriteContract();
}

export function useWithdraw() {
  return useWriteContract();
}

export function useCancel() {
  return useWriteContract();
}

export function useCreateMilestoneStream() {
  return useWriteContract();
}

export function useTriggerMilestone() {
  return useWriteContract();
}

export function useWithdrawMilestone() {
  return useWriteContract();
}

export function useCancelMilestone() {
  return useWriteContract();
}
