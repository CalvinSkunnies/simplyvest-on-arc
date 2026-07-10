import { useState, useMemo } from "react";
import type { Address } from "viem";
import { parseUnits } from "viem";
import TokenSelect from "./TokenSelect";
import CalendarDatePicker from "./CalendarDatePicker";
import { nowUnix } from "../stream/validation";

interface StreamRow {
  recipient: string;
  token: Address;
  amount: string;
  startTime: number;
  cliffTime: number;
  endTime: number;
}

interface Props {
  onCreate: (
    inputs: Array<{
      recipient: Address;
      token: Address;
      amount: string;
      startTime: number;
      cliffTime: number;
      endTime: number;
    }>,
  ) => void;
  loading: boolean;
}

const defaults = () => {
  const start = nowUnix() + 60;
  return { startTime: start, cliffTime: start, endTime: start + 2592000 };
};

export default function BatchCreateStreams({ onCreate, loading }: Props) {
  const [rows, setRows] = useState<StreamRow[]>([
    { recipient: "", token: "0x07865c6E87B9F70255377e024ace6630C1Eaa37F" as Address, amount: "", ...defaults() },
  ]);

  const updateRow = (i: number, patch: Partial<StreamRow>) => {
    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, ...patch } : r));
  };

  const addRow = () => {
    setRows(prev => [...prev, { recipient: "", token: "0x07865c6E87B9F70255377e024ace6630C1Eaa37F" as Address, amount: "", ...defaults() }]);
  };

  const removeRow = (i: number) => {
    setRows(prev => prev.filter((_, idx) => idx !== i));
  };

  const valid = rows.every(r => r.recipient && r.amount);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || loading) return;
    const inputs = rows.map(r => ({
      recipient: r.recipient as Address,
      token: r.token,
      amount: r.amount,
      startTime: r.startTime,
      cliffTime: r.cliffTime,
      endTime: r.endTime,
    }));
    onCreate(inputs);
  };

  return (
    <form onSubmit={handleSubmit} className="animate-fade-in">
      <h2 className="section-title mb-6">Batch Create Streams</h2>
      <p className="text-text-secondary text-sm mb-6">
        Create multiple time streams in a single transaction. Each stream can use a different token.
      </p>

      <div className="space-y-6">
        {rows.map((row, i) => (
          <div key={i} className="card p-5 border border-base-500/20">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-text-primary">Stream #{i + 1}</span>
              {rows.length > 1 && (
                <button type="button" onClick={() => removeRow(i)} className="text-error text-sm hover:opacity-80">
                  Remove
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Recipient</label>
                <input
                  value={row.recipient}
                  onChange={(e) => updateRow(i, { recipient: e.target.value })}
                  placeholder="0x..."
                  className="input-field font-mono"
                  required
                />
              </div>

              <div>
                <label className="label">Token</label>
                <TokenSelect value={row.token} onChange={(t) => updateRow(i, { token: t })} />
              </div>

              <div>
                <label className="label">Amount</label>
                <input
                  type="number"
                  step="0.000001"
                  min="0.000001"
                  value={row.amount}
                  onChange={(e) => updateRow(i, { amount: e.target.value })}
                  placeholder="1000"
                  className="input-field"
                  required
                />
              </div>

              <div />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <CalendarDatePicker
                label="Start Time"
                value={row.startTime}
                onChange={(t) => updateRow(i, { startTime: t, cliffTime: Math.max(t, row.cliffTime), endTime: Math.max(t + 60, row.endTime) })}
                min={nowUnix() + 60}
              />
              <CalendarDatePicker
                label="Cliff Time"
                value={row.cliffTime}
                onChange={(t) => updateRow(i, { cliffTime: t })}
                min={row.startTime}
                max={row.endTime}
              />
              <CalendarDatePicker
                label="End Time"
                value={row.endTime}
                onChange={(t) => updateRow(i, { endTime: t })}
                min={row.cliffTime}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3 mt-6">
        <button type="button" onClick={addRow} className="btn-secondary px-5 py-2.5">
          + Add Stream
        </button>
        <button type="submit" disabled={!valid || loading} className="btn-primary px-8 py-2.5">
          {loading ? "Confirming..." : `Create ${rows.length} Stream${rows.length > 1 ? "s" : ""}`}
        </button>
      </div>
    </form>
  );
}
