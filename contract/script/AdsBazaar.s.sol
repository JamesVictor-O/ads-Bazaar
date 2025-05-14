// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {AdsBazaar} from "../src/AdsBazaar.sol";

contract DeployAdsBazaar is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);
        
        address cUSD = 0x874069fa1eb16d44d622f2e0ca25eea172369bc1; 
        AdsBazaar adsBazaar = new AdsBazaar(cUSD);
        
        vm.stopBroadcast();
        
        console.log("AdsBazaar deployed at:", address(adsBazaar));
    }
}
