
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

import {Script, console} from "forge-std/Script.sol";
import {AdsBazaar} from "../src/AdsBazaar.sol";

contract DeployAdsBazaar is Script {
   
    // Constants for deployment
    address constant CELO_ALFAJORES_cUSD = 0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1;
    
    // Self protocol integration parameters for Alfajores testnet
    address constant IDENTITY_VERIFICATION_HUB_ALFAJORES = 0x3e2487a250e2A7b56c7ef5307Fb591Cc8C83623D;
    
    function run() external {
        // Get the private key from the environment variable
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        // Log deployment information
        console.log("Deploying contracts with the account:", deployer);
        console.log("Using Alfajores cUSD at:", CELO_ALFAJORES_cUSD);
        console.log("Using Identity Verification Hub at:", IDENTITY_VERIFICATION_HUB_ALFAJORES);
        
        // Get scope from environment (should be pre-calculated with the Self SDK)
        uint256 scope = vm.envUint("HASHED_SCOPE");
        console.log("Using scope from environment:", scope);
        
        // Set up attestation IDs (e.g., 1 for passports)
        uint256[] memory attestationIds = new uint256[](1);
        attestationIds[0] = 1; // For passport verification
        
        // Start broadcasting transactions
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy the contract
        console.log("Deploying AdsBazaar...");
        AdsBazaar adsBazaar = new AdsBazaar(
            CELO_ALFAJORES_cUSD,
            IDENTITY_VERIFICATION_HUB_ALFAJORES,
            scope,
            attestationIds
        );
        
        // Stop broadcasting
        vm.stopBroadcast();
        
        // Log deployment summary
        console.log("\n=== DEPLOYMENT SUMMARY ===");
        console.log("Contract: AdsBazaar");
        console.log("Address: %s", address(adsBazaar));
        console.log("cUSD Token: %s", CELO_ALFAJORES_cUSD);
        console.log("Identity Hub: %s", IDENTITY_VERIFICATION_HUB_ALFAJORES);
        console.log("Scope: %s", scope);
    }
}