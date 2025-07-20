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
import "../contracts/adsbazaar-facets/PaymentManagementFacet.sol";
import "../contracts/adsbazaar-facets/ProofManagementFacet.sol";
import "../contracts/adsbazaar-facets/SelfVerificationFacet.sol";
import "../contracts/adsbazaar-facets/UserManagementFacet.sol";

// NEW Multi-Currency Facets
import "../contracts/adsbazaar-facets/MultiCurrencyPaymentFacet.sol";
import "../contracts/adsbazaar-facets/MultiCurrencyCampaignFacet.sol";

// Diamond Libraries
import "../contracts/libraries/LibDiamond.sol";
import "../contracts/libraries/LibAdsBazaar.sol";
import "../contracts/libraries/LibMultiCurrencyAdsBazaar.sol";

contract DeployMultiCurrencyDiamond is Script {
    // Mento Token Addresses on Celo
    address constant CUSD_MAINNET = 0x765DE816845861e75A25fCA122bb6898B8B1282a;
    address constant CEUR_MAINNET = 0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73;
    address constant CREAL_MAINNET = 0xe8537a3d056DA446677B9E9d6c5dB704EaAb4787;
    address constant CKES_MAINNET = 0x456a3D042C0DbD3db53D5489e98dFb038553B0d0;
    address constant EXOF_MAINNET = 0x73F93dcc49cB8A239e2032663e9475dd5ef29A08;
    address constant CNGN_MAINNET = 0x17700282592D6917F6A73D0bF8AcCf4D578c131e;

    address constant CUSD_ALFAJORES = 0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1;
    address constant CEUR_ALFAJORES = 0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F;
    address constant CREAL_ALFAJORES = 0xE4D517785D091D3c54818832dB6094bcc2744545;

    // Platform fee: 1% (100 basis points) - matching existing deployment
    uint256 constant PLATFORM_FEE_PERCENTAGE = 100;

    // Self Protocol configuration
    address constant IDENTITY_HUB_MAINNET = 0x5f62728946b9Eab7779Ef8DC8c8E6D65aDbb8AC2;
    address constant IDENTITY_HUB_ALFAJORES = 0x5f62728946b9Eab7779Ef8DC8c8E6D65aDbb8AC2;
    uint256 constant SCOPE = 123456789; // AdsBazaar scope
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying Multi-Currency AdsBazaar Diamond...");
        console.log("Deployer:", deployer);
        console.log("Chain ID:", block.chainid);

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
        PaymentManagementFacet paymentFacet = new PaymentManagementFacet();
        ProofManagementFacet proofFacet = new ProofManagementFacet();
        SelfVerificationFacet selfVerificationFacet = new SelfVerificationFacet();
        UserManagementFacet userFacet = new UserManagementFacet();
        
        // NEW Multi-Currency facets
        MultiCurrencyPaymentFacet multiPaymentFacet = new MultiCurrencyPaymentFacet();
        MultiCurrencyCampaignFacet multiCampaignFacet = new MultiCurrencyCampaignFacet();

        console.log("All facets deployed successfully");

        // 2. Create FacetCut array for diamond initialization
        IDiamondCut.FacetCut[] memory cuts = new IDiamondCut.FacetCut[](11);
        
        // Diamond core facets (skip DiamondCutFacet as it's already included)        
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
            facetAddress: address(paymentFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: _getPaymentSelectors()
        });
        
        cuts[7] = IDiamondCut.FacetCut({
            facetAddress: address(proofFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: _getProofSelectors()
        });
        
        cuts[8] = IDiamondCut.FacetCut({
            facetAddress: address(selfVerificationFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: _getSelfVerificationSelectors()
        });
        
        cuts[9] = IDiamondCut.FacetCut({
            facetAddress: address(userFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: _getUserSelectors()
        });

        // NEW Multi-Currency facets
        cuts[10] = IDiamondCut.FacetCut({
            facetAddress: address(multiPaymentFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: _getMultiPaymentSelectors()
        });

        // Note: We'll add MultiCurrencyCampaignFacet in a separate upgrade to avoid selector conflicts

        // 3. Deploy the diamond
        address cUSDAddress = block.chainid == 42220 ? CUSD_MAINNET : CUSD_ALFAJORES;
        address identityHub = block.chainid == 42220 ? IDENTITY_HUB_MAINNET : IDENTITY_HUB_ALFAJORES;
        
        // Initialize attestation IDs array (empty for now)
        uint256[] memory attestationIds = new uint256[](0);
        
        AdsBazaarDiamond diamond = new AdsBazaarDiamond(
            deployer, // Contract owner
            address(diamondCutFacet)
        );

        console.log("Multi-Currency AdsBazaar Diamond deployed at:", address(diamond));

        // 4. Add all facets to the diamond
        IDiamondCut(address(diamond)).diamondCut(
            cuts,
            address(0),
            ""
        );

        // 5. Initialize the diamond with AdsBazaar-specific settings
        AdsBazaarInit initializer = new AdsBazaarInit();
        
        // Prepare initialization data
        bytes memory initData = abi.encodeWithSelector(
            AdsBazaarInit.init.selector,
            deployer,                       // Contract owner
            cUSDAddress,                    // cUSD token address
            PLATFORM_FEE_PERCENTAGE,       // Platform fee (1%)
            identityHub,                    // Identity verification hub
            SCOPE,                          // AdsBazaar scope
            attestationIds                  // Attestation IDs
        );

        // Initialize the diamond
        IDiamondCut(address(diamond)).diamondCut(
            new IDiamondCut.FacetCut[](0), // No cuts, just initialization
            address(initializer),
            initData
        );

        console.log("Diamond initialized successfully");

        // 5. Initialize multi-currency support
        MultiCurrencyPaymentFacet(address(diamond)).initializeMultiCurrency();
        
        console.log("Multi-currency support initialized");
        console.log("=================================");
        console.log("DEPLOYMENT SUMMARY:");
        console.log("Diamond Address:", address(diamond));
        console.log("Chain ID:", block.chainid);
        console.log("Owner:", deployer);
        console.log("cUSD Address:", cUSDAddress);
        console.log("Platform Fee:", PLATFORM_FEE_PERCENTAGE, "basis points (1%)");
        console.log("=================================");
        
        // 6. Deploy MultiCurrencyCampaignFacet as separate upgrade
        console.log("Adding Multi-Currency Campaign Facet...");
        
        IDiamondCut.FacetCut[] memory campaignCuts = new IDiamondCut.FacetCut[](1);
        campaignCuts[0] = IDiamondCut.FacetCut({
            facetAddress: address(multiCampaignFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: _getMultiCampaignSelectors()
        });

        IDiamondCut(address(diamond)).diamondCut(
            campaignCuts,
            address(0),
            ""
        );

        console.log("Multi-Currency Campaign Facet added successfully");
        console.log("=================================");
        console.log("FINAL DEPLOYMENT:");
        console.log("Multi-Currency AdsBazaar Diamond:", address(diamond));
        console.log("All facets deployed and configured");
        console.log("Ready for multi-currency campaigns!");
        console.log("=================================");

        vm.stopBroadcast();
    }

    // Function selector generation helpers
    function _getDiamondCutSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](1);
        selectors[0] = DiamondCutFacet.diamondCut.selector;
        return selectors;
    }

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

    // AdsBazaar facet selectors (simplified - in production, generate automatically)
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
        bytes4[] memory selectors = new bytes4[](15);
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
        return selectors;
    }

    function _getPaymentSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](3);
        selectors[0] = PaymentManagementFacet.claimPayments.selector;
        selectors[1] = PaymentManagementFacet.getPendingPayments.selector;
        selectors[2] = PaymentManagementFacet.getTotalPendingAmount.selector;
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

    // NEW Multi-Currency facet selectors
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