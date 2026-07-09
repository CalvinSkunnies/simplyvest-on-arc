import { useState } from "react";
import { useWallet } from "./wallet";
import { useContract } from "./contract";
import ConnectWallet from "./components/ConnectWallet";
import CreateStream from "./components/CreateStream";
import CreateMilestoneStream from "./components/CreateMilestoneStream";
import StreamList from "./components/StreamList";

type Tab = "create" | "milestone" | "streams";

export default function App() {
  const { address, chainId, error, connect, disconnect } = useWallet();
  const contract = useContract();
  const [tab, setTab] = useState<Tab>("streams");

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <header className="border-b border-gray-800">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight">
            SimplyVest{" "}
            <span className="text-gray-500 font-normal text-sm">
              on Arc Testnet
            </span>
          </h1>
          <ConnectWallet
            address={address}
            chainId={chainId}
            error={error}
            onConnect={connect}
            onDisconnect={disconnect}
          />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {!address ? (
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold mb-2">
              SimplyVest
            </h2>
            <p className="text-gray-500">
              Time-based & milestone-gated vesting streams on Arc Testnet
            </p>
          </div>
        ) : (
          <>
            <div className="flex gap-2 mb-8">
              {(
                [
                  ["streams", "Streams"],
                  ["create", "New Stream"],
                  ["milestone", "New Milestone"],
                ] as [Tab, string][]
              ).map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className={`px-5 py-2 rounded-xl text-sm font-medium transition ${
                    tab === id
                      ? "bg-gray-800 text-white border border-gray-700"
                      : "text-gray-500 hover:text-white"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {contract.txHash && (
              <div className="mb-6 p-3 bg-gray-800 border border-gray-700 rounded-xl">
                <p className="text-sm text-gray-400">
                  Tx sent:{" "}
                  <a
                    href={`https://testnet.arcscan.app/tx/${contract.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 underline font-mono text-xs"
                  >
                    {contract.txHash}
                  </a>
                </p>
              </div>
            )}

            {contract.error && (
              <div className="mb-6 p-3 bg-red-900/50 border border-red-800 rounded-xl">
                <p className="text-sm text-red-300">{contract.error}</p>
                <button
                  onClick={contract.reset}
                  className="text-xs text-red-400 underline mt-1"
                >
                  Dismiss
                </button>
              </div>
            )}

            {tab === "create" && (
              <CreateStream
                onCreate={contract.createStream}
                loading={contract.loading}
              />
            )}
            {tab === "milestone" && (
              <CreateMilestoneStream
                onCreate={contract.createMilestoneStream}
                loading={contract.loading}
              />
            )}
            {tab === "streams" && (
              <StreamList address={address} contract={contract} />
            )}
          </>
        )}
      </main>
    </div>
  );
}
