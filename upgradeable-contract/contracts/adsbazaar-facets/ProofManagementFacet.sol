// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

import {LibAdsBazaar} from "../libraries/LibAdsBazaar.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract ProofManagementFacet {
    using LibAdsBazaar for LibAdsBazaar.AdsBazaarStorage;

    function submitProof(bytes32 _briefId, string calldata _proofLink) external {
        LibAdsBazaar.AdsBazaarStorage storage ds = LibAdsBazaar.adsBazaarStorage();
        require(ds.users[msg.sender].isInfluencer, "Not registered as influencer");
        require(ds.briefs[_briefId].business != address(0), "Brief does not exist");
        
        LibAdsBazaar.AdBrief storage brief = ds.briefs[_briefId];
        require(brief.status == LibAdsBazaar.CampaignStatus.ASSIGNED, "Brief not in assigned status");
        require(block.timestamp >= brief.promotionStartTime, "Promotion has not started yet");
        require(block.timestamp <= brief.promotionEndTime, "Promotion has already ended");
        require(block.timestamp <= brief.proofSubmissionDeadline, "Proof submission period has ended");
        
        bool found = false;
        for (uint256 i = 0; i < ds.applications[_briefId].length; i++) {
            if (ds.applications[_briefId][i].influencer == msg.sender && ds.applications[_briefId][i].isSelected) {
                ds.applications[_briefId][i].proofLink = _proofLink;
                found = true;
                emit LibAdsBazaar.ProofSubmitted(_briefId, msg.sender, _proofLink);
                break;
            }
        }
        
        require(found, "Not selected for this brief");
    }

    function triggerAutoApproval(bytes32 _briefId) external {
        LibAdsBazaar.AdsBazaarStorage storage ds = LibAdsBazaar.adsBazaarStorage();
        require(ds.briefs[_briefId].business != address(0), "Brief does not exist");
        
        LibAdsBazaar.AdBrief storage brief = ds.briefs[_briefId];
        require(brief.status == LibAdsBazaar.CampaignStatus.ASSIGNED, "Brief not in assigned status");
        require(block.timestamp > brief.verificationDeadline, "Verification deadline not yet passed");
        
        _finalizeExpiredDisputes(_briefId);
        
        // Mark brief as completed
        brief.status = LibAdsBazaar.CampaignStatus.COMPLETED;
        
        // Process payments for all selected influencers
        _processPayments(_briefId);
        
        emit LibAdsBazaar.AutoApprovalTriggered(_briefId);
    }

    function _finalizeExpiredDisputes(bytes32 _briefId) internal {
        LibAdsBazaar.AdsBazaarStorage storage ds = LibAdsBazaar.adsBazaarStorage();
        
        for (uint256 i = 0; i < ds.applications[_briefId].length; i++) {
            LibAdsBazaar.InfluencerApplication storage app = ds.applications[_briefId][i];
            if (app.isSelected && app.disputeStatus == LibAdsBazaar.DisputeStatus.FLAGGED) {
                uint256 disputeTime = ds.disputeTimestamp[_briefId][app.influencer];
                if (block.timestamp > disputeTime + LibAdsBazaar.DISPUTE_RESOLUTION_DEADLINE) {
                    app.disputeStatus = LibAdsBazaar.DisputeStatus.EXPIRED;
                    emit LibAdsBazaar.DisputeExpired(_briefId, app.influencer, false);
                }
            }
        }
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
                    _updateInfluencerStatus(influencer);
                    
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

    function _updateInfluencerStatus(address _influencer) internal {
        LibAdsBazaar.AdsBazaarStorage storage ds = LibAdsBazaar.adsBazaarStorage();
        uint256 completed = ds.users[_influencer].completedCampaigns;
        LibAdsBazaar.UserStatus newStatus;
        
        if (completed >= 500) {
            newStatus = LibAdsBazaar.UserStatus.SUPERSTAR;
        } else if (completed >= 100) {
            newStatus = LibAdsBazaar.UserStatus.ELITE;
        } else if (completed >= 50) {
            newStatus = LibAdsBazaar.UserStatus.POPULAR;
        } else if (completed >= 20) {
            newStatus = LibAdsBazaar.UserStatus.RISING;
        } else {
            newStatus = LibAdsBazaar.UserStatus.NEW_COMER;
        }
        
        if (ds.users[_influencer].status != newStatus) {
            ds.users[_influencer].status = newStatus;
            emit LibAdsBazaar.UserStatusUpdated(_influencer, newStatus);
        }
    }
}