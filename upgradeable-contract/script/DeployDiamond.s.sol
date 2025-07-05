// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

import {Script, console} from "forge-std/Script.sol";
import {Diamond} from "../contracts/Diamond.sol";
import {DiamondCutFacet} from "../contracts/facets/DiamondCutFacet.sol";
import {DiamondLoupeFacet} from "../contracts/facets/DiamondLoupeFacet.sol";
import {OwnershipFacet} from "../contracts/facets/OwnershipFacet.sol";
import {UserManagementFacet} from "../contracts/adsbazaar-facets/UserManagementFacet.sol";
import {CampaignManagementFacet} from "../contracts/adsbazaar-facets/CampaignManagementFacet.sol";
import {ApplicationManagementFacet} from "../contracts/adsbazaar-facets/ApplicationManagementFacet.sol";
import {ProofManagementFacet} from "../contracts/adsbazaar-facets/ProofManagementFacet.sol";
import {PaymentManagementFacet} from "../contracts/adsbazaar-facets/PaymentManagementFacet.sol";
import {DisputeManagementFacet} from "../contracts/adsbazaar-facets/DisputeManagementFacet.sol";
import {GettersFacet} from "../contracts/adsbazaar-facets/GettersFacet.sol";
import {AdsBazaarInit} from "../contracts/upgradeInitializers/AdsBazaarInit.sol";
import {IDiamondCut} from "../contracts/interfaces/IDiamondCut.sol";

contract DeployDiamond is Script {
    
    // Celo Mainnet addresses
    address constant CELO_CUSD_MAINNET = 0x765DE816845861e75A25fCA122bb6898B8B1282a;
    address constant IDENTITY_HUB_MAINNET = 0x77117D60eaB7C044e785D68edB6C7E0e134970Ea;
    
    // Celo Alfajores (Testnet) addresses  
    address constant CELO_CUSD_ALFAJORES = 0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1;
    address constant IDENTITY_HUB_ALFAJORES = 0x3e2487a250e2A7b56c7ef5307Fb591Cc8C83623D; // Mock hub for testnet
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        // Detect network and set appropriate addresses
        uint256 chainId = block.chainid;
        address cUSD;
        address identityHub;
        string memory networkName;
        
        if (chainId == 42220) {
            // Celo Mainnet
            cUSD = CELO_CUSD_MAINNET;
            identityHub = IDENTITY_HUB_MAINNET;
            networkName = "Celo Mainnet";
        } else if (chainId == 44787) {
            // Celo Alfajores Testnet
            cUSD = CELO_CUSD_ALFAJORES;
            identityHub = IDENTITY_HUB_ALFAJORES;
            networkName = "Celo Alfajores (Testnet)";
        } else {
            revert("Unsupported network. Only Celo Mainnet (42220) and Alfajores (44787) are supported.");
        }
        
        console.log("Deploying AdsBazaar Diamond on:", networkName);
        console.log("Chain ID:", chainId);
        console.log("Deploying with account:", deployer);
        console.log("Using cUSD at:", cUSD);
        console.log("Using Identity Verification Hub at:", identityHub);
        
        // Get scope from environment
        uint256 scope = vm.envUint("HASHED_SCOPE");
        console.log("Using scope from environment:", scope);
        
        // Set up attestation IDs
        uint256[] memory attestationIds = new uint256[](1);
        attestationIds[0] = 1; // For passport verification
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy DiamondCutFacet
        DiamondCutFacet diamondCutFacet = new DiamondCutFacet();
        console.log("DiamondCutFacet deployed:", address(diamondCutFacet));
        
        // Deploy Diamond
        Diamond diamond = new Diamond(deployer, address(diamondCutFacet));
        console.log("Diamond deployed:", address(diamond));
        
        // Deploy standard facets
        DiamondLoupeFacet diamondLoupeFacet = new DiamondLoupeFacet();
        OwnershipFacet ownershipFacet = new OwnershipFacet();
        console.log("DiamondLoupeFacet deployed:", address(diamondLoupeFacet));
        console.log("OwnershipFacet deployed:", address(ownershipFacet));
        
        // Deploy AdsBazaar facets
        UserManagementFacet userManagementFacet = new UserManagementFacet();
        CampaignManagementFacet campaignManagementFacet = new CampaignManagementFacet();
        ApplicationManagementFacet applicationManagementFacet = new ApplicationManagementFacet();
        ProofManagementFacet proofManagementFacet = new ProofManagementFacet();
        PaymentManagementFacet paymentManagementFacet = new PaymentManagementFacet();
        DisputeManagementFacet disputeManagementFacet = new DisputeManagementFacet();
        GettersFacet gettersFacet = new GettersFacet();
        
        console.log("UserManagementFacet deployed:", address(userManagementFacet));
        console.log("CampaignManagementFacet deployed:", address(campaignManagementFacet));
        console.log("ApplicationManagementFacet deployed:", address(applicationManagementFacet));
        console.log("ProofManagementFacet deployed:", address(proofManagementFacet));
        console.log("PaymentManagementFacet deployed:", address(paymentManagementFacet));
        console.log("DisputeManagementFacet deployed:", address(disputeManagementFacet));
        console.log("GettersFacet deployed:", address(gettersFacet));
        
        // Deploy AdsBazaarInit
        AdsBazaarInit adsBazaarInit = new AdsBazaarInit();
        console.log("AdsBazaarInit deployed:", address(adsBazaarInit));
        
        // Prepare diamond cut
        IDiamondCut.FacetCut[] memory cut = new IDiamondCut.FacetCut[](8);
        
        // Standard facets
        cut[0] = IDiamondCut.FacetCut({
            facetAddress: address(diamondLoupeFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: getLoupeSelectors()
        });
        
        cut[1] = IDiamondCut.FacetCut({
            facetAddress: address(ownershipFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: getOwnershipSelectors()
        });
        
        // AdsBazaar facets
        cut[2] = IDiamondCut.FacetCut({
            facetAddress: address(userManagementFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: getUserManagementSelectors()
        });
        
        cut[3] = IDiamondCut.FacetCut({
            facetAddress: address(campaignManagementFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: getCampaignManagementSelectors()
        });
        
        cut[4] = IDiamondCut.FacetCut({
            facetAddress: address(applicationManagementFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: getApplicationManagementSelectors()
        });
        
        cut[5] = IDiamondCut.FacetCut({
            facetAddress: address(proofManagementFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: getProofManagementSelectors()
        });
        
        cut[6] = IDiamondCut.FacetCut({
            facetAddress: address(paymentManagementFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: getPaymentManagementSelectors()
        });
        
        cut[7] = IDiamondCut.FacetCut({
            facetAddress: address(disputeManagementFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: getDisputeManagementSelectors()
        });
        
        // Initialize diamond
        bytes memory initData = abi.encodeWithSelector(
            AdsBazaarInit.init.selector,
            deployer,
            cUSD,
            5, // 0.5% platform fee
            identityHub,
            scope,
            attestationIds
        );
        
        // Execute diamond cut
        IDiamondCut(address(diamond)).diamondCut(cut, address(adsBazaarInit), initData);
        
        vm.stopBroadcast();
        
        console.log("\n=== DEPLOYMENT COMPLETE ===");
        console.log("Diamond Address:", address(diamond));
        console.log("Use this address in your frontend!");
    }
    
    function getLoupeSelectors() internal pure returns (bytes4[] memory selectors) {
        selectors = new bytes4[](4);
        selectors[0] = DiamondLoupeFacet.facets.selector;
        selectors[1] = DiamondLoupeFacet.facetFunctionSelectors.selector;
        selectors[2] = DiamondLoupeFacet.facetAddresses.selector;
        selectors[3] = DiamondLoupeFacet.facetAddress.selector;
    }
    
    function getOwnershipSelectors() internal pure returns (bytes4[] memory selectors) {
        selectors = new bytes4[](2);
        selectors[0] = OwnershipFacet.transferOwnership.selector;
        selectors[1] = OwnershipFacet.owner.selector;
    }
    
    function getUserManagementSelectors() internal pure returns (bytes4[] memory selectors) {
        selectors = new bytes4[](4);
        selectors[0] = UserManagementFacet.registerUser.selector;
        selectors[1] = UserManagementFacet.updateInfluencerProfile.selector;
        selectors[2] = UserManagementFacet.updateInfluencerStatus.selector;
        selectors[3] = UserManagementFacet.setPlatformFee.selector;
    }
    
    function getCampaignManagementSelectors() internal pure returns (bytes4[] memory selectors) {
        selectors = new bytes4[](4);
        selectors[0] = CampaignManagementFacet.createAdBrief.selector;
        selectors[1] = CampaignManagementFacet.cancelAdBrief.selector;
        selectors[2] = CampaignManagementFacet.expireCampaign.selector;
        selectors[3] = CampaignManagementFacet.completeCampaign.selector;
    }
    
    function getApplicationManagementSelectors() internal pure returns (bytes4[] memory selectors) {
        selectors = new bytes4[](3);
        selectors[0] = ApplicationManagementFacet.applyToBrief.selector;
        selectors[1] = ApplicationManagementFacet.selectInfluencer.selector;
        selectors[2] = ApplicationManagementFacet.hasInfluencerApplied.selector;
    }
    
    function getProofManagementSelectors() internal pure returns (bytes4[] memory selectors) {
        selectors = new bytes4[](2);
        selectors[0] = ProofManagementFacet.submitProof.selector;
        selectors[1] = ProofManagementFacet.triggerAutoApproval.selector;
    }
    
    function getPaymentManagementSelectors() internal pure returns (bytes4[] memory selectors) {
        selectors = new bytes4[](3);
        selectors[0] = PaymentManagementFacet.claimPayments.selector;
        selectors[1] = PaymentManagementFacet.getPendingPayments.selector;
        selectors[2] = PaymentManagementFacet.getTotalPendingAmount.selector;
    }
    
    function getDisputeManagementSelectors() internal pure returns (bytes4[] memory selectors) {
        selectors = new bytes4[](8);
        selectors[0] = DisputeManagementFacet.addDisputeResolver.selector;
        selectors[1] = DisputeManagementFacet.removeDisputeResolver.selector;
        selectors[2] = DisputeManagementFacet.flagSubmission.selector;
        selectors[3] = DisputeManagementFacet.resolveDispute.selector;
        selectors[4] = DisputeManagementFacet.expireDispute.selector;
        selectors[5] = DisputeManagementFacet.getDisputeResolvers.selector;
        selectors[6] = DisputeManagementFacet.getApplicationDispute.selector;
        selectors[7] = DisputeManagementFacet.hasPendingDisputes.selector;
    }
}