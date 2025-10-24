import * as fs from "fs";
import * as path from "path";

const CONTRACT_NAME = "TreasureFHE";
const rel = "../backend";
const outdir = path.resolve("./abi");

if (!fs.existsSync(outdir)) fs.mkdirSync(outdir);

const dir = path.resolve(rel);
const deploymentsDir = path.join(dir, "deployments");

function readDeploymentOptional(chainName, chainId, contractName) {
  const chainDeploymentDir = path.join(deploymentsDir, chainName);
  if (!fs.existsSync(chainDeploymentDir)) return undefined;
  const filePath = path.join(chainDeploymentDir, `${contractName}.json`);
  if (!fs.existsSync(filePath)) return undefined;
  const obj = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  obj.chainId = chainId;
  obj.chainName = chainName;
  return obj;
}

// Prefer Sepolia ABI when available; fall back to a local 31337 deployment (either 'hardhat' or 'localhost').
const deploySepolia = readDeploymentOptional("sepolia", 11155111, CONTRACT_NAME);
const deployHardhat = readDeploymentOptional("hardhat", 31337, CONTRACT_NAME);
const deployLocalhost = readDeploymentOptional("localhost", 31337, CONTRACT_NAME);
const deploy31337 = deployHardhat ?? deployLocalhost;

if (!deploySepolia && !deploy31337) {
  console.error(
    `No deployments found. Run 'npx hardhat deploy --network sepolia' or '--network hardhat' in backend first.`
  );
  process.exit(1);
}

if (deploySepolia && deploy31337) {
  if (JSON.stringify(deploySepolia.abi) !== JSON.stringify(deploy31337.abi)) {
    console.error(`ABIs differ across networks. Redeploy to align.`);
    process.exit(1);
  }
}

const abiSource = deploySepolia?.abi ?? deploy31337.abi;

const tsCode = `
/*
  This file is auto-generated.
  Command: 'npm run genabi'
*/
export const ${CONTRACT_NAME}ABI = ${JSON.stringify({ abi: abiSource }, null, 2)} as const;
`;
const tsAddresses = `
/*
  This file is auto-generated.
  Command: 'npm run genabi'
*/
export const ${CONTRACT_NAME}Addresses = { 
  "11155111": { address: "${deploySepolia?.address ?? "0x0000000000000000000000000000000000000000"}", chainId: 11155111, chainName: "sepolia" },
  "31337": { address: "${deploy31337?.address ?? "0x0000000000000000000000000000000000000000"}", chainId: 31337, chainName: "${deploy31337?.chainName ?? "hardhat"}" },
};
`;

if (!fs.existsSync(outdir)) fs.mkdirSync(outdir, { recursive: true });
fs.writeFileSync(path.join(outdir, `${CONTRACT_NAME}ABI.ts`), tsCode, "utf-8");
fs.writeFileSync(path.join(outdir, `${CONTRACT_NAME}Addresses.ts`), tsAddresses, "utf-8");
console.log(`Generated abi for ${CONTRACT_NAME}`);


