import { useState, useEffect, useMemo } from "react";
import type { Address } from "viem";
import { formatUnits, parseUnits, createPublicClient, http } from "viem";
import { arcTestnet } from "../arc-chain";
import { SIMPLY_VEST_ABI } from "../abi";
import type { StreamData, MilestoneStreamData } from "../contract";
import VestingCircle from "./VestingCircle";
import VestingCurve from "./VestingCurve";
import { nowUnix, toDatetimeLocal, fromDatetimeLocal } from "../stream/validation";

const RAW_ADDRESS = import.meta.env.VITE_SIMPLY_VEST_ADDRESS;
if (!RAW_ADDRESS) throw new Error("VITE_SIMPLY_VEST_ADDRESS is not set");
const CONTRACT = RAW_ADDRESS as Address;
const pc = () => createPublicClient({ chain: arcTestnet, transport: http() });

type CalcParams =
  | {
      type: "time";
      amount: bigint;
      amountWithdrawn: bigint;
      startTime: number;
      cliffTime: number;
      endTime: number;
      cancelled: boolean;
      token: Address;
    }
  | {
      type: "milestone";
      amount: bigint;
      amountWithdrawn: bigint;
      milestoneReached: boolean;
      cancelled: boolean;
      token: Address;
    };

interface StreamOption {
  id: string;
  type: "time" | "milestone";
  label: string;
}

function computeVested(
  now: number,
  startTime: number,
  cliffTime: number,
  endTime: number,
  amount: bigint,
): bigint {
  if (amount <= 0n || now < startTime || now < cliffTime) return 0n;
  if (now >= endTime) return amount;
  const elapsed = now - startTime;
  const duration = endTime - startTime;
  if (duration <= 0) return amount;
  const vested = (amount * BigInt(elapsed)) / BigInt(duration);
  return vested > amount ? amount : vested;
}

function formatAmount(v: bigint): string {
  const s = formatUnits(v, 18);
  const [intPart, decPart] = s.split(".");
  if (!decPart) return intPart;
  const trimmed = decPart.replace(/0+$/, "").slice(0, 6);
  return trimmed ? `${intPart}.${trimmed}` : intPart;
}

function formatDate(ts: number): string {
  return new Date(ts * 1000).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface Props {
  address: Address;
  contract: ReturnType<typeof import("../contract").useContract>;
}

export default function VestingCalculator({ address, contract }: Props) {
  const [mode, setMode] = useState<"existing" | "custom">("existing");
  const [streamOptions, setStreamOptions] = useState<StreamOption[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [loadingStreams, setLoadingStreams] = useState(false);
  const [customAmount, setCustomAmount] = useState("");
  const [customStart, setCustomStart] = useState("");
  const [customCliff, setCustomCliff] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [params, setParams] = useState<CalcParams | null>(null);
  const [simTime, setSimTime] = useState<number>(nowUnix());

  useEffect(() => {
    if (mode !== "existing" || !address) return;
    let cancelled = false;
    const load = async () => {
      setLoadingStreams(true);
      try {
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
        const opts: StreamOption[] = [];
        const seen = new Set<string>();
        for (let i = 0; i < Number(sc); i++) {
          const id = (await pc().readContract({
            address: CONTRACT,
            abi: SIMPLY_VEST_ABI,
            functionName: "streamIds",
            args: [BigInt(i)],
          })) as string;
          if (seen.has(id)) continue;
          seen.add(id);
          const s = await contract.fetchStream(id as `0x${string}`);
          if (!s) continue;
          const mine =
            s.creator.toLowerCase() === address.toLowerCase() ||
            s.recipient.toLowerCase() === address.toLowerCase();
          if (!mine) continue;
          opts.push({
            id,
            type: "time",
            label: `${formatAmount(s.amount)} USDC \u2192 ${s.recipient.slice(0, 6)}...${s.recipient.slice(-4)}`,
          });
        }
        for (let i = 0; i < Number(msc); i++) {
          const id = (await pc().readContract({
            address: CONTRACT,
            abi: SIMPLY_VEST_ABI,
            functionName: "milestoneStreamIds",
            args: [BigInt(i)],
          })) as string;
          if (seen.has(id)) continue;
          seen.add(id);
          const m = await contract.fetchMilestoneStream(id as `0x${string}`);
          if (!m) continue;
          const mine =
            m.creator.toLowerCase() === address.toLowerCase() ||
            m.recipient.toLowerCase() === address.toLowerCase() ||
            m.milestoneAuthority.toLowerCase() === address.toLowerCase();
          if (!mine) continue;
          opts.push({
            id,
            type: "milestone",
            label: `${formatAmount(m.amount)} USDC \u2192 ${m.recipient.slice(0, 6)}...${m.recipient.slice(-4)} (ms)`,
          });
        }
        if (!cancelled) setStreamOptions(opts);
      } finally {
        if (!cancelled) setLoadingStreams(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [mode, address, contract]);

  useEffect(() => {
    if (!selectedId || mode !== "existing") return;
    let cancelled = false;
    const load = async () => {
      const opt = streamOptions.find((o) => o.id === selectedId);
      if (!opt) return;
      const id = selectedId as `0x${string}`;
      if (opt.type === "time") {
        const s = await contract.fetchStream(id);
        if (s && !cancelled) {
          setParams({
            type: "time",
            amount: s.amount,
            amountWithdrawn: s.amountWithdrawn,
            startTime: Number(s.startTime),
            cliffTime: Number(s.cliffTime),
            endTime: Number(s.endTime),
            cancelled: s.cancelled,
            token: s.token,
          });
          setSimTime(nowUnix());
        }
      } else {
        const m = await contract.fetchMilestoneStream(id);
        if (m && !cancelled) {
          setParams({
            type: "milestone",
            amount: m.amount,
            amountWithdrawn: m.amountWithdrawn,
            milestoneReached: m.milestoneReached,
            cancelled: m.cancelled,
            token: m.token,
          });
          setSimTime(nowUnix());
        }
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [selectedId, mode, contract, streamOptions]);

  useEffect(() => {
    if (mode !== "custom") return;
    const amt = customAmount ? parseUnits(customAmount, 18) : 0n;
    const start = customStart ? fromDatetimeLocal(customStart) : 0;
    const cliff = customCliff ? fromDatetimeLocal(customCliff) : 0;
    const end = customEnd ? fromDatetimeLocal(customEnd) : 0;
    if (amt <= 0n || start <= 0 || end <= 0) {
      setParams(null);
      return;
    }
    setParams({
      type: "time",
      amount: amt,
      amountWithdrawn: 0n,
      startTime: start,
      cliffTime: cliff > 0 ? cliff : start,
      endTime: end,
      cancelled: false,
      token: "0x07865c6E87B9F70255377e024ace6630C1Eaa37F",
    });
    setSimTime(nowUnix());
  }, [mode, customAmount, customStart, customCliff, customEnd]);

  const effectiveTime = simTime > 0 ? simTime : nowUnix();

  const derived = useMemo(() => {
    if (!params) {
      return {
        total: 0n,
        withdrawn: 0n,
        vested: 0n,
        claimable: 0n,
        pct: 0,
        active: false,
        isMilestone: false,
        milestoneReached: false,
        cancelled: false,
        startTime: 0,
        cliffTime: 0,
        endTime: 0,
      };
    }
    const t = params.amount;
    const w = params.amountWithdrawn;
    if (params.type === "time") {
      const v = computeVested(effectiveTime, params.startTime, params.cliffTime, params.endTime, t);
      const c = v > w ? v - w : 0n;
      const p = t > 0n ? Number((v * 100n) / t) : 0;
      return {
        total: t,
        withdrawn: w,
        vested: v,
        claimable: c,
        pct: Math.min(100, p),
        active: !params.cancelled && w < t,
        isMilestone: false,
        milestoneReached: false,
        cancelled: params.cancelled,
        startTime: params.startTime,
        cliffTime: params.cliffTime,
        endTime: params.endTime,
      };
    }
    const reached = params.milestoneReached && !params.cancelled;
    const v = reached ? t : 0n;
    const c = reached ? t - w : 0n;
    const p = reached ? 100 : 0;
    return {
      total: t,
      withdrawn: w,
      vested: v,
      claimable: c,
      pct: p,
      active: reached && w < t,
      isMilestone: true,
      milestoneReached: params.milestoneReached,
      cancelled: params.cancelled,
      startTime: 0,
      cliffTime: 0,
      endTime: 0,
    };
  }, [params, effectiveTime]);

  const simMin = derived.isMilestone ? 0 : derived.startTime > 0 ? derived.startTime - 86400 : 0;
  const simMax = derived.isMilestone ? 1 : derived.endTime + 86400;
  const clampedSim = Math.min(simMax, Math.max(simMin, simTime));

  const switchMode = (m: typeof mode) => {
    setMode(m);
    setParams(null);
    setSelectedId("");
    setSimTime(nowUnix());
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex gap-2 border-b border-base-500/20 pb-3">
        {(["existing", "custom"] as const).map((m) => (
          <button
            key={m}
            onClick={() => switchMode(m)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              mode === m
                ? "bg-plum-800/20 text-plum-300 border border-plum-800/30"
                : "text-text-muted hover:text-text-secondary"
            }`}
          >
            {m === "existing" ? "Existing Stream" : "Custom"}
          </button>
        ))}
      </div>

      {mode === "existing" ? (
        <div>
          <label className="label mb-2">Select a Stream</label>
          {loadingStreams ? (
            <p className="text-text-muted text-sm">Loading streams...</p>
          ) : streamOptions.length === 0 ? (
            <p className="text-text-muted text-sm">No streams found. Create one first.</p>
          ) : (
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="input-field"
            >
              <option value="">-- Select a stream --</option>
              {streamOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Amount (USDC)</label>
            <input
              type="number"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              className="input-field"
              placeholder="1000"
              min="0"
              step="0.01"
            />
          </div>
          <div>
            <label className="label">Start</label>
            <input
              type="datetime-local"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="label">Cliff</label>
            <input
              type="datetime-local"
              value={customCliff}
              onChange={(e) => setCustomCliff(e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="label">End</label>
            <input
              type="datetime-local"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="input-field"
            />
          </div>
        </div>
      )}

      {!params ? (
        <div className="card p-12 text-center">
          <p className="text-text-muted">
            {mode === "existing"
              ? "Select a stream above to calculate vested tokens"
              : "Enter parameters above to calculate vested tokens"}
          </p>
        </div>
      ) : derived.isMilestone ? (
        <div className="card p-6">
          <h3 className="section-title mb-4">Milestone Stream</h3>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-sm text-text-secondary">Status:</span>
            {derived.cancelled ? (
              <span className="badge-cancelled">Cancelled</span>
            ) : derived.milestoneReached ? (
              <span className="badge-active">Reached</span>
            ) : (
              <span className="badge bg-warning/10 text-warning border border-warning/20">
                Pending
              </span>
            )}
            <span className="text-xs text-text-muted ml-2">Claimable: {formatAmount(derived.claimable)}</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <StatBox label="Total" value={formatAmount(derived.total)} />
            <StatBox label="Withdrawn" value={formatAmount(derived.withdrawn)} />
            <StatBox label="Claimable" value={formatAmount(derived.claimable)} highlight />
          </div>
          <div className="flex justify-center mt-6">
            <VestingCircle percentage={derived.pct} size={120} strokeWidth={8} />
          </div>
        </div>
      ) : (
        <>
          <div className="card p-4">
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">What-if Simulation</label>
              <button
                onClick={() => setSimTime(nowUnix())}
                className="text-xs text-plum-400 hover:text-plum-300 transition-colors"
              >
                Reset to Now
              </button>
            </div>
            <input
              type="range"
              min={simMin}
              max={simMax}
              value={clampedSim}
              onChange={(e) => setSimTime(Number(e.target.value))}
              className="w-full accent-plum-500"
            />
            <div className="flex justify-between text-xs text-text-muted mt-1">
              <span>{formatDate(simMin)}</span>
              <span className="font-medium text-plum-300">{formatDate(clampedSim)}</span>
              <span>{formatDate(simMax)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatBox label="Total" value={formatAmount(derived.total)} />
            <StatBox label="Vested" value={formatAmount(derived.vested)} />
            <StatBox label="Claimable" value={formatAmount(derived.claimable)} highlight />
            <StatBox label="Withdrawn" value={formatAmount(derived.withdrawn)} />
          </div>

          <div className="card p-6">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <div className="flex flex-col items-center gap-2 shrink-0">
                <VestingCircle percentage={derived.pct} size={140} strokeWidth={10} />
                <span className="text-xs text-text-muted">
                  {derived.cancelled ? "Cancelled" : "Vested of Total"}
                </span>
                {derived.cancelled && <span className="badge-cancelled">Cancelled</span>}
              </div>
              <div className="flex-1 min-w-0 w-full">
                <VestingCurve
                  amount={derived.total}
                  startTime={derived.startTime}
                  cliffTime={derived.cliffTime}
                  endTime={derived.endTime}
                  nowTime={nowUnix()}
                  simTime={clampedSim}
                  simVested={derived.vested}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatBox({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`card p-4 ${highlight ? "border-plum-800/40 bg-plum-950/20" : ""}`}
    >
      <p className="stat-label mb-1">{label}</p>
      <p
        className={`stat-value text-lg ${
          highlight ? "text-plum-300" : "text-text-primary"
        }`}
      >
        {value || "\u2014"}
      </p>
    </div>
  );
}
