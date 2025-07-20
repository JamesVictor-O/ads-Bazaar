// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

import "forge-std/Script.sol";
import "../contracts/AdsBazaarDiamond.sol";
import "../contracts/upgradeInitializers/AdsBazaarInit.sol";

// Core Diamond Facets
import "../contracts/facets/DiamondCutFacet.sol";
import "../contracts/facets/DiamondLoupeFacet.sol";
import "../contracts/facets/OwnershipFacet.sol";

// AdsBazaar Facets (simplified list)
import "../contracts/adsbazaar-facets/CampaignManagementFacet.sol";
import "../contracts/adsbazaar-facets/PaymentManagementFacet.sol";
import "../contracts/adsbazaar-facets/ApplicationManagementFacet.sol";
import "../contracts/adsbazaar-facets/UserManagementFacet.sol";
import "../contracts/adsbazaar-facets/GettersFacet.sol";

// NEW Multi-Currency Facets
import "../contracts/adsbazaar-facets/MultiCurrencyPaymentFacet.sol";
import "../contracts/adsbazaar-facets/MultiCurrencyCampaignFacet.sol";

// Diamond Libraries
import "../contracts/libraries/LibDiamond.sol";
import "../contracts/interfaces/IDiamondCut.sol";

contract DeployMinimalMultiCurrency is Script {
    // Mento Token Addresses on Celo
    address constant CUSD_MAINNET = 0x765DE816845861e75A25fCA122bb6898B8B1282a;
    address constant CUSD_ALFAJORES = 0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1;

    // Platform fee: 1% (100 basis points) - matching existing deployment
    uint256 constant PLATFORM_FEE_PERCENTAGE = 100;

    // Self Protocol configuration
    address constant IDENTITY_HUB_MAINNET = 0x5f62728946b9Eab7779Ef8DC8c8E6D65aDbb8AC2;
    address constant IDENTITY_HUB_ALFAJORES = 0x5f62728946b9Eab7779Ef8DC8c8E6D65aDbb8AC2;
    uint256 constant SCOPE = 123456789; // AdsBazaar scope
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying Minimal Multi-Currency AdsBazaar Diamond...");
        console.log("Deployer:", deployer);
        console.log("Chain ID:", block.chainid);

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy facets
        DiamondCutFacet diamondCutFacet = new DiamondCutFacet();
        DiamondLoupeFacet diamondLoupeFacet = new DiamondLoupeFacet();
        OwnershipFacet ownershipFacet = new OwnershipFacet();
        
        // Core AdsBazaar facets
        CampaignManagementFacet campaignFacet = new CampaignManagementFacet();
        PaymentManagementFacet paymentFacet = new PaymentManagementFacet();
        ApplicationManagementFacet applicationFacet = new ApplicationManagementFacet();
        UserManagementFacet userFacet = new UserManagementFacet();
        GettersFacet gettersFacet = new GettersFacet();
        
        // NEW Multi-Currency facets
        MultiCurrencyPaymentFacet multiPaymentFacet = new MultiCurrencyPaymentFacet();
        MultiCurrencyCampaignFacet multiCampaignFacet = new MultiCurrencyCampaignFacet();

        console.log("All facets deployed successfully");

        // 2. Create FacetCut array for diamond initialization
        IDiamondCut.FacetCut[] memory cuts = new IDiamondCut.FacetCut[](8);
        
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

        // Core AdsBazaar facets with minimal selectors
        cuts[2] = IDiamondCut.FacetCut({
            facetAddress: address(campaignFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: _getCampaignSelectors()
        });
        
        cuts[3] = IDiamondCut.FacetCut({
            facetAddress: address(paymentFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: _getPaymentSelectors()
        });
        
        cuts[4] = IDiamondCut.FacetCut({
            facetAddress: address(applicationFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: _getApplicationSelectors()
        });
        
        cuts[5] = IDiamondCut.FacetCut({
            facetAddress: address(userFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: _getUserSelectors()
        });
        
        cuts[6] = IDiamondCut.FacetCut({
            facetAddress: address(gettersFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: _getGettersSelectors()
        });

        // NEW Multi-Currency facet
        cuts[7] = IDiamondCut.FacetCut({
            facetAddress: address(multiPaymentFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: _getMultiPaymentSelectors()
        });

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

        // 6. Initialize multi-currency support
        MultiCurrencyPaymentFacet(address(diamond)).initializeMultiCurrency();
        
        console.log("Multi-currency support initialized");

        // 7. Add MultiCurrencyCampaignFacet
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

        console.log("=================================");
        console.log("DEPLOYMENT COMPLETE!");
        console.log("Diamond Address:", address(diamond));
        console.log("Chain ID:", block.chainid);
        console.log("Owner:", deployer);
        console.log("cUSD Address:", cUSDAddress);
        console.log("Platform Fee:", PLATFORM_FEE_PERCENTAGE, "basis points (1%)");
        console.log("=================================");

        vm.stopBroadcast();
    }

    // Minimal function selectors
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

    function _getCampaignSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](1);
        selectors[0] = CampaignManagementFacet.createAdBrief.selector;
        return selectors;
    }

    function _getPaymentSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](1);
        selectors[0] = PaymentManagementFacet.claimPayments.selector;
        return selectors;
    }

    function _getApplicationSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](1);
        selectors[0] = ApplicationManagementFacet.applyToBrief.selector;
        return selectors;
    }

    function _getUserSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](1);
        selectors[0] = UserManagementFacet.registerUser.selector;
        return selectors;
    }

    function _getGettersSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](2);
        selectors[0] = GettersFacet.getAdBrief.selector;
        selectors[1] = GettersFacet.getAllBriefs.selector;
        return selectors;
    }

    function _getMultiPaymentSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](3);
        selectors[0] = MultiCurrencyPaymentFacet.initializeMultiCurrency.selector;
        selectors[1] = MultiCurrencyPaymentFacet.claimPaymentsInToken.selector;
        selectors[2] = MultiCurrencyPaymentFacet.getAllPendingPayments.selector;
        return selectors;
    }

    function _getMultiCampaignSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](2);
        selectors[0] = MultiCurrencyCampaignFacet.createAdBriefWithToken.selector;
        selectors[1] = MultiCurrencyCampaignFacet.getCampaignTokenInfo.selector;
        return selectors;
    }
}