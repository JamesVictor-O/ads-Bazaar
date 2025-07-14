// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

import {LibAdsBazaar} from "../libraries/LibAdsBazaar.sol";

contract GettersFacet {
    using LibAdsBazaar for LibAdsBazaar.AdsBazaarStorage;

    struct BriefData {
        address business;
        string name; 
        string description;
        string requirements;
        uint256 budget;
        LibAdsBazaar.CampaignStatus status;
        uint256 promotionDuration;
        uint256 promotionStartTime;
        uint256 promotionEndTime;
        uint256 proofSubmissionDeadline;
        uint256 verificationDeadline;
        uint256 maxInfluencers;
        uint256 selectedInfluencersCount;
        LibAdsBazaar.TargetAudience targetAudience;
        uint256 creationTime;
        uint256 selectionDeadline;
        uint256 applicationPeriod;
        uint256 proofSubmissionGracePeriod;
        uint256 verificationPeriod;
        uint256 selectionGracePeriod;
    }
    
    struct ApplicationData {
        address[] influencers;
        string[] messages;
        uint256[] timestamps;
        bool[] isSelected;
        bool[] hasClaimed;
        string[] proofLinks;
        bool[] isApproved;
    }

    function getInfluencerProfile(address _influencer) external view returns (string memory) {
        LibAdsBazaar.AdsBazaarStorage storage ds = LibAdsBazaar.adsBazaarStorage();
        return ds.influencerProfiles[_influencer];
    }

    function getAdBrief(bytes32 _briefId) external view returns (BriefData memory) {
        LibAdsBazaar.AdsBazaarStorage storage ds = LibAdsBazaar.adsBazaarStorage();
        LibAdsBazaar.AdBrief storage brief = ds.briefs[_briefId];
        
        return BriefData({
            business: brief.business,
            name: brief.name,
            description: brief.description,
            requirements: brief.requirements,
            budget: brief.budget,
            status: brief.status,
            promotionDuration: brief.promotionDuration,
            promotionStartTime: brief.promotionStartTime,
            promotionEndTime: brief.promotionEndTime,
            proofSubmissionDeadline: brief.proofSubmissionDeadline,
            verificationDeadline: brief.verificationDeadline,
            maxInfluencers: brief.maxInfluencers,
            selectedInfluencersCount: brief.selectedInfluencersCount,
            targetAudience: brief.targetAudience,
            creationTime: brief.creationTime,
            selectionDeadline: brief.selectionDeadline,
            applicationPeriod: brief.applicationPeriod,
            proofSubmissionGracePeriod: brief.proofSubmissionGracePeriod,
            verificationPeriod: brief.verificationPeriod,
            selectionGracePeriod: brief.selectionGracePeriod
        });
    }

    function getAllBriefs() external view returns (bytes32[] memory) {
        LibAdsBazaar.AdsBazaarStorage storage ds = LibAdsBazaar.adsBazaarStorage();
        return ds.allBriefIds;
    }
    
    function getBusinessBriefs(address _business) external view returns (bytes32[] memory) {
        LibAdsBazaar.AdsBazaarStorage storage ds = LibAdsBazaar.adsBazaarStorage();
        return ds.businessBriefs[_business];
    }
    
    function getInfluencerApplications(address _influencer) external view returns (bytes32[] memory) {
        LibAdsBazaar.AdsBazaarStorage storage ds = LibAdsBazaar.adsBazaarStorage();
        return ds.influencerApplications[_influencer];
    }

    function getBriefApplications(bytes32 _briefId) external view returns (ApplicationData memory) {
        LibAdsBazaar.AdsBazaarStorage storage ds = LibAdsBazaar.adsBazaarStorage();
        LibAdsBazaar.InfluencerApplication[] storage briefApps = ds.applications[_briefId];
        uint256 count = briefApps.length;
        
        address[] memory influencers = new address[](count);
        string[] memory messages = new string[](count);
        uint256[] memory timestamps = new uint256[](count);
        bool[] memory isSelected = new bool[](count);
        bool[] memory hasClaimed = new bool[](count);
        string[] memory proofLinks = new string[](count);
        bool[] memory isApproved = new bool[](count);
        
        for (uint256 i = 0; i < count; i++) {
            influencers[i] = briefApps[i].influencer;
            messages[i] = briefApps[i].message;
            timestamps[i] = briefApps[i].timestamp;
            isSelected[i] = briefApps[i].isSelected;
            hasClaimed[i] = briefApps[i].hasClaimed;
            proofLinks[i] = briefApps[i].proofLink;
            isApproved[i] = briefApps[i].isApproved;
        }
        
        return ApplicationData({
            influencers: influencers,
            messages: messages,
            timestamps: timestamps,
            isSelected: isSelected,
            hasClaimed: hasClaimed,
            proofLinks: proofLinks,
            isApproved: isApproved
        });
    }

    function getTotalInfluencers() external view returns (uint256) {
        LibAdsBazaar.AdsBazaarStorage storage ds = LibAdsBazaar.adsBazaarStorage();
        return ds.totalInfluencers;
    }

    function getTotalBusinesses() external view returns (uint256) {
        LibAdsBazaar.AdsBazaarStorage storage ds = LibAdsBazaar.adsBazaarStorage();
        return ds.totalBusinesses;
    }

    function getTotalUsers() external view returns (uint256) {
        LibAdsBazaar.AdsBazaarStorage storage ds = LibAdsBazaar.adsBazaarStorage();
        return ds.totalUsers;
    }

    function getTotalEscrowAmount() external view returns (uint256) {
        LibAdsBazaar.AdsBazaarStorage storage ds = LibAdsBazaar.adsBazaarStorage();
        return ds.totalEscrowAmount;
    }

    function getUserStatus(address _user) external view returns (LibAdsBazaar.UserStatus) {
        LibAdsBazaar.AdsBazaarStorage storage ds = LibAdsBazaar.adsBazaarStorage();
        return ds.users[_user].status;
    }
    
    function getInfluencerStats(address _influencer) external view returns (uint256 completedCampaigns, LibAdsBazaar.UserStatus status) {
        LibAdsBazaar.AdsBazaarStorage storage ds = LibAdsBazaar.adsBazaarStorage();
        require(ds.users[_influencer].isInfluencer, "Not an influencer");
        return (ds.users[_influencer].completedCampaigns, ds.users[_influencer].status);
    }
    
    function getBusinessStats(address _business) external view returns (uint256 totalEscrowed, LibAdsBazaar.UserStatus status) {
        LibAdsBazaar.AdsBazaarStorage storage ds = LibAdsBazaar.adsBazaarStorage();
        require(ds.users[_business].isBusiness, "Not a business");
        return (ds.users[_business].totalEscrowed, ds.users[_business].status);
    }

    function getUsers(address _user) external view returns (LibAdsBazaar.UserProfile memory) {
        LibAdsBazaar.AdsBazaarStorage storage ds = LibAdsBazaar.adsBazaarStorage();
        return ds.users[_user];
    }

    function getOwner() external view returns (address) {
        LibAdsBazaar.AdsBazaarStorage storage ds = LibAdsBazaar.adsBazaarStorage();
        return ds.owner;
    }

    function getCUSD() external view returns (address) {
        LibAdsBazaar.AdsBazaarStorage storage ds = LibAdsBazaar.adsBazaarStorage();
        return ds.cUSD;
    }

    function getPlatformFeePercentage() external view returns (uint256) {
        LibAdsBazaar.AdsBazaarStorage storage ds = LibAdsBazaar.adsBazaarStorage();
        return ds.platformFeePercentage;
    }

    function isRegistered(address _user) external view returns (bool) {
        LibAdsBazaar.AdsBazaarStorage storage ds = LibAdsBazaar.adsBazaarStorage();
        return ds.users[_user].isRegistered;
    }

    function isInfluencer(address _user) external view returns (bool) {
        LibAdsBazaar.AdsBazaarStorage storage ds = LibAdsBazaar.adsBazaarStorage();
        return ds.users[_user].isInfluencer;
    }

    function getUserByUsername(string calldata _username) external view returns (address) {
        LibAdsBazaar.AdsBazaarStorage storage ds = LibAdsBazaar.adsBazaarStorage();
        return ds.usernameToAddress[_username];
    }

    function isUsernameAvailable(string calldata _username) external view returns (bool) {
        LibAdsBazaar.AdsBazaarStorage storage ds = LibAdsBazaar.adsBazaarStorage();
        return !ds.usernameExists[_username];
    }

    function getUserUsername(address _user) external view returns (string memory) {
        LibAdsBazaar.AdsBazaarStorage storage ds = LibAdsBazaar.adsBazaarStorage();
        return ds.users[_user].username;
    }
}