import { useEffect, useState } from "react";
import type { Address } from "viem";
import { formatUnits, createPublicClient, http } from "viem";
import { arcTestnet } from "../arc-chain";
import { SIMPLY_VEST_ABI } from "../abi";
import type { StreamData, MilestoneStreamData } from "../contract";
import StreamCard from "./StreamCard";

interface Props {
  address: Address;
  contract: ReturnType<typeof import("../contract").useContract>;
}

const CONTRACT = import.meta.env.VITE_SIMPLY_VEST_ADDRESS as Address;
const pc = () => createPublicClient({ chain: arcTestnet, transport: http() });

export default function StreamList({ address, contract }: Props) {
  const [streamIds, setStreamIds] = useState<`0x${string}`[]>([]);
  const [milestoneIds, setMilestoneIds] = useState<`0x${string}`[]>([]);
  const [streams, setStreams] = useState<Record<string, StreamData>>({});
  const [milestones, setMilestones] = useState<Record<string, MilestoneStreamData>>({});
  const [claimable, setClaimable] = useState<Record<string, bigint>>({});
  const [tab, setTab] = useState<"all" | "stream" | "milestone">("all");
  const [withdrawAmounts, setWithdrawAmounts] = useState<Record<string, string>>({});
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!address) return;
    let cancelled = false;
    setLoading(true);
    const load = async () => {
      try {
        const sc = await pc().readContract({
          address: CONTRACT, abi: SIMPLY_VEST_ABI, functionName: "getStreamCount",
        });
        const msc = await pc().readContract({
          address: CONTRACT, abi: SIMPLY_VEST_ABI, functionName: "getMilestoneStreamCount",
        });
        const sIds: `0x${string}`[] = [];
        const mIds: `0x${string}`[] = [];
        for (let i = 0; i < Number(sc); i++) {
          sIds.push(await pc().readContract({
            address: CONTRACT, abi: SIMPLY_VEST_ABI, functionName: "streamIds", args: [BigInt(i)],
          }));
        }
        for (let i = 0; i < Number(msc); i++) {
          mIds.push(await pc().readContract({
            address: CONTRACT, abi: SIMPLY_VEST_ABI, functionName: "milestoneStreamIds", args: [BigInt(i)],
          }));
        }
        if (cancelled) return;
        setStreamIds(sIds);
        setMilestoneIds(mIds);

        const sMap: Record<string, StreamData> = {};
        const mMap: Record<string, MilestoneStreamData> = {};
        const cMap: Record<string, bigint> = {};
        for (const id of sIds) {
          if (cancelled) return;
          const s = await contract.fetchStream(id);
          if (s) { sMap[id] = s; cMap[id] = await contract.fetchClaimable(id); }
        }
        for (const id of mIds) {
          if (cancelled) return;
          const m = await contract.fetchMilestoneStream(id);
          if (m) { mMap[id] = m; cMap[id] = await contract.fetchMilestoneClaimable(id); }
        }
        if (cancelled) return;
        setStreams(sMap);
        setMilestones(mMap);
        setClaimable(cMap);
      } catch (e) {
        console.error("Failed to load streams", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [address, contract.txHash, contract.loading, refreshKey]);

  const myStreams = Object.entries(streams).filter(
    ([, s]) => s.creator.toLowerCase() === address.toLowerCase() || s.recipient.toLowerCase() === address.toLowerCase()
  );
  const myMilestones = Object.entries(milestones).filter(
    ([, m]) => m.creator.toLowerCase() === address.toLowerCase() || m.recipient.toLowerCase() === address.toLowerCase() || m.milestoneAuthority.toLowerCase() === address.toLowerCase()
  );
  const all = [...myStreams.map(([id, s]) => ({ id, stream: s as StreamData | MilestoneStreamData, type: "stream" as const })), ...myMilestones.map(([id, m]) => ({ id, stream: m, type: "milestone" as const }))];
  all.sort((a, b) => {
    const aAmt = claimable[a.id] ?? 0n;
    const bAmt = claimable[b.id] ?? 0n;
    return Number(bAmt - aAmt);
  });

  const visible = tab === "all" ? all : tab === "stream" ? myStreams.map(([id, stream]) => ({ id, stream, type: "stream" as const })) : myMilestones.map(([id, stream]) => ({ id, stream, type: "milestone" as const }));

  const tabs = [
    ["all", "All", all.length],
    ["stream", "Time", myStreams.length],
    ["milestone", "Milestone", myMilestones.length],
  ] as const;

  if (loading) {
    return (
      <div className="text-center py-16">
        <p className="text-text-muted text-lg">Loading streams...</p>
      </div>
    );
  }

  if (all.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-text-muted text-lg">No streams yet</p>
        <p className="text-text-muted text-sm mt-1">Create one to get started</p>
        <button onClick={() => setRefreshKey(k => k + 1)} className="btn-secondary text-sm mt-4 px-4 py-2">
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-2 mb-6 border-b border-base-500/20 pb-3">
        {tabs.map(([id, label, count]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              tab === id
                ? "bg-plum-800/20 text-plum-300 border border-plum-800/30"
                : "text-text-muted hover:text-text-secondary"
            }`}
          >
            {label}
            <span className="ml-2 text-xs opacity-60">{count}</span>
          </button>
        ))}
        <button
          onClick={() => setRefreshKey(k => k + 1)}
          className="ml-auto px-3 py-2 rounded-lg text-sm text-text-muted hover:text-text-primary transition-colors"
          title="Refresh"
        >
          ↻
        </button>
      </div>

      <div className="space-y-4">
        {visible.map(({ id, stream, type }) => {
          const s = stream;
          const isCreator = s.creator.toLowerCase() === address.toLowerCase();
          const isRecipient = s.recipient.toLowerCase() === address.toLowerCase();
          const isAuthority = type === "milestone" && (s as MilestoneStreamData).milestoneAuthority?.toLowerCase() === address.toLowerCase();
          const key = `${type}-${id}`;

          return (
            <StreamCard
              key={key}
              id={id as `0x${string}`}
              stream={s}
              claimable={claimable[id] ?? 0n}
              currentUser={address}
              isCreator={isCreator}
              isRecipient={isRecipient}
              isAuthority={isAuthority}
              withdrawAmount={withdrawAmounts[id] ?? ""}
              onWithdrawAmountChange={(val) => setWithdrawAmounts(p => ({ ...p, [id]: val }))}
              onWithdraw={() => {
                if (type === "milestone") {
                  contract.withdrawMilestone(id as `0x${string}`);
                } else {
                  contract.withdraw(id as `0x${string}`, withdrawAmounts[id] ?? "0");
                }
              }}
              onCancel={() => {
                if (type === "milestone") {
                  contract.cancelMilestone(id as `0x${string}`);
                } else {
                  contract.cancel(id as `0x${string}`);
                }
              }}
              onDepositMore={(amount: string) => contract.depositMore(id as `0x${string}`, amount)}
              onTransfer={(newRecipient: `0x${string}`) => {
                if (type === "milestone") {
                  contract.transferMilestoneStream(id as `0x${string}`, newRecipient);
                } else {
                  contract.transferStream(id as `0x${string}`, newRecipient);
                }
              }}
              onTrigger={() => contract.triggerMilestone(id as `0x${string}`)}
              loading={contract.loading}
            />
          );
        })}
      </div>
    </div>
  );
}
