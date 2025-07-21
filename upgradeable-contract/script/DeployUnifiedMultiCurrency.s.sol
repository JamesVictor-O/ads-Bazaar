// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

import "forge-std/Script.sol";
import "../contracts/AdsBazaarDiamond.sol";
import "../contracts/upgradeInitializers/AdsBazaarInit.sol";

// Core Diamond Facets
import "../contracts/facets/DiamondCutFacet.sol";
import "../contracts/facets/DiamondLoupeFacet.sol";
import "../contracts/facets/OwnershipFacet.sol";

// AdsBazaar Facets
import "../contracts/adsbazaar-facets/ApplicationManagementFacet.sol";
import "../contracts/adsbazaar-facets/CampaignManagementFacet.sol";
import "../contracts/adsbazaar-facets/DisputeManagementFacet.sol";
import "../contracts/adsbazaar-facets/GettersFacet.sol";
import "../contracts/adsbazaar-facets/ProofManagementFacet.sol";
import "../contracts/adsbazaar-facets/SelfVerificationFacet.sol";
import "../contracts/adsbazaar-facets/UserManagementFacet.sol";

// Multi-Currency Facets (primary)
import "../contracts/adsbazaar-facets/MultiCurrencyPaymentFacet.sol";
import "../contracts/adsbazaar-facets/MultiCurrencyCampaignFacet.sol";

// Diamond Libraries
import "../contracts/libraries/LibDiamond.sol";
import "../contracts/libraries/LibAdsBazaar.sol";
import "../contracts/libraries/LibMultiCurrencyAdsBazaar.sol";

contract DeployUnifiedMultiCurrency is Script {
    // Platform fee: 1% (100 basis points)
    uint256 constant PLATFORM_FEE_PERCENTAGE = 100;

    // Self Protocol configuration
    address constant IDENTITY_HUB_MAINNET = 0x5f62728946b9Eab7779Ef8DC8c8E6D65aDbb8AC2;
    address constant IDENTITY_HUB_ALFAJORES = 0x5f62728946b9Eab7779Ef8DC8c8E6D65aDbb8AC2;
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        uint256 scope = vm.envUint("HASHED_SCOPE");
        
        console.log("Deploying Unified Multi-Currency AdsBazaar Diamond...");
        console.log("Deployer:", deployer);
        console.log("Chain ID:", block.chainid);
        console.log("Scope:", scope);

        // Determine identity hub based on network
        address identityHub = block.chainid == 42220 ? IDENTITY_HUB_MAINNET : IDENTITY_HUB_ALFAJORES;
        string memory networkName = block.chainid == 42220 ? "Celo Mainnet" : "Celo Alfajores";
        
        console.log("Network:", networkName);
        console.log("Identity Hub:", identityHub);

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy all facets
        DiamondCutFacet diamondCutFacet = new DiamondCutFacet();
        DiamondLoupeFacet diamondLoupeFacet = new DiamondLoupeFacet();
        OwnershipFacet ownershipFacet = new OwnershipFacet();
        
        // Core AdsBazaar facets
        ApplicationManagementFacet applicationFacet = new ApplicationManagementFacet();
        CampaignManagementFacet campaignFacet = new CampaignManagementFacet();
        DisputeManagementFacet disputeFacet = new DisputeManagementFacet();
        GettersFacet gettersFacet = new GettersFacet();
        ProofManagementFacet proofFacet = new ProofManagementFacet();
        SelfVerificationFacet selfVerificationFacet = new SelfVerificationFacet();
        UserManagementFacet userFacet = new UserManagementFacet();
        
        // Multi-Currency facets (primary payment system)
        MultiCurrencyPaymentFacet multiPaymentFacet = new MultiCurrencyPaymentFacet();
        MultiCurrencyCampaignFacet multiCampaignFacet = new MultiCurrencyCampaignFacet();

        console.log("All facets deployed successfully");

        // 2. Deploy the diamond
        AdsBazaarDiamond diamond = new AdsBazaarDiamond(
            deployer, // Contract owner
            address(diamondCutFacet)
        );

        console.log("Unified AdsBazaar Diamond deployed at:", address(diamond));

        // 3. Create FacetCut array for diamond initialization
        IDiamondCut.FacetCut[] memory cuts = new IDiamondCut.FacetCut[](11);
        
        // Diamond core facets        
        cuts[0] = IDiamondCut.FacetCut({
            facetAddress: address(diamondLoupeFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: _getDiamondLoupeSelectors()
        });
        
        cuts[1] = IDiamondCut.FacetCut({
            facetAddress: address(ownershipFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: _getOwnershipSelectors()
        });

        // AdsBazaar core facets
        cuts[2] = IDiamondCut.FacetCut({
            facetAddress: address(applicationFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: _getApplicationSelectors()
        });
        
        cuts[3] = IDiamondCut.FacetCut({
            facetAddress: address(campaignFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: _getCampaignSelectors()
        });
        
        cuts[4] = IDiamondCut.FacetCut({
            facetAddress: address(disputeFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: _getDisputeSelectors()
        });
        
        cuts[5] = IDiamondCut.FacetCut({
            facetAddress: address(gettersFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: _getGettersSelectors()
        });
        
        cuts[6] = IDiamondCut.FacetCut({
            facetAddress: address(proofFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: _getProofSelectors()
        });
        
        cuts[7] = IDiamondCut.FacetCut({
            facetAddress: address(selfVerificationFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: _getSelfVerificationSelectors()
        });
        
        cuts[8] = IDiamondCut.FacetCut({
            facetAddress: address(userFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: _getUserSelectors()
        });

        // Multi-Currency facets (primary system)
        cuts[9] = IDiamondCut.FacetCut({
            facetAddress: address(multiPaymentFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: _getMultiPaymentSelectors()
        });

        cuts[10] = IDiamondCut.FacetCut({
            facetAddress: address(multiCampaignFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: _getMultiCampaignSelectors()
        });

        // 4. Add all facets to the diamond
        IDiamondCut(address(diamond)).diamondCut(
            cuts,
            address(0),
            ""
        );

        // 5. Initialize the diamond with minimal legacy-compatible settings
        AdsBazaarInit initializer = new AdsBazaarInit();
        
        // Initialize attestation IDs array (empty for now)
        uint256[] memory attestationIds = new uint256[](0);
        
        // Use cUSD address for legacy compatibility, but multicurrency system is primary
        address legacyCUSD = block.chainid == 42220 
            ? 0x765DE816845861e75A25fCA122bb6898B8B1282a  // Mainnet cUSD
            : 0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1; // Alfajores cUSD
        
        // Prepare initialization data
        bytes memory initData = abi.encodeWithSelector(
            AdsBazaarInit.init.selector,
            deployer,                       // Contract owner
            legacyCUSD,                     // cUSD (for legacy compatibility only)
            PLATFORM_FEE_PERCENTAGE,       // Platform fee (1%)
            identityHub,                    // Identity verification hub
            scope,                          // AdsBazaar scope
            attestationIds                  // Attestation IDs
        );

        // Initialize the diamond
        IDiamondCut(address(diamond)).diamondCut(
            new IDiamondCut.FacetCut[](0), // No cuts, just initialization
            address(initializer),
            initData
        );

        console.log("Diamond initialized successfully");

        // 6. Initialize multi-currency support (this is the primary payment system)
        MultiCurrencyPaymentFacet(address(diamond)).initializeMultiCurrency();
        
        console.log("Multi-currency support initialized");
        console.log("=================================");
        console.log("UNIFIED DEPLOYMENT SUMMARY:");
        console.log("Diamond Address:", address(diamond));
        console.log("Network:", networkName);
        console.log("Chain ID:", block.chainid);
        console.log("Owner:", deployer);
        console.log("Platform Fee: 100 basis points (1%)");
        console.log("=================================");
        console.log("SUPPORTED CURRENCIES:");
        console.log("- cUSD (Primary)");
        console.log("- cEUR");
        console.log("- cREAL");
        console.log("- cKES");
        console.log("- eXOF");
        console.log("- cNGN");
        console.log("=================================");
        console.log("This is your SINGLE contract address for all currencies!");
        console.log("No more dual contract complexity.");
        console.log("=================================");

        vm.stopBroadcast();
    }

    // Function selector generation helpers
    function _getDiamondLoupeSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](4);
        selectors[0] = DiamondLoupeFacet.facets.selector;
        selectors[1] = DiamondLoupeFacet.facetFunctionSelectors.selector;
        selectors[2] = DiamondLoupeFacet.facetAddresses.selector;
        selectors[3] = DiamondLoupeFacet.facetAddress.selector;
        return selectors;
    }

    function _getOwnershipSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](2);
        selectors[0] = OwnershipFacet.transferOwnership.selector;
        selectors[1] = OwnershipFacet.owner.selector;
        return selectors;
    }

    function _getApplicationSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](3);
        selectors[0] = ApplicationManagementFacet.applyToBrief.selector;
        selectors[1] = ApplicationManagementFacet.selectInfluencer.selector;
        selectors[2] = ApplicationManagementFacet.hasInfluencerApplied.selector;
        return selectors;
    }

    function _getCampaignSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](3);
        selectors[0] = CampaignManagementFacet.createAdBrief.selector;
        selectors[1] = CampaignManagementFacet.cancelAdBrief.selector;
        selectors[2] = CampaignManagementFacet.completeCampaign.selector;
        return selectors;
    }

    function _getDisputeSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](4);
        selectors[0] = DisputeManagementFacet.flagSubmission.selector;
        selectors[1] = DisputeManagementFacet.resolveDispute.selector;
        selectors[2] = DisputeManagementFacet.addDisputeResolver.selector;
        selectors[3] = DisputeManagementFacet.removeDisputeResolver.selector;
        return selectors;
    }

    function _getGettersSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](19);
        selectors[0] = GettersFacet.getAdBrief.selector;
        selectors[1] = GettersFacet.getAllBriefs.selector;
        selectors[2] = GettersFacet.getBusinessBriefs.selector;
        selectors[3] = GettersFacet.getUsers.selector;
        selectors[4] = GettersFacet.getTotalUsers.selector;
        selectors[5] = GettersFacet.getTotalEscrowAmount.selector;
        selectors[6] = GettersFacet.getPlatformFeePercentage.selector;
        selectors[7] = GettersFacet.getOwner.selector;
        selectors[8] = GettersFacet.getCUSD.selector;
        selectors[9] = GettersFacet.getInfluencerApplications.selector;
        selectors[10] = GettersFacet.getBriefApplications.selector;
        selectors[11] = GettersFacet.getBusinessStats.selector;
        selectors[12] = GettersFacet.getInfluencerStats.selector;
        selectors[13] = GettersFacet.getUserByUsername.selector;
        selectors[14] = GettersFacet.isUsernameAvailable.selector;
        selectors[15] = GettersFacet.getTotalBusinesses.selector; // MISSING FUNCTION
        selectors[16] = GettersFacet.getTotalInfluencers.selector; // MISSING FUNCTION
        selectors[17] = GettersFacet.getUserUsername.selector; // MISSING FUNCTION
        selectors[18] = GettersFacet.isRegistered.selector; // MISSING FUNCTION
        return selectors;
    }

    function _getProofSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](2);
        selectors[0] = ProofManagementFacet.submitProof.selector;
        selectors[1] = ProofManagementFacet.triggerAutoApproval.selector;
        return selectors;
    }

    function _getSelfVerificationSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](3);
        selectors[0] = SelfVerificationFacet.verifySelfProof.selector;
        selectors[1] = SelfVerificationFacet.setVerificationConfig.selector;
        selectors[2] = SelfVerificationFacet.isInfluencerVerified.selector;
        return selectors;
    }

    function _getUserSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](3);
        selectors[0] = UserManagementFacet.registerUser.selector;
        selectors[1] = UserManagementFacet.updateInfluencerProfile.selector;
        selectors[2] = UserManagementFacet.setPlatformFee.selector;
        return selectors;
    }

    function _getMultiPaymentSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](8);
        selectors[0] = MultiCurrencyPaymentFacet.initializeMultiCurrency.selector;
        selectors[1] = MultiCurrencyPaymentFacet.claimPaymentsInToken.selector;
        selectors[2] = MultiCurrencyPaymentFacet.claimAllPendingPayments.selector;
        selectors[3] = MultiCurrencyPaymentFacet.getPendingPaymentsInToken.selector;
        selectors[4] = MultiCurrencyPaymentFacet.getTotalPendingAmountInToken.selector;
        selectors[5] = MultiCurrencyPaymentFacet.getAllPendingPayments.selector;
        selectors[6] = MultiCurrencyPaymentFacet.setPreferredPaymentToken.selector;
        selectors[7] = MultiCurrencyPaymentFacet.getPreferredPaymentToken.selector;
        return selectors;
    }

    function _getMultiCampaignSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](6);
        selectors[0] = MultiCurrencyCampaignFacet.createAdBriefWithToken.selector;
        selectors[1] = MultiCurrencyCampaignFacet.createAdBriefWithPreferredToken.selector;
        selectors[2] = MultiCurrencyCampaignFacet.cancelAdBriefWithToken.selector;
        selectors[3] = MultiCurrencyCampaignFacet.getCampaignTokenInfo.selector;
        selectors[4] = MultiCurrencyCampaignFacet.getCampaignsByToken.selector;
        selectors[5] = MultiCurrencyCampaignFacet.getCampaignStatsByCurrency.selector;
        return selectors;
    }
}