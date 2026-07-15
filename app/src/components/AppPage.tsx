import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "../wallet";
import { useContract } from "../contract";
import ConnectWallet from "./ConnectWallet";
import ThemeToggle from "./ThemeToggle";
import Dashboard from "./Dashboard";
import CreateStream from "./CreateStream";
import CreateMilestoneStream from "./CreateMilestoneStream";
import BatchCreateStreams from "./BatchCreateStreams";
import StreamList from "./StreamList";
import TxToast from "./TxToast";
import VestingCalculator from "./VestingCalculator";

type Tab = "create" | "batch" | "milestone" | "streams" | "calculator";

export default function AppPage() {
  const navigate = useNavigate();
  const { address, chainId, error, connect, disconnect } = useWallet();
  const contract = useContract();
  const [tab, setTab] = useState<Tab>("streams");

  const stats = useMemo(() => {
    if (!address) return { total: 0, active: 0, value: "", claimable: "" };
    return { total: 0, active: 0, value: "—", claimable: "—" };
  }, [address]);

  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-50 glass border-b border-base-500/20">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <img src="/favicon.svg" alt="SimplyVest" className="h-8" />
            <span className="text-lg font-display font-bold tracking-tight">
              <span className="text-text-primary">Simply</span>
              <span className="text-plum-400">Vest</span>
            </span>
          </button>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <ConnectWallet
              address={address}
              chainId={chainId}
              error={error}
              onConnect={connect}
              onDisconnect={() => {
                disconnect();
                navigate("/");
              }}
            />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <Dashboard
          totalStreams={stats.total}
          activeStreams={stats.active}
          totalValue={stats.value}
          claimableNow={stats.claimable}
        />

        <div className="flex gap-2 mb-8 border-b border-base-500/20 pb-3">
          {(
            [
              ["streams", "Streams"],
              ["create", "New Stream"],
              ["batch", "Batch"],
              ["milestone", "New Milestone"],
              ["calculator", "Calculator"],
            ] as [Tab, string][]
          ).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                tab === id
                  ? "bg-plum-800/20 text-plum-300 border border-plum-800/30"
                  : "text-text-muted hover:text-text-secondary"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "create" && (
          <CreateStream
            onCreate={contract.createStream}
            loading={contract.loading}
          />
        )}
        {tab === "batch" && (
          <BatchCreateStreams
            onCreate={(inputs) => {
              const amt = inputs.reduce((s, i) => s + Number(i.amount), 0);
              if (amt <= 0) return;
              contract.batchCreateStreams(inputs);
            }}
            loading={contract.loading}
          />
        )}
        {tab === "milestone" && (
          <CreateMilestoneStream
            onCreate={contract.createMilestoneStream}
            loading={contract.loading}
          />
        )}
        {tab === "streams" && address && (
          <StreamList address={address} contract={contract} />
        )}
        {tab === "calculator" && address && (
          <VestingCalculator address={address} contract={contract} />
        )}
      </main>

      <TxToast
        txHash={contract.txHash}
        error={contract.error}
        onDismiss={contract.reset}
      />

      {contract.error && (
        <div className="fixed bottom-6 left-6 z-50 card border-error/30 p-4 max-w-sm animate-slide-up">
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 mt-0.5 rounded-full bg-error/20 border border-error/30 flex items-center justify-center shrink-0">
              <svg className="w-3 h-3 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary">Error</p>
              <p className="text-xs text-text-secondary mt-0.5">{contract.error}</p>
            </div>
            <button onClick={contract.reset} className="text-text-muted hover:text-text-secondary ml-2">&times;</button>
          </div>
        </div>
      )}
    </div>
  );
}
