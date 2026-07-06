import type { Address } from "viem";
import { arcTestnet } from "../arc-chain";

interface Props {
  address: Address | null;
  chainId: number | null;
  error: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
}

export default function ConnectWallet({
  address,
  chainId,
  error,
  onConnect,
  onDisconnect,
}: Props) {
  if (!window.ethereum) {
    return (
      <div className="text-center py-20">
        <p className="text-xl text-red-400 mb-4">MetaMask not detected</p>
        <a
          href="https://metamask.io/download/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 underline"
        >
          Install MetaMask
        </a>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-red-400">{error}</p>
        <button
          onClick={onConnect}
          className="mt-4 px-6 py-2 bg-blue-600 rounded-lg hover:bg-blue-500"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!address) {
    return (
      <div className="text-center py-20">
        <button
          onClick={onConnect}
          className="px-8 py-3 bg-blue-600 rounded-xl text-lg font-semibold hover:bg-blue-500 transition"
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  const wrongChain = chainId !== arcTestnet.id;

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 bg-gray-800 px-4 py-2 rounded-xl">
        <span
          className={`w-2 h-2 rounded-full ${
            wrongChain ? "bg-red-500" : "bg-green-400"
          }`}
        />
        <span className="text-sm font-mono">
          {address.slice(0, 6)}...{address.slice(-4)}
        </span>
      </div>
      {wrongChain && (
        <span className="text-red-400 text-sm">Wrong network</span>
      )}
      <button
        onClick={onDisconnect}
        className="text-sm text-gray-400 hover:text-white transition"
      >
        Disconnect
      </button>
    </div>
  );
}
