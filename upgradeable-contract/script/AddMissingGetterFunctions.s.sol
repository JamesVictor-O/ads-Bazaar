// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

import "forge-std/Script.sol";
import "../contracts/adsbazaar-facets/GettersFacet.sol";
import "../contracts/interfaces/IDiamondCut.sol";

contract AddMissingGetterFunctions is Script {
    // The deployed diamond address
    address constant DIAMOND_ADDRESS = 0xe66b437DE9fbd724c59c635ABeB943f9d4c09677;
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Adding missing getter functions to diamond...");
        console.log("Diamond Address:", DIAMOND_ADDRESS);
        console.log("Deployer:", deployer);
        console.log("Chain ID:", block.chainid);

        vm.startBroadcast(deployerPrivateKey);

        // Get the existing GettersFacet address from the diamond
        // We need to add the missing function selectors to the existing facet
        
        // Create the missing function selectors
        bytes4[] memory missingSelectors = new bytes4[](4);
        missingSelectors[0] = GettersFacet.getTotalBusinesses.selector;
        missingSelectors[1] = GettersFacet.getTotalInfluencers.selector; 
        missingSelectors[2] = GettersFacet.getUserUsername.selector;
        missingSelectors[3] = GettersFacet.isRegistered.selector;
        
        console.log("Missing function selectors:");
        console.log("getTotalBusinesses:", uint32(GettersFacet.getTotalBusinesses.selector));
        console.log("getTotalInfluencers:", uint32(GettersFacet.getTotalInfluencers.selector));
        console.log("getUserUsername:", uint32(GettersFacet.getUserUsername.selector));
        console.log("isRegistered:", uint32(GettersFacet.isRegistered.selector));

        // First, we need to find the current GettersFacet address
        // We'll use DiamondLoupe to get the facet address for getTotalUsers (which we know exists)
        address gettersFacetAddress = IDiamondLoupe(DIAMOND_ADDRESS).facetAddress(GettersFacet.getTotalUsers.selector);
        
        console.log("Current GettersFacet address:", gettersFacetAddress);
        
        // Create FacetCut to add the missing selectors to the existing facet
        IDiamondCut.FacetCut[] memory cuts = new IDiamondCut.FacetCut[](1);
        cuts[0] = IDiamondCut.FacetCut({
            facetAddress: gettersFacetAddress,
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: missingSelectors
        });

        // Execute the diamond cut
        IDiamondCut(DIAMOND_ADDRESS).diamondCut(
            cuts,
            address(0),
            ""
        );

        console.log("Missing getter functions added successfully!");
        console.log("Functions now available:");
        console.log("- getTotalBusinesses()");
        console.log("- getTotalInfluencers()");
        console.log("- getUserUsername(address)");
        console.log("- isRegistered(address)");

        vm.stopBroadcast();
    }
}

interface IDiamondLoupe {
    function facetAddress(bytes4 _functionSelector) external view returns (address facetAddress_);
}