import { openDB, DBSchema, IDBPDatabase } from "idb";

type FhevmStoredPublicKey = { publicKeyId: string; publicKey: Uint8Array };
type FhevmStoredPublicParams = { publicParamsId: string; publicParams: Uint8Array };

interface PublicParamsDB extends DBSchema {
  publicKeyStore: { key: string; value: { acl: `0x${string}`; value: FhevmStoredPublicKey } };
  paramsStore: { key: string; value: { acl: `0x${string}`; value: FhevmStoredPublicParams } };
}

let __dbPromise: Promise<IDBPDatabase<PublicParamsDB>> | undefined = undefined;

async function _getDB(): Promise<IDBPDatabase<PublicParamsDB> | undefined> {
  if (__dbPromise) return __dbPromise;
  if (typeof window === "undefined") return undefined;
  __dbPromise = openDB<PublicParamsDB>("fhevm", 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("paramsStore")) db.createObjectStore("paramsStore", { keyPath: "acl" });
      if (!db.objectStoreNames.contains("publicKeyStore")) db.createObjectStore("publicKeyStore", { keyPath: "acl" });
    },
  });
  return __dbPromise;
}

function assertFhevmStoredPublicKey(value: unknown): asserts value is FhevmStoredPublicKey | null {
  if (typeof value !== "object") throw new Error(`FhevmStoredPublicKey must be an object`);
  if (value === null) return;
  if (!("publicKeyId" in value) || typeof (value as any).publicKeyId !== "string") throw new Error("bad publicKeyId");
  if (!("publicKey" in value) || !((value as any).publicKey instanceof Uint8Array)) throw new Error("bad publicKey");
}

function assertFhevmStoredPublicParams(value: unknown): asserts value is FhevmStoredPublicParams | null {
  if (typeof value !== "object") throw new Error(`FhevmStoredPublicParams must be an object`);
  if (value === null) return;
  if (!("publicParamsId" in value) || typeof (value as any).publicParamsId !== "string") throw new Error("bad publicParamsId");
  if (!("publicParams" in value) || !((value as any).publicParams instanceof Uint8Array)) throw new Error("bad publicParams");
}

export async function publicKeyStorageGet(aclAddress: `0x${string}`): Promise<{
  publicKey?: { data: Uint8Array | null; id: string | null };
  publicParams: { "2048": { publicParamsId: string; publicParams: Uint8Array } } | null;
}> {
  const db = await _getDB();
  if (!db) return { publicParams: null };

  let storedPublicKey: FhevmStoredPublicKey | null = null;
  try {
    const pk = await db.get("publicKeyStore", aclAddress);
    if (pk?.value) {
      assertFhevmStoredPublicKey(pk.value);
      storedPublicKey = pk.value;
    }
  } catch {}

  let storedPublicParams: FhevmStoredPublicParams | null = null;
  try {
    const pp = await db.get("paramsStore", aclAddress);
    if (pp?.value) {
      assertFhevmStoredPublicParams(pp.value);
      storedPublicParams = pp.value;
    }
  } catch {}

  const publicKeyData = storedPublicKey?.publicKey;
  const publicKeyId = storedPublicKey?.publicKeyId;
  const publicParams = storedPublicParams ? { "2048": storedPublicParams } : null;
  let publicKey: { data: Uint8Array | null; id: string | null } | undefined = undefined;
  if (publicKeyId && publicKeyData) publicKey = { id: publicKeyId, data: publicKeyData };
  return { ...(publicKey !== undefined && { publicKey }), publicParams };
}

export async function publicKeyStorageSet(
  aclAddress: `0x${string}`,
  publicKey: FhevmStoredPublicKey | null,
  publicParams: FhevmStoredPublicParams | null
) {
  assertFhevmStoredPublicKey(publicKey);
  assertFhevmStoredPublicParams(publicParams);
  const db = await _getDB();
  if (!db) return;
  if (publicKey) await db.put("publicKeyStore", { acl: aclAddress, value: publicKey });
  if (publicParams) await db.put("paramsStore", { acl: aclAddress, value: publicParams });
}


