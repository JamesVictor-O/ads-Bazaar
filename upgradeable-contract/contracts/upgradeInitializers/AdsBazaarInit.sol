// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

import {LibAdsBazaar} from "../libraries/LibAdsBazaar.sol";
import {LibDiamond} from "../libraries/LibDiamond.sol";
import {ISelfVerificationRoot} from "@selfxyz/contracts/contracts/interfaces/ISelfVerificationRoot.sol";

contract AdsBazaarInit {
    function init(
        address _owner,
        address _cUSD,
        uint256 _platformFeePercentage,
        address _identityVerificationHub,
        uint256 _scope,
        uint256[] memory _attestationIds
    ) external {
        LibAdsBazaar.AdsBazaarStorage storage ds = LibAdsBazaar.adsBazaarStorage();
        
        // Initialize core contract variables
        ds.owner = _owner;
        ds.cUSD = _cUSD;
        ds.platformFeePercentage = _platformFeePercentage;
        
        // Initialize Self protocol configuration
        ds.identityVerificationHub = _identityVerificationHub;
        ds.scope = _scope;
        ds.attestationIds = _attestationIds;
        ds.verificationConfig = ISelfVerificationRoot.VerificationConfig({
            olderThanEnabled: false,
            olderThan: 0,
            forbiddenCountriesEnabled: false,
            forbiddenCountriesListPacked: [uint256(0), uint256(0), uint256(0), uint256(0)],
            ofacEnabled: [true, true, true]
        });
        
        // Initialize platform statistics
        ds.totalInfluencers = 0;
        ds.totalBusinesses = 0;
        ds.totalUsers = 0;
        ds.totalEscrowAmount = 0;
    }
}