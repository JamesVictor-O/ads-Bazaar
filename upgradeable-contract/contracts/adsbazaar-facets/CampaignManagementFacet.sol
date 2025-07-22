// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

// Legacy CampaignManagementFacet replaced by MultiCurrencyCampaignFacet
// All campaign management functions now support multi-currency operations
// This file is kept for backward compatibility but contains no active functions

// TO USE CAMPAIGN FUNCTIONS:
// - Use createAdBriefWithToken() instead of createAdBrief()
// - Use cancelAdBriefWithToken() instead of cancelAdBrief() 
// - Use expireCampaignWithToken() instead of expireCampaign()
// - Use completeCampaignWithToken() instead of completeCampaign()
// - All functions in MultiCurrencyCampaignFacet support cUSD and other currencies

contract CampaignManagementFacet {
    // This contract is deprecated - use MultiCurrencyCampaignFacet instead
    // All legacy functions have been removed to eliminate complexity
    // The multi-currency functions handle cUSD as well as other supported tokens
}