// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

import {LibAdsBazaar} from "../libraries/LibAdsBazaar.sol";
import {SelfVerificationRoot} from "@selfxyz/contracts/contracts/abstract/SelfVerificationRoot.sol";
import {ISelfVerificationRoot} from "@selfxyz/contracts/contracts/interfaces/ISelfVerificationRoot.sol";
import {SelfCircuitLibrary} from "@selfxyz/contracts/contracts/libraries/SelfCircuitLibrary.sol";

contract SelfVerificationFacet {
    using LibAdsBazaar for LibAdsBazaar.AdsBazaarStorage;

    error RegisteredNullifier();
    
    uint256 public constant NULLIFIER_INDEX = 7;
    uint256 public constant USER_IDENTIFIER_INDEX = 20;

    function verifySelfProof(
        ISelfVerificationRoot.DiscloseCircuitProof memory proof
    ) external {
        LibAdsBazaar.AdsBazaarStorage storage ds = LibAdsBazaar.adsBazaarStorage();
        
        // Check if nullifier has been registered
        if (ds.nullifiers[proof.pubSignals[NULLIFIER_INDEX]]) {
            revert RegisteredNullifier();
        }
        
        // TODO: Verify the proof with Self verification hub
        // This would require integrating the Self verification logic directly
        // For now, we'll skip the verification and just mark as verified
        
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