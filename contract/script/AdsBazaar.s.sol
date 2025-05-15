// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

import {Script, console} from "forge-std/Script.sol";
import {AdsBazaar} from "../src/AdsBazaar.sol";

contract DeployAdsBazaar is Script {
   
    address constant CELO_ALFAJORES_cUSD = 0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deployer address:", deployer);
        console.log("Using Alfajores cUSD at:", CELO_ALFAJORES_cUSD);

        vm.startBroadcast(deployerPrivateKey);
        
        AdsBazaar adsBazaar = new AdsBazaar(CELO_ALFAJORES_cUSD);
        
        vm.stopBroadcast();

        console.log("AdsBazaar deployed at:", address(adsBazaar));
        
    }
}
