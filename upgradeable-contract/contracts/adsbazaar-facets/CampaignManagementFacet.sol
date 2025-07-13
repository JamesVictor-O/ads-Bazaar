// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

import {LibAdsBazaar} from "../libraries/LibAdsBazaar.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract CampaignManagementFacet {
    using LibAdsBazaar for LibAdsBazaar.AdsBazaarStorage;

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
    ) external {
        LibAdsBazaar.AdsBazaarStorage storage ds = LibAdsBazaar.adsBazaarStorage();
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
        
        // Transfer tokens from business to contract
        require(IERC20(ds.cUSD).transferFrom(msg.sender, address(this), _budget), "Token transfer failed");

        // Update business's total escrowed amount and status
        ds.users[msg.sender].totalEscrowed += _budget;
        LibAdsBazaar.updateBusinessStatus(msg.sender);
        
        // Update total escrow amount
        ds.totalEscrowAmount += _budget;
        
        bytes32 briefId = keccak256(
            abi.encodePacked(
                msg.sender,
                _name,
                _description,
                _requirements,
                _budget,
                _promotionDuration,
                block.timestamp
            )
        );
        
        // Calculate selection deadline based on configurable application period
        uint256 selectionDeadline = block.timestamp + _applicationPeriod;
        
        // Create brief
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
        
        // Add to business briefs
        ds.businessBriefs[msg.sender].push(briefId);
        ds.allBriefIds.push(briefId);
        
        emit LibAdsBazaar.BriefCreated(briefId, msg.sender, _budget, _maxInfluencers, LibAdsBazaar.TargetAudience(_targetAudience), selectionDeadline);
    }

    function cancelAdBrief(bytes32 _briefId) external {
        LibAdsBazaar.AdsBazaarStorage storage ds = LibAdsBazaar.adsBazaarStorage();
        require(ds.briefs[_briefId].business != address(0), "Brief does not exist");
        
        LibAdsBazaar.AdBrief storage brief = ds.briefs[_briefId];
        require(brief.business == msg.sender, "Not the brief owner");
        require(brief.status == LibAdsBazaar.CampaignStatus.OPEN, "Brief can only be cancelled if open");
        
        // Can cancel if no influencers have been selected yet
        require(brief.selectedInfluencersCount == 0, "Cannot cancel: influencers already selected");
        
        brief.status = LibAdsBazaar.CampaignStatus.CANCELLED;
        
        // Update business's total escrowed amount and status
        ds.users[msg.sender].totalEscrowed -= brief.budget;
        LibAdsBazaar.updateBusinessStatus(msg.sender);
        
        // Update total escrow amount
        ds.totalEscrowAmount -= brief.budget;
        
        // Refund the budget to business
        require(IERC20(ds.cUSD).transfer(brief.business, brief.budget), "Refund failed");
        
        emit LibAdsBazaar.BriefCancelled(_briefId);
    }

    function expireCampaign(bytes32 _briefId) external {
        LibAdsBazaar.AdsBazaarStorage storage ds = LibAdsBazaar.adsBazaarStorage();
        require(ds.briefs[_briefId].business != address(0), "Brief does not exist");
        
        LibAdsBazaar.AdBrief storage brief = ds.briefs[_briefId];
        require(brief.status == LibAdsBazaar.CampaignStatus.OPEN, "Campaign is not open");
        require(block.timestamp > brief.selectionDeadline + brief.selectionGracePeriod, "Grace period still active");
        
        brief.status = LibAdsBazaar.CampaignStatus.EXPIRED;
        
        // Update business's total escrowed amount and status
        ds.users[brief.business].totalEscrowed -= brief.budget;
        LibAdsBazaar.updateBusinessStatus(brief.business);
        
        // Update total escrow amount
        ds.totalEscrowAmount -= brief.budget;
        
        // Refund the budget to business
        require(IERC20(ds.cUSD).transfer(brief.business, brief.budget), "Refund failed");
        
        emit LibAdsBazaar.BriefExpired(_briefId);
        emit LibAdsBazaar.BudgetRefunded(_briefId, brief.business, brief.budget);
    }

    function startCampaignWithPartialSelection(bytes32 _briefId) external {
        LibAdsBazaar.AdsBazaarStorage storage ds = LibAdsBazaar.adsBazaarStorage();
        require(ds.briefs[_briefId].business != address(0), "Brief does not exist");
        
        LibAdsBazaar.AdBrief storage brief = ds.briefs[_briefId];
        require(brief.business == msg.sender, "Not the brief owner");
        require(brief.status == LibAdsBazaar.CampaignStatus.OPEN, "Brief not in open status");
        require(brief.selectedInfluencersCount > 0, "No influencers selected");
        require(brief.selectedInfluencersCount < brief.maxInfluencers, "All slots already filled");
        require(block.timestamp > brief.selectionDeadline, "Application period still active");
        require(block.timestamp <= brief.selectionDeadline + brief.selectionGracePeriod, "Grace period has ended");
        
        // Calculate unused budget and refund
        uint256 budgetPerInfluencer = brief.budget / brief.maxInfluencers;
        uint256 unselectedCount = brief.maxInfluencers - brief.selectedInfluencersCount;
        uint256 refundAmount = budgetPerInfluencer * unselectedCount;
        uint256 actualBudget = brief.budget - refundAmount;
        
        // Update brief
        brief.status = LibAdsBazaar.CampaignStatus.ASSIGNED;
        brief.budget = actualBudget;
        brief.maxInfluencers = brief.selectedInfluencersCount; // Update max to actual selected
        
        // Set campaign timing
        brief.promotionStartTime = block.timestamp;
        brief.promotionEndTime = brief.promotionStartTime + brief.promotionDuration;
        brief.proofSubmissionDeadline = brief.promotionEndTime + brief.proofSubmissionGracePeriod;
        brief.verificationDeadline = brief.proofSubmissionDeadline + brief.verificationPeriod;
        
        // Update business's total escrowed amount
        ds.users[msg.sender].totalEscrowed -= refundAmount;
        LibAdsBazaar.updateBusinessStatus(msg.sender);
        
        // Update total escrow amount
        ds.totalEscrowAmount -= refundAmount;
        
        // Refund unused budget
        if (refundAmount > 0) {
            require(IERC20(ds.cUSD).transfer(brief.business, refundAmount), "Refund failed");
            emit LibAdsBazaar.BudgetRefunded(_briefId, brief.business, refundAmount);
        }
        
        emit LibAdsBazaar.PromotionStarted(
            _briefId, 
            brief.promotionStartTime, 
            brief.promotionEndTime,
            brief.proofSubmissionDeadline,
            brief.verificationDeadline
        );
    }

    function cancelCampaignWithCompensation(bytes32 _briefId, uint256 _compensationPerInfluencer) external {
        LibAdsBazaar.AdsBazaarStorage storage ds = LibAdsBazaar.adsBazaarStorage();
        require(ds.briefs[_briefId].business != address(0), "Brief does not exist");
        
        LibAdsBazaar.AdBrief storage brief = ds.briefs[_briefId];
        require(brief.business == msg.sender, "Not the brief owner");
        require(brief.status == LibAdsBazaar.CampaignStatus.OPEN, "Brief not in open status");
        require(brief.selectedInfluencersCount > 0, "No influencers to compensate");
        require(block.timestamp > brief.selectionDeadline, "Application period still active");
        require(block.timestamp <= brief.selectionDeadline + brief.selectionGracePeriod, "Grace period has ended");
        
        // Validate compensation amount (max 10% of budget per influencer for wasted time)
        uint256 maxCompensation = (brief.budget * 10) / (100 * brief.selectedInfluencersCount);
        require(_compensationPerInfluencer <= maxCompensation, "Compensation too high");
        
        uint256 totalCompensation = _compensationPerInfluencer * brief.selectedInfluencersCount;
        uint256 refundToBusiness = brief.budget - totalCompensation;
        
        brief.status = LibAdsBazaar.CampaignStatus.CANCELLED;
        
        // Update business's total escrowed amount
        ds.users[msg.sender].totalEscrowed -= brief.budget;
        LibAdsBazaar.updateBusinessStatus(msg.sender);
        
        // Update total escrow amount
        ds.totalEscrowAmount -= brief.budget;
        
        // Pay compensation to selected influencers
        LibAdsBazaar.InfluencerApplication[] storage applications = ds.applications[_briefId];
        for (uint256 i = 0; i < applications.length; i++) {
            if (applications[i].isSelected && _compensationPerInfluencer > 0) {
                // Add to pending payments for selected influencers
                ds.influencerPendingPayments[applications[i].influencer].push(
                    LibAdsBazaar.PendingPayment({
                        briefId: _briefId,
                        amount: _compensationPerInfluencer,
                        isApproved: true
                    })
                );
            }
        }
        
        // Refund remaining budget to business
        if (refundToBusiness > 0) {
            require(IERC20(ds.cUSD).transfer(brief.business, refundToBusiness), "Refund failed");
        }
        
        emit LibAdsBazaar.BriefCancelled(_briefId);
        if (refundToBusiness > 0) {
            emit LibAdsBazaar.BudgetRefunded(_briefId, brief.business, refundToBusiness);
        }
    }

    function completeCampaign(bytes32 _briefId) external {
        LibAdsBazaar.AdsBazaarStorage storage ds = LibAdsBazaar.adsBazaarStorage();
        require(ds.briefs[_briefId].business != address(0), "Brief does not exist");
        
        LibAdsBazaar.AdBrief storage brief = ds.briefs[_briefId];
        require(brief.business == msg.sender, "Not the brief owner");
        require(brief.status == LibAdsBazaar.CampaignStatus.ASSIGNED, "Brief not in assigned status");
        require(block.timestamp >= brief.proofSubmissionDeadline, "Proof submission period still active");
        
        uint256 pendingCount = _getPendingDisputeCount(_briefId);
        if (pendingCount > 0) {
            emit LibAdsBazaar.CampaignCompletionBlocked(_briefId, pendingCount);
            revert("Cannot complete campaign with pending disputes");
        }
        
        // Mark as completed
        brief.status = LibAdsBazaar.CampaignStatus.COMPLETED;
        
        // Process payments for all selected influencers
        _processPayments(_briefId);
    }


    function _getPendingDisputeCount(bytes32 _briefId) internal view returns (uint256) {
        LibAdsBazaar.AdsBazaarStorage storage ds = LibAdsBazaar.adsBazaarStorage();
        uint256 count = 0;
        for (uint256 i = 0; i < ds.applications[_briefId].length; i++) {
            LibAdsBazaar.InfluencerApplication storage app = ds.applications[_briefId][i];
            if (app.isSelected && app.disputeStatus == LibAdsBazaar.DisputeStatus.FLAGGED) {
                uint256 disputeTime = ds.disputeTimestamp[_briefId][app.influencer];
                if (block.timestamp <= disputeTime + LibAdsBazaar.DISPUTE_RESOLUTION_DEADLINE) {
                    count++;
                }
            }
        }
        return count;
    }

    function _processPayments(bytes32 _briefId) internal {
        LibAdsBazaar.AdsBazaarStorage storage ds = LibAdsBazaar.adsBazaarStorage();
        LibAdsBazaar.AdBrief storage brief = ds.briefs[_briefId];
        
        // Count influencers who actually submitted valid proof
        uint256 influencersWithValidProof = 0;
        
        // First pass: Count valid submissions
        for (uint256 i = 0; i < ds.applications[_briefId].length; i++) {
            LibAdsBazaar.InfluencerApplication storage application = ds.applications[_briefId][i];
            if (application.isSelected) {
                if (bytes(application.proofLink).length > 0 && 
                    application.disputeStatus != LibAdsBazaar.DisputeStatus.RESOLVED_INVALID &&
                    application.disputeStatus != LibAdsBazaar.DisputeStatus.EXPIRED) {
                    influencersWithValidProof++;
                }
            }
        }
        
        // Calculate payments only for valid performing influencers
        uint256 equalShare = 0;
        uint256 refundAmount = 0;
        
        if (influencersWithValidProof > 0) {
            equalShare = brief.budget / influencersWithValidProof;
            refundAmount = brief.budget % influencersWithValidProof;
        } else {
            refundAmount = brief.budget;
        }
        
        // Update total escrow amount
        ds.totalEscrowAmount -= brief.budget;
        
        // Second pass: Process payments for valid submissions only
        for (uint256 i = 0; i < ds.applications[_briefId].length; i++) {
            LibAdsBazaar.InfluencerApplication storage application = ds.applications[_briefId][i];
            
            if (application.isSelected) {
                if (bytes(application.proofLink).length > 0 && 
                    application.disputeStatus != LibAdsBazaar.DisputeStatus.RESOLVED_INVALID &&
                    application.disputeStatus != LibAdsBazaar.DisputeStatus.EXPIRED) {
                    
                    application.isApproved = true;
                    
                    // Calculate platform fee
                    uint256 platformFee = (equalShare * ds.platformFeePercentage) / 1000;
                    uint256 influencerAmount = equalShare - platformFee;
                    
                    // Transfer platform fee directly to owner immediately
                    require(IERC20(ds.cUSD).transfer(ds.owner, platformFee), "Platform fee transfer failed");
                    emit LibAdsBazaar.PlatformFeeTransferred(ds.owner, platformFee);
                    
                    // Add to pending payments
                    address influencer = application.influencer;
                    LibAdsBazaar.PendingPayment memory payment = LibAdsBazaar.PendingPayment({
                        briefId: _briefId,
                        amount: influencerAmount,
                        isApproved: true
                    });
                    
                    ds.influencerPendingPayments[influencer].push(payment);
                    ds.totalPendingAmount[influencer] += influencerAmount;
                    
                    // Update influencer's completed campaigns and status
                    ds.users[influencer].completedCampaigns++;
                    LibAdsBazaar.updateInfluencerStatus(influencer);
                    
                    emit LibAdsBazaar.ProofApproved(_briefId, influencer);
                    emit LibAdsBazaar.PaymentReleased(_briefId, influencer, influencerAmount);
                } else {
                    emit LibAdsBazaar.ProofNotSubmitted(_briefId, application.influencer);
                }
            }
        }
        
        // Refund unused budget to business
        if (refundAmount > 0) {
            require(IERC20(ds.cUSD).transfer(brief.business, refundAmount), "Refund transfer failed");
            emit LibAdsBazaar.BudgetRefunded(_briefId, brief.business, refundAmount);
        }
        emit LibAdsBazaar.CampaignCompleted(_briefId, refundAmount);
    }

}