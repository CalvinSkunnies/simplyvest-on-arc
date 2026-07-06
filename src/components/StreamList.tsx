import { useEffect, useState } from "react";
import type { Address } from "viem";
import { formatUnits, createPublicClient, http } from "viem";
import { arcTestnet } from "../arc-chain";
import { SIMPLY_VEST_ABI } from "../abi";
import type { StreamData, MilestoneStreamData } from "../contract";

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
  const [tab, setTab] = useState<"stream" | "milestone">("stream");
  const [withdrawAmounts, setWithdrawAmounts] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!address) return;
    const load = async () => {
      const sc = await pc().readContract({
        address: CONTRACT,
        abi: SIMPLY_VEST_ABI,
        functionName: "getStreamCount",
      });
      const msc = await pc().readContract({
        address: CONTRACT,
        abi: SIMPLY_VEST_ABI,
        functionName: "getMilestoneStreamCount",
      });
      const sIds: `0x${string}`[] = [];
      const mIds: `0x${string}`[] = [];
      for (let i = 0; i < Number(sc); i++) {
        const id = await pc().readContract({
          address: CONTRACT,
          abi: SIMPLY_VEST_ABI,
          functionName: "streamIds",
          args: [BigInt(i)],
        });
        sIds.push(id);
      }
      for (let i = 0; i < Number(msc); i++) {
        const id = await pc().readContract({
          address: CONTRACT,
          abi: SIMPLY_VEST_ABI,
          functionName: "milestoneStreamIds",
          args: [BigInt(i)],
        });
        mIds.push(id);
      }
      setStreamIds(sIds);
      setMilestoneIds(mIds);

      const sMap: Record<string, StreamData> = {};
      const mMap: Record<string, MilestoneStreamData> = {};
      const cMap: Record<string, bigint> = {};
      for (const id of sIds) {
        const s = await contract.fetchStream(id);
        if (s) {
          sMap[id] = s;
          cMap[id] = await contract.fetchClaimable(id);
        }
      }
      for (const id of mIds) {
        const m = await contract.fetchMilestoneStream(id);
        if (m) {
          mMap[id] = m;
          cMap[id] = await contract.fetchMilestoneClaimable(id);
        }
      }
      setStreams(sMap);
      setMilestones(mMap);
      setClaimable(cMap);
    };
    load();
  }, [address, contract]);

  const myStreams = Object.entries(streams).filter(
    ([, s]) =>
      s.creator.toLowerCase() === address.toLowerCase() ||
      s.recipient.toLowerCase() === address.toLowerCase()
  );

  const myMilestones = Object.entries(milestones).filter(
    ([, m]) =>
      m.creator.toLowerCase() === address.toLowerCase() ||
      m.recipient.toLowerCase() === address.toLowerCase() ||
      m.milestoneAuthority.toLowerCase() === address.toLowerCase()
  );

  return (
    <div>
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab("stream")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            tab === "stream"
              ? "bg-blue-600 text-white"
              : "bg-gray-800 text-gray-400 hover:text-white"
          }`}
        >
          Time Streams ({myStreams.length})
        </button>
        <button
          onClick={() => setTab("milestone")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            tab === "milestone"
              ? "bg-purple-600 text-white"
              : "bg-gray-800 text-gray-400 hover:text-white"
          }`}
        >
          Milestone Streams ({myMilestones.length})
        </button>
      </div>

      {tab === "stream" && (
        <div className="space-y-4">
          {myStreams.length === 0 && (
            <p className="text-gray-500">No time streams found</p>
          )}
          {myStreams.map(([id, s]) => {
            const claimAmt = claimable[id] ?? 0n;
            const isCreator = s.creator.toLowerCase() === address.toLowerCase();
            const active = !s.cancelled && s.amountWithdrawn < s.amount;
            return (
              <div key={id} className="bg-gray-800 rounded-xl p-5 border border-gray-700">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-xs font-mono text-gray-500 break-all">{id}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {isCreator ? "From" : "To"}: {s.recipient.slice(0, 6)}...{s.recipient.slice(-4)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {s.cancelled && <span className="text-xs bg-red-900 text-red-300 px-2 py-1 rounded">Cancelled</span>}
                    {!s.cancelled && s.amountWithdrawn >= s.amount && (
                      <span className="text-xs bg-green-900 text-green-300 px-2 py-1 rounded">Completed</span>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm mb-4">
                  <div>
                    <span className="text-gray-500">Total</span>
                    <p className="font-mono">{formatUnits(s.amount, 18)} USDC</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Claimed</span>
                    <p className="font-mono">{formatUnits(s.amountWithdrawn, 18)} USDC</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Claimable</span>
                    <p className="font-mono text-green-400">{formatUnits(claimAmt, 18)} USDC</p>
                  </div>
                </div>
                {active && (
                  <div className="flex gap-2 items-center">
                    <input
                      type="number"
                      step="0.000001"
                      min="0"
                      max={formatUnits(claimAmt, 18)}
                      placeholder="Amount"
                      value={withdrawAmounts[id] ?? ""}
                      onChange={(e) => setWithdrawAmounts(p => ({ ...p, [id]: e.target.value }))}
                      className="w-32 bg-gray-700 border border-gray-600 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500"
                    />
                    <button
                      onClick={() => contract.withdraw(id as `0x${string}`, withdrawAmounts[id] ?? "0")}
                      disabled={contract.loading}
                      className="px-4 py-1.5 bg-green-700 rounded-lg text-sm hover:bg-green-600 disabled:opacity-50 transition"
                    >
                      Withdraw
                    </button>
                    {isCreator && (
                      <button
                        onClick={() => contract.cancel(id as `0x${string}`)}
                        disabled={contract.loading}
                        className="px-4 py-1.5 bg-red-800 rounded-lg text-sm hover:bg-red-700 disabled:opacity-50 transition"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {tab === "milestone" && (
        <div className="space-y-4">
          {myMilestones.length === 0 && (
            <p className="text-gray-500">No milestone streams found</p>
          )}
          {myMilestones.map(([id, m]) => {
            const claimAmt = claimable[id] ?? 0n;
            const isCreator = m.creator.toLowerCase() === address.toLowerCase();
            const isAuthority = m.milestoneAuthority.toLowerCase() === address.toLowerCase();
            return (
              <div key={id} className="bg-gray-800 rounded-xl p-5 border border-gray-700">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-xs font-mono text-gray-500 break-all">{id}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      To: {m.recipient.slice(0, 6)}...{m.recipient.slice(-4)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {m.milestoneReached && <span className="text-xs bg-blue-900 text-blue-300 px-2 py-1 rounded">Triggered</span>}
                    {m.cancelled && <span className="text-xs bg-red-900 text-red-300 px-2 py-1 rounded">Cancelled</span>}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm mb-4">
                  <div>
                    <span className="text-gray-500">Total</span>
                    <p className="font-mono">{formatUnits(m.amount, 18)} USDC</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Claimed</span>
                    <p className="font-mono">{formatUnits(m.amountWithdrawn, 18)} USDC</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Claimable</span>
                    <p className="font-mono text-green-400">{formatUnits(claimAmt, 18)} USDC</p>
                  </div>
                </div>
                {!m.cancelled && !m.milestoneReached && (
                  <div className="flex gap-2">
                    {isAuthority && (
                      <button
                        onClick={() => contract.triggerMilestone(id as `0x${string}`)}
                        disabled={contract.loading}
                        className="px-4 py-1.5 bg-blue-700 rounded-lg text-sm hover:bg-blue-600 disabled:opacity-50 transition"
                      >
                        Trigger
                      </button>
                    )}
                    {isCreator && (
                      <button
                        onClick={() => contract.cancelMilestone(id as `0x${string}`)}
                        disabled={contract.loading}
                        className="px-4 py-1.5 bg-red-800 rounded-lg text-sm hover:bg-red-700 disabled:opacity-50 transition"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                )}
                {m.milestoneReached && !m.cancelled && (
                  <button
                    onClick={() => contract.withdrawMilestone(id as `0x${string}`)}
                    disabled={contract.loading}
                    className="px-4 py-1.5 bg-green-700 rounded-lg text-sm hover:bg-green-600 disabled:opacity-50 transition"
                  >
                    Withdraw
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
