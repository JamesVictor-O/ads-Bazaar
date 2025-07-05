import { hashEndpointWithScope } from "@selfxyz/core";
import { ethers } from "ethers";
import "dotenv/config";
require("dotenv").config();

/**
 * Calculate the hashed scope for the AdsBazaar contract deployment
 *
 * Run this script before deploying to generate the HASHED_SCOPE value:
 * ts-node calculateScope.ts
 *
 * Then use the output to set the environment variable:
 * export HASHED_SCOPE=<output_from_script>
 */

async function main() {
  // Replace with your actual wallet address and RPC URL
  const deployerAddress = process.env.DEPLOYER_ADDRESS;
  if (!deployerAddress) {
    throw new Error("DEPLOYER_ADDRESS environment variable is not set.");
  }
  const provider = new ethers.JsonRpcProvider(process.env.ALFAJORES_RPC_URL);

  // Get the current nonce for the deployer
  const nonce = await provider.getTransactionCount(deployerAddress);
  console.log(`Current nonce for ${deployerAddress}: ${nonce}`);

  // Calculate the future contract address
  const futureAddress = ethers.getCreateAddress({
    from: deployerAddress,
    nonce,
  });
  console.log(`Future contract address: ${futureAddress}`);

  // Calculate the scope hash
  const appName = "AdsBazaar";
  const scope = hashEndpointWithScope(futureAddress, appName);

  console.log(`\n=== SCOPE CALCULATION SUMMARY ===`);
  console.log(`Deployer Address: ${deployerAddress}`);
  console.log(`Current Nonce: ${nonce}`);
  console.log(`Future Contract Address: ${futureAddress}`);
  console.log(`Application Name: ${appName}`);
  console.log(`\nHASHED_SCOPE (use this value for deployment): ${scope}`);
  console.log(`\nRun the following command before deployment:`);
  console.log(`export HASHED_SCOPE=${scope}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
