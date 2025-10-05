"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type UseMetaMaskState = {
  provider: any | undefined;
  chainId: number | undefined;
  accounts: string[] | undefined;
  isConnected: boolean;
  connect: () => void;
  isConnecting: boolean;
  error: Error | undefined;
};

export function useMetaMask(): UseMetaMaskState {
  const [provider, setProvider] = useState<any | undefined>(undefined);
  const [chainId, setChainId] = useState<number | undefined>(undefined);
  const [accounts, setAccounts] = useState<string[] | undefined>(undefined);
  const [error, setError] = useState<Error | undefined>(undefined);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);

  const connect = useCallback(() => {
    (async () => {
      try {
        setIsConnecting(true);
        const eth = (window as any).ethereum;
        if (!eth) {
          setError(new Error("MetaMask not found"));
          return;
        }
        setProvider(eth);
        const accs: string[] = await eth.request({ method: "eth_requestAccounts" });
        setAccounts(accs);
        try {
          const cid: string = await eth.request({ method: "eth_chainId" });
          setChainId(parseInt(cid, 16));
        } catch (e) {
          // ignore chain id error here; it will be populated by effect as fallback
        }
      } catch (e) {
        setError(e as Error);
      } finally {
        setIsConnecting(false);
      }
    })();
  }, []);

  useEffect(() => {
    const eth = (window as any).ethereum;
    if (!eth) return;
    setProvider(eth);
    eth.request({ method: "eth_chainId" }).then((cid: string) => setChainId(parseInt(cid, 16)));
    eth.request({ method: "eth_accounts" }).then((accs: string[]) => setAccounts(accs));
    const handleChainChanged = (cid: string) => setChainId(parseInt(cid, 16));
    const handleAccountsChanged = (accs: string[]) => setAccounts(accs);
    eth.on("chainChanged", handleChainChanged);
    eth.on("accountsChanged", handleAccountsChanged);
    return () => {
      eth.removeListener("chainChanged", handleChainChanged);
      eth.removeListener("accountsChanged", handleAccountsChanged);
    };
  }, []);

  return {
    provider,
    chainId,
    accounts,
    isConnected: Boolean(provider && accounts && accounts.length > 0),
    connect,
    isConnecting,
    error,
  };
}


