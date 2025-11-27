import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * Basic deploy script:
 *   npx hardhat run scripts/deploy.ts --network sepolia
 */
async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying Kafel with account:", deployer.address);

  const trustedForwarder =
    process.env.TRUSTED_FORWARDER_ADDRESS || ethers.ZeroAddress;

  console.log("Using trustedForwarder:", trustedForwarder);

  const Kafel = await ethers.getContractFactory("Kafel");
  const token = await Kafel.deploy(trustedForwarder);
  await token.waitForDeployment();

  console.log("Kafel deployed to:", await token.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
