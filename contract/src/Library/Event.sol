// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

library Event{
    event BriefCreated(bytes32 indexed id, address indexed creator);
    event BriefCanceled()
}