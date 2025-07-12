// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

import {LibAdsBazaar} from "../libraries/LibAdsBazaar.sol";

contract ApplicationManagementFacet {
    using LibAdsBazaar for LibAdsBazaar.AdsBazaarStorage;

    function applyToBrief(bytes32 _briefId, string calldata _message) external {
        LibAdsBazaar.AdsBazaarStorage storage ds = LibAdsBazaar.adsBazaarStorage();
        require(ds.users[msg.sender].isInfluencer, "Not registered as influencer");
        require(ds.briefs[_briefId].business != address(0), "Brief does not exist");
        
        LibAdsBazaar.AdBrief storage brief = ds.briefs[_briefId];
        require(brief.status == LibAdsBazaar.CampaignStatus.OPEN, "Brief not open for applications");
        require(block.timestamp <= brief.selectionDeadline, "Application period has ended");
        
        // Check if influencer has already applied
        for (uint256 i = 0; i < ds.applications[_briefId].length; i++) {
            require(ds.applications[_briefId][i].influencer != msg.sender, "Already applied");
        }

        ds.briefApplicationCounts[_briefId]++;
        
        // Create application
        LibAdsBazaar.InfluencerApplication memory newApplication = LibAdsBazaar.InfluencerApplication({
            influencer: msg.sender,
            message: _message,
            timestamp: block.timestamp,
            isSelected: false,
            hasClaimed: false,
            proofLink: "",
            isApproved: false,
            disputeStatus: LibAdsBazaar.DisputeStatus.NONE,
            disputeReason: "",
            resolvedBy: address(0)
        });
        
        ds.applications[_briefId].push(newApplication);
        ds.influencerApplications[msg.sender].push(_briefId);
        
        emit LibAdsBazaar.ApplicationSubmitted(_briefId, msg.sender);
    }

    function selectInfluencer(bytes32 _briefId, uint256 _applicationIndex) external {
        LibAdsBazaar.AdsBazaarStorage storage ds = LibAdsBazaar.adsBazaarStorage();
        require(ds.briefs[_briefId].business != address(0), "Brief does not exist");
        
        LibAdsBazaar.AdBrief storage brief = ds.briefs[_briefId];
        require(brief.business == msg.sender, "Not the brief owner");
        require(brief.status == LibAdsBazaar.CampaignStatus.OPEN, "Brief not in open status");
        require(block.timestamp <= brief.selectionDeadline + LibAdsBazaar.SELECTION_GRACE_PERIOD, "Selection period has ended");
        require(brief.selectedInfluencersCount < brief.maxInfluencers, "Max influencers already selected");
        require(_applicationIndex < ds.applications[_briefId].length, "Invalid application index");
        
        LibAdsBazaar.InfluencerApplication storage application = ds.applications[_briefId][_applicationIndex];
        require(!application.isSelected, "Influencer already selected");
        
        application.isSelected = true;
        brief.selectedInfluencersCount++;
        
        // If all slots filled, change status to ASSIGNED and set all timing parameters
        if (brief.selectedInfluencersCount == brief.maxInfluencers) {
            brief.status = LibAdsBazaar.CampaignStatus.ASSIGNED;
            // No preparation period - campaign starts immediately
            brief.promotionStartTime = block.timestamp;
            brief.promotionEndTime = brief.promotionStartTime + brief.promotionDuration;
            brief.proofSubmissionDeadline = brief.promotionEndTime + brief.proofSubmissionGracePeriod;
            brief.verificationDeadline = brief.proofSubmissionDeadline + brief.verificationPeriod;
            
            emit LibAdsBazaar.PromotionStarted(
                _briefId, 
                brief.promotionStartTime, 
                brief.promotionEndTime,
                brief.proofSubmissionDeadline,
                brief.verificationDeadline
            );
        }
        
        emit LibAdsBazaar.InfluencerSelected(_briefId, application.influencer);
    }

    function hasInfluencerApplied(bytes32 _briefId, address _influencer) external view returns (bool) {
        LibAdsBazaar.AdsBazaarStorage storage ds = LibAdsBazaar.adsBazaarStorage();
        LibAdsBazaar.InfluencerApplication[] storage briefApplications = ds.applications[_briefId];
        
        for (uint256 i = 0; i < briefApplications.length; i++) {
            if (briefApplications[i].influencer == _influencer) {
                return true;
            }
        }
        return false;
    }
}