import { useState } from "react";
import type { Address } from "viem";

interface Props {
  onCreate: (
    recipient: Address,
    token: Address,
    amount: string,
    startTime: number,
    cliffTime: number,
    endTime: number
  ) => void;
  loading: boolean;
}

export default function CreateStream({ onCreate, loading }: Props) {
  const [recipient, setRecipient] = useState("");
  const [token, setToken] = useState("0x07865c6E87B9F70255377e024ace6630C1Eaa37F");
  const [amount, setAmount] = useState("");
  const [startDelay, setStartDelay] = useState("0");
  const [cliffDelay, setCliffDelay] = useState("0");
  const [duration, setDuration] = useState("86400");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const now = Math.floor(Date.now() / 1000);
    onCreate(
      recipient as Address,
      token as Address,
      amount,
      now + Number(startDelay),
      now + Number(cliffDelay),
      now + Number(duration)
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
      <h2 className="text-xl font-bold">Create Time-Stream</h2>

      <div>
        <label className="block text-sm text-gray-400 mb-1">Recipient</label>
        <input
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          placeholder="0x..."
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 font-mono text-sm focus:outline-none focus:border-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-1">
          Token (defaults to USDC)
        </label>
        <input
          value={token}
          onChange={(e) => setToken(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 font-mono text-sm focus:outline-none focus:border-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-1">Amount</label>
        <input
          type="number"
          step="0.000001"
          min="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="1000"
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
          required
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-sm text-gray-400 mb-1">
            Start delay (s)
          </label>
          <input
            type="number"
            min="0"
            value={startDelay}
            onChange={(e) => setStartDelay(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">
            Cliff delay (s)
          </label>
          <input
            type="number"
            min="0"
            value={cliffDelay}
            onChange={(e) => setCliffDelay(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">
            Duration (s)
          </label>
          <input
            type="number"
            min="1"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="86400"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-blue-600 rounded-xl font-semibold hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {loading ? "Confirming..." : "Create Stream"}
      </button>
    </form>
  );
}
