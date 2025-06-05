// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

import {Script, console} from "forge-std/Script.sol";
import {AdsBazaar} from "../src/AdsBazaar.sol";

contract DeployAdsBazaar is Script {
   
    address constant CELO_Cusd = 0x765DE816845861e75A25fCA122bb6898B8B1282a;

    address constant CELO_Cusd_Alfajores = 0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1;
    
    // Self protocol integration parameters for celo mainnet
    address constant IDENTITY_VERIFICATION_HUB = 0x77117D60eaB7C044e785D68edB6C7E0e134970Ea;
    address constant MOCK_IDENTITY_VERIFICATION_HUB = 0x3e2487a250e2A7b56c7ef5307Fb591Cc8C83623D;
    
    
    function run() external {
        // Get the private key from the environment variable
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        // Log deployment information
        console.log("Deploying contracts with the account:", deployer);
        console.log("Using cUSD at:", CELO_Cusd);
        console.log("Using Identity Verification Hub at:", IDENTITY_VERIFICATION_HUB);
        
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
            CELO_Cusd,
            IDENTITY_VERIFICATION_HUB,
            scope,
            attestationIds
        );
        
        // Stop broadcasting
        vm.stopBroadcast();
        
        // Log deployment summary
        console.log("\n=== DEPLOYMENT SUMMARY ===");
        console.log("Contract: AdsBazaar");
        console.log("Address: %s", address(adsBazaar));
        console.log("cUSD Token: %s", CELO_Cusd);
        console.log("Identity Hub: %s", IDENTITY_VERIFICATION_HUB);
        console.log("Scope: %s", scope);
    }
}