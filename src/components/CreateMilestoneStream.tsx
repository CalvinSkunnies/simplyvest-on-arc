import { useState } from "react";
import type { Address } from "viem";

interface Props {
  onCreate: (
    recipient: Address,
    token: Address,
    amount: string,
    milestoneAuthority: Address
  ) => void;
  loading: boolean;
}

export default function CreateMilestoneStream({
  onCreate,
  loading,
}: Props) {
  const [recipient, setRecipient] = useState("");
  const [token, setToken] = useState(
    "0x07865c6E87B9F70255377e024ace6630C1Eaa37F"
  );
  const [amount, setAmount] = useState("");
  const [authority, setAuthority] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate(
      recipient as Address,
      token as Address,
      amount,
      authority as Address
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
      <h2 className="text-xl font-bold">Create Milestone-Stream</h2>

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

      <div>
        <label className="block text-sm text-gray-400 mb-1">
          Milestone Authority
        </label>
        <input
          value={authority}
          onChange={(e) => setAuthority(e.target.value)}
          placeholder="0x..."
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 font-mono text-sm focus:outline-none focus:border-blue-500"
          required
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-purple-600 rounded-xl font-semibold hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {loading ? "Confirming..." : "Create Milestone Stream"}
      </button>
    </form>
  );
}
