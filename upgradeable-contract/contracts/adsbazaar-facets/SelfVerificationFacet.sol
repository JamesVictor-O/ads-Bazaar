// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

import {LibAdsBazaar} from "../libraries/LibAdsBazaar.sol";
import {SelfVerificationRoot} from "@selfxyz/contracts/contracts/abstract/SelfVerificationRoot.sol";
import {ISelfVerificationRoot} from "@selfxyz/contracts/contracts/interfaces/ISelfVerificationRoot.sol";

contract SelfVerificationFacet is SelfVerificationRoot {
    using LibAdsBazaar for LibAdsBazaar.AdsBazaarStorage;

    error RegisteredNullifier();

    constructor() SelfVerificationRoot(address(0), 0, new uint256[](0)) {}

    function verifySelfProof(
        ISelfVerificationRoot.DiscloseCircuitProof memory proof
    ) public override {
        LibAdsBazaar.AdsBazaarStorage storage ds = LibAdsBazaar.adsBazaarStorage();
        
        // Check if nullifier has been registered
        if (ds.nullifiers[proof.pubSignals[NULLIFIER_INDEX]]) {
            revert RegisteredNullifier();
        }
        
        // Update verification config before verification
        _setVerificationConfig(ds.verificationConfig);
        
        // Verify the proof with Self verification hub
        super.verifySelfProof(proof);
        
        // Mark nullifier as used to prevent replay attacks
        ds.nullifiers[proof.pubSignals[NULLIFIER_INDEX]] = true;
        
        // Get the user address from the proof
        address userAddress = address(uint160(proof.pubSignals[USER_IDENTIFIER_INDEX]));
        
        // Mark the influencer as verified
        ds.verifiedInfluencers[userAddress] = true;
        
        emit LibAdsBazaar.InfluencerVerified(userAddress);
    }

    function setVerificationConfig(
        ISelfVerificationRoot.VerificationConfig memory newVerificationConfig
    ) external {
        LibAdsBazaar.AdsBazaarStorage storage ds = LibAdsBazaar.adsBazaarStorage();
        require(msg.sender == ds.owner, "Not authorized");
        
        ds.verificationConfig = newVerificationConfig;
        emit LibAdsBazaar.VerificationConfigUpdated(msg.sender);
    }

    function getVerificationConfig() external view returns (ISelfVerificationRoot.VerificationConfig memory) {
        LibAdsBazaar.AdsBazaarStorage storage ds = LibAdsBazaar.adsBazaarStorage();
        return ds.verificationConfig;
    }

    function isInfluencerVerified(address _influencer) external view returns (bool) {
        LibAdsBazaar.AdsBazaarStorage storage ds = LibAdsBazaar.adsBazaarStorage();
        return ds.verifiedInfluencers[_influencer];
    }
}