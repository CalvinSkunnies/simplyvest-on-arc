import { useCallback, useEffect, useState } from "react";
import { createWalletClient, custom, type Address } from "viem";
import { arcTestnet } from "./arc-chain";
import { formatError } from "./errors";

export function useWallet() {
  const [address, setAddress] = useState<Address | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const client = window.ethereum
    ? createWalletClient({ chain: arcTestnet, transport: custom(window.ethereum) })
    : null;

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      setError("Please install MetaMask");
      return;
    }
    try {
      const [addr] = await client!.requestAddresses();
      const id = await client!.getChainId();
      setAddress(addr);
      setChainId(id);
      setError(null);

      if (id !== arcTestnet.id) {
        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: `0x${arcTestnet.id.toString(16)}` }],
          });
        } catch {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: `0x${arcTestnet.id.toString(16)}`,
                chainName: arcTestnet.name,
                nativeCurrency: arcTestnet.nativeCurrency,
                rpcUrls: [arcTestnet.rpcUrls.default.http[0]],
              },
            ],
          });
        }
        const id2 = await client!.getChainId();
        setChainId(id2);
      }
    } catch (e) {
      setError(formatError(e));
    }
  }, [client]);

  const disconnect = useCallback(() => {
    setAddress(null);
    setChainId(null);
  }, []);

  useEffect(() => {
    if (!window.ethereum) return;
    const handleAccountsChanged = ([a]: Address[]) => {
      if (a) setAddress(a);
      else disconnect();
    };
    const handleChainChanged = (id: string) => setChainId(Number(id));
    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);
    return () => {
      window.ethereum?.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum?.removeListener("chainChanged", handleChainChanged);
    };
  }, [disconnect]);

  return { address, chainId, error, client, connect, disconnect };
}

export function useEthersProvider() {
  const [provider, setProvider] = useState<import("viem").PublicClient | null>(
    null
  );

  useEffect(() => {
    import("viem").then(({ createPublicClient, http }) => {
      setProvider(
        createPublicClient({
          chain: arcTestnet,
          transport: http(),
        })
      );
    });
  }, []);

  return provider;
}
