// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

import {LibAdsBazaar} from "../libraries/LibAdsBazaar.sol";

contract DisputeManagementFacet {
    using LibAdsBazaar for LibAdsBazaar.AdsBazaarStorage;

    function addDisputeResolver(address _resolver) external {
        LibAdsBazaar.AdsBazaarStorage storage ds = LibAdsBazaar.adsBazaarStorage();
        require(msg.sender == ds.owner, "Not authorized");
        require(_resolver != address(0), "Invalid resolver address");
        require(!ds.disputeResolvers[_resolver], "Already a dispute resolver");
        
        ds.disputeResolvers[_resolver] = true;
        ds.disputeResolversList.push(_resolver);
        
        emit LibAdsBazaar.DisputeResolverAdded(_resolver);
    }

    function removeDisputeResolver(address _resolver) external {
        LibAdsBazaar.AdsBazaarStorage storage ds = LibAdsBazaar.adsBazaarStorage();
        require(msg.sender == ds.owner, "Not authorized");
        require(ds.disputeResolvers[_resolver], "Not a dispute resolver");
        
        ds.disputeResolvers[_resolver] = false;
        
        // Remove from array
        for (uint256 i = 0; i < ds.disputeResolversList.length; i++) {
            if (ds.disputeResolversList[i] == _resolver) {
                ds.disputeResolversList[i] = ds.disputeResolversList[ds.disputeResolversList.length - 1];
                ds.disputeResolversList.pop();
                break;
            }
        }
        
        emit LibAdsBazaar.DisputeResolverRemoved(_resolver);
    }

    function flagSubmission(bytes32 _briefId, address _influencer, string calldata _reason) external {
        LibAdsBazaar.AdsBazaarStorage storage ds = LibAdsBazaar.adsBazaarStorage();
        require(ds.briefs[_briefId].business != address(0), "Brief does not exist");
        
        LibAdsBazaar.AdBrief storage brief = ds.briefs[_briefId];
        require(brief.business == msg.sender, "Not the brief owner");
        require(brief.status == LibAdsBazaar.CampaignStatus.ASSIGNED, "Brief not in assigned status");
        require(bytes(_reason).length > 0, "Dispute reason required");
        
        bool found = false;
        for (uint256 i = 0; i < ds.applications[_briefId].length; i++) {
            LibAdsBazaar.InfluencerApplication storage application = ds.applications[_briefId][i];
            if (application.influencer == _influencer && application.isSelected) {
                require(bytes(application.proofLink).length > 0, "No proof submitted yet");
                require(application.disputeStatus == LibAdsBazaar.DisputeStatus.NONE, "Already flagged or resolved");
                
                application.disputeStatus = LibAdsBazaar.DisputeStatus.FLAGGED;
                application.disputeReason = _reason;
                found = true;
                
                emit LibAdsBazaar.SubmissionFlagged(_briefId, _influencer, msg.sender, _reason);
                break;
            }
        }
        
        require(found, "Influencer not found or not selected");
        ds.disputeTimestamp[_briefId][_influencer] = block.timestamp;
    }

    function resolveDispute(bytes32 _briefId, address _influencer, bool _isValid) external {
        LibAdsBazaar.AdsBazaarStorage storage ds = LibAdsBazaar.adsBazaarStorage();
        require(ds.disputeResolvers[msg.sender], "Not authorized dispute resolver");
        require(ds.briefs[_briefId].business != address(0), "Brief does not exist");
        require(block.timestamp <= ds.disputeTimestamp[_briefId][_influencer] + LibAdsBazaar.DISPUTE_RESOLUTION_DEADLINE, "Dispute resolution deadline passed");
        
        bool found = false;
        for (uint256 i = 0; i < ds.applications[_briefId].length; i++) {
            LibAdsBazaar.InfluencerApplication storage application = ds.applications[_briefId][i];
            if (application.influencer == _influencer && application.isSelected) {
                require(application.disputeStatus == LibAdsBazaar.DisputeStatus.FLAGGED, "No active dispute to resolve");
                
                application.disputeStatus = _isValid ? LibAdsBazaar.DisputeStatus.RESOLVED_VALID : LibAdsBazaar.DisputeStatus.RESOLVED_INVALID;
                application.resolvedBy = msg.sender;
                found = true;
                
                emit LibAdsBazaar.DisputeResolved(_briefId, _influencer, msg.sender, _isValid);
                break;
            }
        }
        
        require(found, "Influencer not found or not selected");
    }

    function expireDispute(bytes32 _briefId, address _influencer) external {
        LibAdsBazaar.AdsBazaarStorage storage ds = LibAdsBazaar.adsBazaarStorage();
        require(ds.briefs[_briefId].business != address(0), "Brief does not exist");
        require(ds.disputeTimestamp[_briefId][_influencer] > 0, "No dispute exists");
        require(block.timestamp > ds.disputeTimestamp[_briefId][_influencer] + LibAdsBazaar.DISPUTE_RESOLUTION_DEADLINE, "Dispute not yet expired");
        
        // Find and update the application
        for (uint256 i = 0; i < ds.applications[_briefId].length; i++) {
            LibAdsBazaar.InfluencerApplication storage app = ds.applications[_briefId][i];
            if (app.influencer == _influencer && app.isSelected && 
                app.disputeStatus == LibAdsBazaar.DisputeStatus.FLAGGED) {
                
                app.disputeStatus = LibAdsBazaar.DisputeStatus.EXPIRED;
                emit LibAdsBazaar.DisputeExpired(_briefId, _influencer, false);
                break;
            }
        }
    }

    function getDisputeResolvers() external view returns (address[] memory) {
        LibAdsBazaar.AdsBazaarStorage storage ds = LibAdsBazaar.adsBazaarStorage();
        return ds.disputeResolversList;
    }

    function getApplicationDispute(bytes32 _briefId, address _influencer) external view returns (
        LibAdsBazaar.DisputeStatus disputeStatus,
        string memory disputeReason,
        address resolvedBy
    ) {
        LibAdsBazaar.AdsBazaarStorage storage ds = LibAdsBazaar.adsBazaarStorage();
        
        for (uint256 i = 0; i < ds.applications[_briefId].length; i++) {
            LibAdsBazaar.InfluencerApplication storage application = ds.applications[_briefId][i];
            if (application.influencer == _influencer && application.isSelected) {
                return (application.disputeStatus, application.disputeReason, application.resolvedBy);
            }
        }
        revert("Influencer not found or not selected");
    }

    function hasPendingDisputes(bytes32 _briefId) external view returns (bool) {
        LibAdsBazaar.AdsBazaarStorage storage ds = LibAdsBazaar.adsBazaarStorage();
        
        for (uint256 i = 0; i < ds.applications[_briefId].length; i++) {
            LibAdsBazaar.InfluencerApplication storage app = ds.applications[_briefId][i];
            if (app.isSelected && app.disputeStatus == LibAdsBazaar.DisputeStatus.FLAGGED) {
                uint256 disputeTime = ds.disputeTimestamp[_briefId][app.influencer];
                if (block.timestamp <= disputeTime + LibAdsBazaar.DISPUTE_RESOLUTION_DEADLINE) {
                    return true;
                }
            }
        }
        return false;
    }

    function getPendingDisputeCount(bytes32 _briefId) external view returns (uint256) {
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
}