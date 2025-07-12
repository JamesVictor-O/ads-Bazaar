// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

import {LibAdsBazaar} from "../libraries/LibAdsBazaar.sol";

contract UserManagementFacet {
    using LibAdsBazaar for LibAdsBazaar.AdsBazaarStorage;

    function registerUser(bool _isBusiness, bool _isInfluencer, string calldata _username, string calldata _profileData) external {
        LibAdsBazaar.AdsBazaarStorage storage ds = LibAdsBazaar.adsBazaarStorage();
        
        require(_isBusiness || _isInfluencer, "Must register as business or influencer");
        require(!(_isBusiness && _isInfluencer), "Cannot be both business and influencer");
        require(!ds.users[msg.sender].isRegistered, "User already registered");
        require(bytes(_username).length >= 3 && bytes(_username).length <= 20, "Username must be 3-20 characters");
        require(!ds.usernameExists[_username], "Username already taken");
        
        ds.users[msg.sender] = LibAdsBazaar.UserProfile({
            isRegistered: true,
            isBusiness: _isBusiness,
            isInfluencer: _isInfluencer,
            status: LibAdsBazaar.UserStatus.NEW_COMER,
            username: _username,
            profileData: _profileData,
            completedCampaigns: 0,
            totalEscrowed: 0
        });
        
        // Register username
        ds.usernameToAddress[_username] = msg.sender;
        ds.usernameExists[_username] = true;
        
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