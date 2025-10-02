import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy, log } = hre.deployments;

  const deployed = await deploy("TreasureFHE", {
    from: deployer,
    log: true,
  });

  log(`TreasureFHE contract: ${deployed.address}`);
};
export default func;
func.id = "deploy_treasureFHE"; // id required to prevent reexecution
func.tags = ["TreasureFHE"];


