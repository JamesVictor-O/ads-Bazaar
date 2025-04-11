// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

library Error {
    error InvalidAddress();
    error InsufficientAmount();
    error InvalidTime();
    error NotOwner();
    error AllReadyAssigned();
}