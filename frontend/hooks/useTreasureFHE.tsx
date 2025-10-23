"use client";

import { ethers } from "ethers";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FhevmInstance } from "@/fhevm/fhevmTypes";
import { FhevmDecryptionSignature } from "@/fhevm/FhevmDecryptionSignature";
import { GenericStringStorage } from "@/fhevm/GenericStringStorage";
import { TreasureFHEABI } from "@/abi/TreasureFHEABI";
import { TreasureFHEAddresses } from "@/abi/TreasureFHEAddresses";

type ClearValueType = { handle: string; clear: string | bigint | boolean };

function getTreasureFHEByChainId(chainId: number | undefined) {
  if (!chainId) return { abi: TreasureFHEABI.abi };
  const entry = TreasureFHEAddresses[chainId.toString() as keyof typeof TreasureFHEAddresses];
  if (!("address" in entry) || entry.address === ethers.ZeroAddress) {
    return { abi: TreasureFHEABI.abi, chainId };
  }
  return {
    address: entry?.address as `0x${string}` | undefined,
    chainId: entry?.chainId ?? chainId,
    chainName: entry?.chainName,
    abi: TreasureFHEABI.abi,
  };
}

export const useTreasureFHE = (parameters: {
  instance: FhevmInstance | undefined;
  fhevmDecryptionSignatureStorage: GenericStringStorage;
  eip1193Provider: ethers.Eip1193Provider | undefined;
  chainId: number | undefined;
  ethersSigner: ethers.JsonRpcSigner | undefined;
  ethersReadonlyProvider: ethers.ContractRunner | undefined;
  sameChain: React.RefObject<(chainId: number | undefined) => boolean>;
  sameSigner: React.RefObject<(ethersSigner: ethers.JsonRpcSigner | undefined) => boolean>;
}) => {
  const {
    instance,
    fhevmDecryptionSignatureStorage,
    chainId,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
  } = parameters;

  const [message, setMessage] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [isEncrypting, setIsEncrypting] = useState(false);

  const [keyHandle, setKeyHandle] = useState<string | undefined>(undefined);
  const [lastRewardHandle, setLastRewardHandle] = useState<string | undefined>(undefined);
  const [totalKeysSoldHandle, setTotalKeysSoldHandle] = useState<string | undefined>(undefined);
  const [totalBoxesOpenedHandle, setTotalBoxesOpenedHandle] = useState<string | undefined>(undefined);
  const [lastRewardClear, setLastRewardClear] = useState<ClearValueType | undefined>(undefined);
  const lastRewardClearRef = useRef<ClearValueType | undefined>(undefined);
  const [keyClear, setKeyClear] = useState<ClearValueType | undefined>(undefined);
  const [poolBalanceWei, setPoolBalanceWei] = useState<string | undefined>(undefined);
  const [ownerAddress, setOwnerAddress] = useState<string | undefined>(undefined);

  const stateRef = useRef({ isRefreshing: false, isDecrypting: false, isEncrypting: false });
  const treasureRef = useRef<ReturnType<typeof getTreasureFHEByChainId> | undefined>(undefined);

  const contractInfo = useMemo(() => {
    const c = getTreasureFHEByChainId(chainId);
    treasureRef.current = c;
    return c;
  }, [chainId]);

  const isDeployed = useMemo(() => {
    if (!contractInfo) return undefined;
    return Boolean(contractInfo.address) && contractInfo.address !== ethers.ZeroAddress;
  }, [contractInfo]);

  const canGetAll = useMemo(() => {
    const hasReader = Boolean(ethersReadonlyProvider || ethersSigner);
    return Boolean(contractInfo.address) && hasReader && !isRefreshing;
  }, [contractInfo.address, ethersReadonlyProvider, ethersSigner, isRefreshing]);
  const canDecryptLast = useMemo(
    () => Boolean(contractInfo.address && instance && ethersSigner && (lastRewardHandle || keyHandle)) && !isDecrypting,
    [contractInfo.address, instance, ethersSigner, lastRewardHandle, keyHandle, isDecrypting]
  );
  const canBuy = useMemo(
    () => Boolean(contractInfo.address && instance && ethersSigner) && !isEncrypting,
    [contractInfo.address, instance, ethersSigner, isEncrypting]
  );
  const canOpen = useMemo(
    () => Boolean(contractInfo.address && instance && ethersSigner) && !isEncrypting,
    [contractInfo.address, instance, ethersSigner, isEncrypting]
  );
  const canClaim = useMemo(
    () => Boolean(contractInfo.address && instance && ethersSigner) && !isEncrypting,
    [contractInfo.address, instance, ethersSigner, isEncrypting]
  );

  const refreshAll = useCallback(() => {
    if (stateRef.current.isRefreshing) return;
    if (!treasureRef.current?.address || (!ethersReadonlyProvider && !ethersSigner)) {
      setKeyHandle(undefined);
      setLastRewardHandle(undefined);
      setTotalKeysSoldHandle(undefined);
      setTotalBoxesOpenedHandle(undefined);
      return;
    }
    stateRef.current.isRefreshing = true;
    setIsRefreshing(true);
    const thisAddress = treasureRef.current.address;
    const thisAbi = treasureRef.current.abi;
    (async () => {
      try {
        const runnerForCode: any = (ethersReadonlyProvider as any)?.getCode
          ? (ethersReadonlyProvider as any)
          : (ethersSigner as any)?.provider;
        if (runnerForCode && thisAddress) {
          const code: string = await runnerForCode.getCode(thisAddress);
          if (!code || code === "0x") {
            setKeyHandle(undefined);
            setLastRewardHandle(undefined);
            setTotalKeysSoldHandle(undefined);
            setTotalBoxesOpenedHandle(undefined);
            setPoolBalanceWei(undefined);
            setOwnerAddress(undefined);
            setMessage(`Contract not found at ${thisAddress}. Please deploy and regenerate addresses.`);
            return;
          }
        }
        const cUser = ethersSigner ? new ethers.Contract(thisAddress!, thisAbi, ethersSigner) : undefined;
        const cRead = ethersReadonlyProvider ? new ethers.Contract(thisAddress!, thisAbi, ethersReadonlyProvider) : (cUser as ethers.Contract);
        const zero = "0x0000000000000000000000000000000000000000000000000000000000000000";
        const pKey = cUser ? cUser.getMyKeyBalance() : Promise.resolve(zero);
        const pLast = cUser ? cUser.getMyLastRewardType() : Promise.resolve(zero);
        const pTks = cRead.getTotalKeysSold();
        const pTbo = cRead.getTotalBoxesOpened();
        const pPool = cRead.getPoolBalance ? cRead.getPoolBalance() : Promise.resolve("0x0");
        const pOwner = cRead.owner ? cRead.owner() : Promise.resolve(ethers.ZeroAddress);
        const [k, r, tks, tbo, pb, ow]: [string, string, string, string, string, string] = await Promise.all([pKey, pLast, pTks, pTbo, pPool, pOwner]);
        setKeyHandle(k);
        setLastRewardHandle(r);
        setTotalKeysSoldHandle(tks);
        setTotalBoxesOpenedHandle(tbo);
        setPoolBalanceWei(pb);
        setOwnerAddress(ow);
      } catch (e) {
        setMessage("refreshAll failed: " + (e as Error).message);
      } finally { stateRef.current.isRefreshing = false; setIsRefreshing(false); }
    })();
  }, [ethersReadonlyProvider, ethersSigner]);

  useEffect(() => { refreshAll(); }, [refreshAll]);

  const decryptLastReward = useCallback(() => {
    if (stateRef.current.isDecrypting) return;
    if (!treasureRef.current?.address || !instance || !ethersSigner) return;
    if (!lastRewardHandle && !keyHandle) return;

    stateRef.current.isDecrypting = true;
    setIsDecrypting(true);
    const thisChainId = chainId;
    const thisAddress = treasureRef.current.address!;
    const thisLastHandle = lastRewardHandle;
    const thisKeyHandle = keyHandle;
    const thisSigner = ethersSigner;

    const isStale = () => thisAddress !== treasureRef.current?.address || !sameChain.current(thisChainId) || !sameSigner.current(thisSigner);

    (async () => {
      try {
        const sig = await FhevmDecryptionSignature.loadOrSign(
          instance,
          [thisAddress as `0x${string}`],
          thisSigner,
          fhevmDecryptionSignatureStorage
        );
        if (!sig) { setMessage("Unable to build decryption signature"); return; }
        if (isStale()) { setMessage("Ignore decrypt"); return; }
        const ZERO_HANDLE = "0x0000000000000000000000000000000000000000000000000000000000000000";
        const decryptTargets = [] as { handle: string; contractAddress: `0x${string}` }[];

        // Prepare key handle
        if (thisKeyHandle) {
          if (thisKeyHandle.toLowerCase() === ZERO_HANDLE) {
            // treat zero handle as 0 without decryption
            setKeyClear({ handle: thisKeyHandle, clear: 0n });
          } else {
            decryptTargets.push({ handle: thisKeyHandle, contractAddress: thisAddress });
          }
        }

        // Prepare last reward handle
        if (thisLastHandle) {
          if (thisLastHandle.toLowerCase() === ZERO_HANDLE) {
            setLastRewardClear({ handle: thisLastHandle, clear: 0n });
            lastRewardClearRef.current = { handle: thisLastHandle, clear: 0n };
          } else {
            decryptTargets.push({ handle: thisLastHandle, contractAddress: thisAddress });
          }
        }

        if (decryptTargets.length === 0) { return; }
        const res = await instance.userDecrypt(
          decryptTargets,
          sig.privateKey,
          sig.publicKey,
          sig.signature,
          sig.contractAddresses,
          sig.userAddress,
          sig.startTimestamp,
          sig.durationDays
        );
        if (isStale()) { setMessage("Ignore decrypt"); return; }
        // update key clear if requested
        if (thisKeyHandle) {
          const kc = res[thisKeyHandle];
          setKeyClear({ handle: thisKeyHandle, clear: kc });
        }
        // update last reward clear if requested
        if (thisLastHandle) {
          const lv = res[thisLastHandle];
          setLastRewardClear({ handle: thisLastHandle, clear: lv });
          lastRewardClearRef.current = { handle: thisLastHandle, clear: lv };
          let desc = "";
          if (lv === 0n || lv === "0") desc = "Reward 0 = 0.0001 ETH";
          else if (lv === 1n || lv === "1") desc = "Reward 1 = 0.0005 ETH";
          else if (lv === 2n || lv === "2") desc = "Reward 2 = 0.001 ETH";
          if (desc) setMessage(thisKeyHandle ? `${desc} | Keys = ${String(res[thisKeyHandle])}` : desc);
        } else if (thisKeyHandle) {
          setMessage(`Keys = ${String(res[thisKeyHandle])}`);
        }
      } finally { stateRef.current.isDecrypting = false; setIsDecrypting(false); }
    })();
  }, [fhevmDecryptionSignatureStorage, instance, ethersSigner, lastRewardHandle, keyHandle, chainId, sameChain, sameSigner]);

  const buyOneKey = useCallback(() => {
    if (stateRef.current.isEncrypting) return;
    if (!treasureRef.current?.address || !ethersSigner) return;
    const thisAddress = treasureRef.current.address!;
    const thisSigner = ethersSigner;
    const c = new ethers.Contract(thisAddress, treasureRef.current.abi, thisSigner);
    stateRef.current.isEncrypting = true;
    setIsEncrypting(true);
    (async () => {
      try {
        const value = ethers.parseEther("0.0002");
        const tx = await c.buyKey({ value });
        await tx.wait();
        refreshAll();
      } catch (e) {
        setMessage("buyKey failed: " + (e as Error).message);
      } finally { stateRef.current.isEncrypting = false; setIsEncrypting(false); }
    })();
  }, [ethersSigner, refreshAll]);

  const claimReward = useCallback(() => {
    if (stateRef.current.isEncrypting) return;
    if (!treasureRef.current?.address || !ethersSigner || !lastRewardHandle) return;
    const thisAddress = treasureRef.current.address!;
    const thisSigner = ethersSigner;
    const c = new ethers.Contract(thisAddress, treasureRef.current.abi, thisSigner);
    stateRef.current.isEncrypting = true;
    setIsEncrypting(true);
    (async () => {
      try {
        const tx = await c.claimRewardRequest();
        await tx.wait();
        refreshAll();
      } catch (e) {
        setMessage("claimReward failed: " + (e as Error).message);
      } finally { stateRef.current.isEncrypting = false; setIsEncrypting(false); }
    })();
  }, [ethersSigner, lastRewardHandle, refreshAll]);

  const openBox = useCallback(() => {
    if (stateRef.current.isEncrypting) return;
    if (!treasureRef.current?.address || !instance || !ethersSigner) return;
    const thisAddress = treasureRef.current.address!;
    const thisSigner = ethersSigner;
    const c = new ethers.Contract(thisAddress, treasureRef.current.abi, thisSigner);
    stateRef.current.isEncrypting = true;
    setIsEncrypting(true);
    (async () => {
      try {
        const tx = await c.openBox();
        await tx.wait();
        refreshAll();
      } catch (e) {
        setMessage("openBox failed: " + (e as Error).message);
      } finally { stateRef.current.isEncrypting = false; setIsEncrypting(false); }
    })();
  }, [instance, ethersSigner, refreshAll]);

  const fundPool = useCallback((amountEth: string) => {
    if (stateRef.current.isEncrypting) return;
    if (!treasureRef.current?.address || !ethersSigner) return;
    const thisAddress = treasureRef.current.address!;
    const thisSigner = ethersSigner;
    const c = new ethers.Contract(thisAddress, treasureRef.current.abi, thisSigner);
    stateRef.current.isEncrypting = true;
    setIsEncrypting(true);
    (async () => {
      try {
        const value = ethers.parseEther(amountEth);
        const tx = await c.fundPool({ value });
        await tx.wait();
        refreshAll();
      } catch (e) {
        setMessage("fundPool failed: " + (e as Error).message);
      } finally { stateRef.current.isEncrypting = false; setIsEncrypting(false); }
    })();
  }, [ethersSigner, refreshAll]);

  const canFund = useMemo(() => {
    const signerAddr = (ethersSigner as any)?.address as string | undefined;
    if (!signerAddr || !ownerAddress) return false;
    return Boolean(contractInfo.address) && signerAddr.toLowerCase() === ownerAddress.toLowerCase();
  }, [contractInfo.address, ethersSigner, ownerAddress]);

  return {
    contractAddress: contractInfo.address,
    canGetAll,
    canDecryptLast,
    canBuy,
    canOpen,
    canClaim,
    canFund,
    refreshAll,
    decryptLastReward,
    buyKeys: buyOneKey,
    claimReward,
    openBox,
    fundPool,
    message,
    keyHandle,
    lastRewardHandle,
    totalKeysSoldHandle,
    totalBoxesOpenedHandle,
    poolBalanceWei,
    ownerAddress,
    lastRewardClear: lastRewardClear?.clear,
    keyClear: keyClear?.clear,
    isLastDecrypted: lastRewardHandle && lastRewardHandle === lastRewardClear?.handle,
    isDeployed,
  };
};


