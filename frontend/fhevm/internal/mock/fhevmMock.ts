import { MockFhevmInstance } from "@fhevm/mock-utils";
import { JsonRpcProvider } from "ethers";
import type { FhevmInstance } from "../../fhevmTypes";

export async function fhevmMockCreateInstance(parameters: {
  rpcUrl: string;
  chainId: number;
  metadata: { ACLAddress: `0x${string}`; InputVerifierAddress: `0x${string}`; KMSVerifierAddress: `0x${string}`; chainId?: number };
}): Promise<FhevmInstance> {
  const provider = new JsonRpcProvider(parameters.rpcUrl);
  const config = {
    verifyingContractAddressInputVerification: parameters.metadata.InputVerifierAddress,
    verifyingContractAddressDecryption: parameters.metadata.KMSVerifierAddress,
    kmsContractAddress: parameters.metadata.KMSVerifierAddress,
    inputVerifierContractAddress: parameters.metadata.InputVerifierAddress,
    aclContractAddress: parameters.metadata.ACLAddress,
    chainId: parameters.chainId,
    gatewayChainId: parameters.metadata.chainId ?? parameters.chainId,
  };
  const instance = await MockFhevmInstance.create(provider as any, provider, config as any);
  return instance as unknown as FhevmInstance;
}


