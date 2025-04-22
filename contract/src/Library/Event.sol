// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

library Event{
    event BriefCreated(bytes32 indexed id, address indexed creator);
    event BriefCanceled();
    event BriefAssigned(bytes32 indexed id, address indexed influencer);
    event AdCommentAdded(
        bytes32 indexed id,
        address indexed influencer,
        string comment
    );
    event  InfluencerSelected(
        bytes32 indexed id,
        address indexed influencer
    );
}