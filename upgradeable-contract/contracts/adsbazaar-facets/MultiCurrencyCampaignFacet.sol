// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

import {LibAdsBazaar} from "../libraries/LibAdsBazaar.sol";
import {LibMultiCurrencyAdsBazaar} from "../libraries/LibMultiCurrencyAdsBazaar.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract MultiCurrencyCampaignFacet {
    using LibAdsBazaar for LibAdsBazaar.AdsBazaarStorage;
    using LibMultiCurrencyAdsBazaar for LibMultiCurrencyAdsBazaar.MultiCurrencyStorage;

    // Create campaign with specific token
    function createAdBriefWithToken(
        string calldata _name,
        string calldata _description,
        string calldata _requirements,
        uint256 _budget,
        uint256 _promotionDuration,
        uint256 _maxInfluencers,
        uint8 _targetAudience,
        uint256 _applicationPeriod,
        uint256 _proofSubmissionGracePeriod,
        uint256 _verificationPeriod,
        uint256 _selectionGracePeriod,
        address _paymentToken
    ) external returns (bytes32) {
        LibAdsBazaar.AdsBazaarStorage storage ds = LibAdsBazaar.adsBazaarStorage();
        LibMultiCurrencyAdsBazaar.MultiCurrencyStorage storage mcs = LibMultiCurrencyAdsBazaar.multiCurrencyStorage();
        
        require(ds.users[msg.sender].isBusiness, "Not registered as business");
        require(_budget > 0, "Budget must be greater than 0");
        require(_promotionDuration >= 1 days, "Promotion duration must be at least 1 day");
        require(_maxInfluencers > 0, "Max influencers must be greater than 0");
        require(_maxInfluencers <= 10, "Cannot select more than 10 influencers");
        require(_targetAudience < uint8(type(LibAdsBazaar.TargetAudience).max), "Invalid target audience");
        require(_applicationPeriod >= 1 days && _applicationPeriod <= LibAdsBazaar.MAX_APPLICATION_PERIOD, "Application period must be between 1 day and 14 days");
        require(_proofSubmissionGracePeriod >= 1 days && _proofSubmissionGracePeriod <= LibAdsBazaar.MAX_PROOF_GRACE_PERIOD, "Proof submission grace period must be between 1 day and 2 days");
        require(_verificationPeriod >= 1 days && _verificationPeriod <= LibAdsBazaar.MAX_VERIFICATION_PERIOD, "Verification period must be between 1 day and 5 days");
        require(_selectionGracePeriod >= 1 hours && _selectionGracePeriod <= LibAdsBazaar.MAX_SELECTION_GRACE_PERIOD, "Selection grace period must be between 1 hour and 2 days");
        
        // Validate token is supported
        LibMultiCurrencyAdsBazaar.enforceTokenSupported(_paymentToken);
        
        // Transfer tokens from business to contract
        require(IERC20(_paymentToken).transferFrom(msg.sender, address(this), _budget), "Token transfer failed");

        // Update business's total escrowed amount and status
        ds.users[msg.sender].totalEscrowed += _budget;
        LibAdsBazaar.updateBusinessStatus(msg.sender);
        
        // Update total escrow amount (legacy)
        ds.totalEscrowAmount += _budget;
        
        // Update escrow by token
        mcs.totalEscrowByToken[_paymentToken] += _budget;
        
        bytes32 briefId = keccak256(
            abi.encodePacked(
                msg.sender,
                _name,
                _description,
                _requirements,
                _budget,
                _promotionDuration,
                _maxInfluencers,
                _targetAudience,
                _paymentToken, // Include token in briefId generation
                block.timestamp
            )
        );
        
        require(ds.briefs[briefId].business == address(0), "Brief already exists");
        
        uint256 selectionDeadline = block.timestamp + _applicationPeriod + _selectionGracePeriod;
        
        ds.briefs[briefId] = LibAdsBazaar.AdBrief({
            briefId: briefId,
            business: msg.sender,
            name: _name,
            description: _description,
            requirements: _requirements,
            budget: _budget,
            status: LibAdsBazaar.CampaignStatus.OPEN,
            promotionDuration: _promotionDuration,
            promotionStartTime: 0,
            promotionEndTime: 0,
            proofSubmissionDeadline: 0,
            verificationDeadline: 0,
            maxInfluencers: _maxInfluencers,
            selectedInfluencersCount: 0,
            targetAudience: LibAdsBazaar.TargetAudience(_targetAudience),
            creationTime: block.timestamp,
            selectionDeadline: selectionDeadline,
            applicationPeriod: _applicationPeriod,
            proofSubmissionGracePeriod: _proofSubmissionGracePeriod,
            verificationPeriod: _verificationPeriod,
            selectionGracePeriod: _selectionGracePeriod
        });
        
        // Store token and currency info for this campaign
        mcs.campaignTokens[briefId] = _paymentToken;
        mcs.campaignCurrencies[briefId] = LibMultiCurrencyAdsBazaar.getCurrencyFromAddress(_paymentToken);
        
        ds.allBriefIds.push(briefId);
        ds.businessBriefs[msg.sender].push(briefId);
        
        emit LibAdsBazaar.BriefCreated(briefId, msg.sender, _budget, _maxInfluencers, LibAdsBazaar.TargetAudience(_targetAudience), selectionDeadline);
        emit LibMultiCurrencyAdsBazaar.CampaignCreatedWithToken(briefId, msg.sender, _paymentToken, _budget);
        
        return briefId;
    }

    // Create campaign with preferred token or cUSD by default
    function createAdBriefWithPreferredToken(
        string calldata _name,
        string calldata _description,
        string calldata _requirements,
        uint256 _budget,
        uint256 _promotionDuration,
        uint256 _maxInfluencers,
        uint8 _targetAudience,
        uint256 _applicationPeriod,
        uint256 _proofSubmissionGracePeriod,
        uint256 _verificationPeriod,
        uint256 _selectionGracePeriod
    ) external returns (bytes32) {
        LibMultiCurrencyAdsBazaar.MultiCurrencyStorage storage mcs = LibMultiCurrencyAdsBazaar.multiCurrencyStorage();
        
        address preferredToken = mcs.businessPreferredToken[msg.sender];
        if (preferredToken == address(0)) {
            preferredToken = LibMultiCurrencyAdsBazaar.CUSD_ADDRESS; // Default to cUSD
        }
        
        return this.createAdBriefWithToken(
            _name,
            _description,
            _requirements,
            _budget,
            _promotionDuration,
            _maxInfluencers,
            _targetAudience,
            _applicationPeriod,
            _proofSubmissionGracePeriod,
            _verificationPeriod,
            _selectionGracePeriod,
            preferredToken
        );
    }

    // Cancel campaign with token-specific refund
    function cancelAdBriefWithToken(bytes32 _briefId) external {
        LibAdsBazaar.AdsBazaarStorage storage ds = LibAdsBazaar.adsBazaarStorage();
        LibMultiCurrencyAdsBazaar.MultiCurrencyStorage storage mcs = LibMultiCurrencyAdsBazaar.multiCurrencyStorage();
        
        LibAdsBazaar.enforceBriefExists(_briefId);
        require(ds.briefs[_briefId].business == msg.sender, "Not authorized");
        require(ds.briefs[_briefId].status == LibAdsBazaar.CampaignStatus.OPEN, "Cannot cancel non-open campaign");
        
        LibAdsBazaar.AdBrief storage brief = ds.briefs[_briefId];
        brief.status = LibAdsBazaar.CampaignStatus.CANCELLED;
        
        // Get the token used for this campaign
        address campaignToken = mcs.campaignTokens[_briefId];
        require(campaignToken != address(0), "Campaign token not found");
        
        uint256 refundAmount = brief.budget;
        
        // Update escrow amounts
        ds.totalEscrowAmount -= refundAmount;
        mcs.totalEscrowByToken[campaignToken] -= refundAmount;
        
        // Refund in the original token
        require(IERC20(campaignToken).transfer(msg.sender, refundAmount), "Refund failed");
        
        emit LibAdsBazaar.BriefCancelled(_briefId);
        emit LibAdsBazaar.BudgetRefunded(_briefId, msg.sender, refundAmount);
    }

    // Cancel campaign with compensation to selected influencers
    function cancelCampaignWithCompensation(bytes32 _briefId, uint256 _compensationPerInfluencer) external {
        LibAdsBazaar.AdsBazaarStorage storage ds = LibAdsBazaar.adsBazaarStorage();
        LibMultiCurrencyAdsBazaar.MultiCurrencyStorage storage mcs = LibMultiCurrencyAdsBazaar.multiCurrencyStorage();
        
        LibAdsBazaar.enforceBriefExists(_briefId);
        require(ds.briefs[_briefId].business == msg.sender, "Not authorized");
        require(ds.briefs[_briefId].status == LibAdsBazaar.CampaignStatus.OPEN, "Cannot cancel non-open campaign");
        require(ds.briefs[_briefId].selectedInfluencersCount > 0, "No influencers selected");
        require(_compensationPerInfluencer > 0, "Compensation must be greater than 0");
        
        LibAdsBazaar.AdBrief storage brief = ds.briefs[_briefId];
        
        // Get the token used for this campaign
        address campaignToken = mcs.campaignTokens[_briefId];
        require(campaignToken != address(0), "Campaign token not found");
        
        uint256 totalCompensation = _compensationPerInfluencer * brief.selectedInfluencersCount;
        require(totalCompensation <= brief.budget, "Compensation exceeds campaign budget");
        
        // Update campaign status
        brief.status = LibAdsBazaar.CampaignStatus.CANCELLED;
        
        // Find and compensate selected influencers
        LibAdsBazaar.InfluencerApplication[] storage applications = ds.applications[_briefId];
        uint256 compensatedCount = 0;
        
        for (uint256 i = 0; i < applications.length; i++) {
            if (applications[i].isSelected && compensatedCount < brief.selectedInfluencersCount) {
                address influencer = applications[i].influencer;
                
                // Add compensation to influencer's pending payments in campaign token
                mcs.influencerPaymentsByToken[influencer][campaignToken].push(
                    LibAdsBazaar.PendingPayment({
                        briefId: _briefId,
                        amount: _compensationPerInfluencer,
                        isApproved: true
                    })
                );
                
                mcs.influencerPendingByToken[influencer][campaignToken] += _compensationPerInfluencer;
                
                emit LibAdsBazaar.CompensationPaid(_briefId, influencer, _compensationPerInfluencer);
                compensatedCount++;
            }
        }
        
        // Calculate refund amount (remaining budget after compensation)
        uint256 refundAmount = brief.budget - totalCompensation;
        
        // Update escrow amounts
        ds.totalEscrowAmount -= brief.budget;
        mcs.totalEscrowByToken[campaignToken] -= brief.budget;
        
        // Refund remaining amount to business in original token
        if (refundAmount > 0) {
            require(IERC20(campaignToken).transfer(msg.sender, refundAmount), "Refund failed");
        }
        
        emit LibAdsBazaar.BriefCancelled(_briefId);
        emit LibAdsBazaar.BudgetRefunded(_briefId, msg.sender, refundAmount);
        emit LibMultiCurrencyAdsBazaar.CampaignCancelledWithCompensation(_briefId, totalCompensation, compensatedCount);
    }

    // Release payment to influencer in campaign's token
    function releasePaymentInCampaignToken(bytes32 _briefId, address _influencer) external {
        LibAdsBazaar.AdsBazaarStorage storage ds = LibAdsBazaar.adsBazaarStorage();
        LibMultiCurrencyAdsBazaar.MultiCurrencyStorage storage mcs = LibMultiCurrencyAdsBazaar.multiCurrencyStorage();
        
        LibAdsBazaar.enforceBriefExists(_briefId);
        require(ds.briefs[_briefId].business == msg.sender, "Not authorized");
        
        // Find the influencer application
        LibAdsBazaar.InfluencerApplication[] storage applications = ds.applications[_briefId];
        bool found = false;
        uint256 appIndex;
        
        for (uint256 i = 0; i < applications.length; i++) {
            if (applications[i].influencer == _influencer && applications[i].isSelected) {
                found = true;
                appIndex = i;
                break;
            }
        }
        
        require(found, "Influencer not selected for this campaign");
        require(!applications[appIndex].hasClaimed, "Payment already claimed");
        require(applications[appIndex].isApproved, "Proof not approved");
        
        // Get campaign token
        address campaignToken = mcs.campaignTokens[_briefId];
        require(campaignToken != address(0), "Campaign token not found");
        
        LibAdsBazaar.AdBrief storage brief = ds.briefs[_briefId];
        uint256 paymentAmount = brief.budget / brief.maxInfluencers;
        
        // Add to influencer's pending payments in the campaign token
        mcs.influencerPaymentsByToken[_influencer][campaignToken].push(
            LibAdsBazaar.PendingPayment({
                briefId: _briefId,
                amount: paymentAmount,
                isApproved: true
            })
        );
        
        mcs.influencerPendingByToken[_influencer][campaignToken] += paymentAmount;
        
        // Update volume tracking
        mcs.totalVolumeByToken[campaignToken] += paymentAmount;
        
        // Update influencer stats
        ds.users[_influencer].completedCampaigns++;
        LibAdsBazaar.updateInfluencerStatus(_influencer);
        
        emit LibAdsBazaar.PaymentReleased(_briefId, _influencer, paymentAmount);
    }

    // Get campaign token information
    function getCampaignTokenInfo(bytes32 _briefId) external view returns (
        LibMultiCurrencyAdsBazaar.CampaignTokenInfo memory
    ) {
        LibMultiCurrencyAdsBazaar.MultiCurrencyStorage storage mcs = LibMultiCurrencyAdsBazaar.multiCurrencyStorage();
        
        address tokenAddress = mcs.campaignTokens[_briefId];
        require(tokenAddress != address(0), "Campaign not found or no token set");
        
        LibMultiCurrencyAdsBazaar.SupportedCurrency currency = mcs.campaignCurrencies[_briefId];
        string memory symbol = LibMultiCurrencyAdsBazaar.getCurrencySymbol(currency);
        
        return LibMultiCurrencyAdsBazaar.CampaignTokenInfo({
            tokenAddress: tokenAddress,
            symbol: symbol,
            currency: uint8(currency)
        });
    }

    // Get campaigns by token
    function getCampaignsByToken(address tokenAddress) external view returns (bytes32[] memory campaignIds) {
        LibAdsBazaar.AdsBazaarStorage storage ds = LibAdsBazaar.adsBazaarStorage();
        LibMultiCurrencyAdsBazaar.MultiCurrencyStorage storage mcs = LibMultiCurrencyAdsBazaar.multiCurrencyStorage();
        
        bytes32[] memory allBriefs = ds.allBriefIds;
        uint256 count = 0;
        
        // First pass: count campaigns with this token
        for (uint256 i = 0; i < allBriefs.length; i++) {
            if (mcs.campaignTokens[allBriefs[i]] == tokenAddress) {
                count++;
            }
        }
        
        campaignIds = new bytes32[](count);
        uint256 index = 0;
        
        // Second pass: populate array
        for (uint256 i = 0; i < allBriefs.length; i++) {
            if (mcs.campaignTokens[allBriefs[i]] == tokenAddress) {
                campaignIds[index] = allBriefs[i];
                index++;
            }
        }
        
        return campaignIds;
    }

    // Get campaign statistics by currency
    function getCampaignStatsByCurrency() external view returns (
        LibMultiCurrencyAdsBazaar.MultiCurrencyStats memory
    ) {
        (address[] memory supportedTokens, LibMultiCurrencyAdsBazaar.SupportedCurrency[] memory currencies) = 
            LibMultiCurrencyAdsBazaar.getAllSupportedTokens();
        
        LibAdsBazaar.AdsBazaarStorage storage ds = LibAdsBazaar.adsBazaarStorage();
        LibMultiCurrencyAdsBazaar.MultiCurrencyStorage storage mcs = LibMultiCurrencyAdsBazaar.multiCurrencyStorage();
        
        string[] memory symbols = new string[](supportedTokens.length);
        uint256[] memory campaignCounts = new uint256[](supportedTokens.length);
        uint256[] memory totalBudgets = new uint256[](supportedTokens.length);
        uint256[] memory totalVolumes = new uint256[](supportedTokens.length);
        
        // Count campaigns and sum budgets for each token
        bytes32[] memory allBriefs = ds.allBriefIds;
        for (uint256 i = 0; i < allBriefs.length; i++) {
            address campaignToken = mcs.campaignTokens[allBriefs[i]];
            if (campaignToken != address(0)) {
                for (uint256 j = 0; j < supportedTokens.length; j++) {
                    if (supportedTokens[j] == campaignToken) {
                        campaignCounts[j]++;
                        totalBudgets[j] += ds.briefs[allBriefs[i]].budget;
                        break;
                    }
                }
            }
        }
        
        // Get symbols and volumes
        for (uint256 i = 0; i < supportedTokens.length; i++) {
            symbols[i] = LibMultiCurrencyAdsBazaar.getCurrencySymbol(currencies[i]);
            totalVolumes[i] = mcs.totalVolumeByToken[supportedTokens[i]];
        }
        
        return LibMultiCurrencyAdsBazaar.MultiCurrencyStats({
            tokens: supportedTokens,
            symbols: symbols,
            campaignCounts: campaignCounts,
            totalBudgets: totalBudgets,
            totalVolumes: totalVolumes
        });
    }

    // Legacy support: create campaign with cUSD (backward compatibility)
    function createAdBrief(
        string calldata _name,
        string calldata _description,
        string calldata _requirements,
        uint256 _budget,
        uint256 _promotionDuration,
        uint256 _maxInfluencers,
        uint8 _targetAudience,
        uint256 _applicationPeriod,
        uint256 _proofSubmissionGracePeriod,
        uint256 _verificationPeriod,
        uint256 _selectionGracePeriod
    ) external returns (bytes32) {
        return this.createAdBriefWithToken(
            _name,
            _description,
            _requirements,
            _budget,
            _promotionDuration,
            _maxInfluencers,
            _targetAudience,
            _applicationPeriod,
            _proofSubmissionGracePeriod,
            _verificationPeriod,
            _selectionGracePeriod,
            LibMultiCurrencyAdsBazaar.CUSD_ADDRESS
        );
    }
}