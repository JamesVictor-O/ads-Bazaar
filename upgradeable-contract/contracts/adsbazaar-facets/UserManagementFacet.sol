// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

import {LibAdsBazaar} from "../libraries/LibAdsBazaar.sol";

contract UserManagementFacet {
    using LibAdsBazaar for LibAdsBazaar.AdsBazaarStorage;

    function registerUser(bool _isBusiness, bool _isInfluencer, string calldata _profileData) external {
        LibAdsBazaar.AdsBazaarStorage storage ds = LibAdsBazaar.adsBazaarStorage();
        
        require(_isBusiness || _isInfluencer, "Must register as business or influencer");
        require(!(_isBusiness && _isInfluencer), "Cannot be both business and influencer");
        require(!ds.users[msg.sender].isRegistered, "User already registered");
        
        ds.users[msg.sender] = LibAdsBazaar.UserProfile({
            isRegistered: true,
            isBusiness: _isBusiness,
            isInfluencer: _isInfluencer,
            profileData: _profileData,
            status: LibAdsBazaar.UserStatus.NEW_COMER,
            completedCampaigns: 0,
            totalEscrowed: 0
        });
        
        // Update platform statistics
        ds.totalUsers++;
        if (_isBusiness) {
            ds.totalBusinesses++;
        }
        if (_isInfluencer) {
            ds.totalInfluencers++;
        }
        
        emit LibAdsBazaar.UserRegistered(msg.sender, _isBusiness, _isInfluencer);
    }

    function updateInfluencerProfile(string calldata _profileData) external {
        LibAdsBazaar.AdsBazaarStorage storage ds = LibAdsBazaar.adsBazaarStorage();
        require(ds.users[msg.sender].isInfluencer, "Not registered as influencer");
        
        ds.influencerProfiles[msg.sender] = _profileData;
        emit LibAdsBazaar.InfluencerProfileUpdated(msg.sender, _profileData);
    }


    function setPlatformFee(uint256 _newFeePercentage) external {
        LibAdsBazaar.AdsBazaarStorage storage ds = LibAdsBazaar.adsBazaarStorage();
        require(msg.sender == ds.owner, "Not authorized");
        require(_newFeePercentage <= 10, "Fee too high");
        
        ds.platformFeePercentage = _newFeePercentage;
    }
}