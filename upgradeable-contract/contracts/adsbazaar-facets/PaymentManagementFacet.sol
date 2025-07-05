// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

import {LibAdsBazaar} from "../libraries/LibAdsBazaar.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract PaymentManagementFacet is ReentrancyGuard {
    using LibAdsBazaar for LibAdsBazaar.AdsBazaarStorage;

    function claimPayments() external nonReentrant {
        LibAdsBazaar.AdsBazaarStorage storage ds = LibAdsBazaar.adsBazaarStorage();
        require(ds.users[msg.sender].isInfluencer, "Not registered as influencer");
        
        uint256 totalAmount = ds.totalPendingAmount[msg.sender];
        require(totalAmount > 0, "No pending payments to claim");
        
        // Reset pending amount
        ds.totalPendingAmount[msg.sender] = 0;
        
        // Mark all payments as claimed
        LibAdsBazaar.PendingPayment[] storage payments = ds.influencerPendingPayments[msg.sender];
        for (uint256 i = 0; i < payments.length; i++) {
            if (payments[i].isApproved && !_findAndMarkAsClaimed(payments[i].briefId)) {
                revert("Error marking payment as claimed");
            }
        }
        
        // Clear pending payments array
        delete ds.influencerPendingPayments[msg.sender];
        
        // Transfer total amount
        require(IERC20(ds.cUSD).transfer(msg.sender, totalAmount), "Payment transfer failed");
        
        emit LibAdsBazaar.PaymentClaimed(msg.sender, totalAmount);
    }

    function _findAndMarkAsClaimed(bytes32 _briefId) internal returns (bool) {
        LibAdsBazaar.AdsBazaarStorage storage ds = LibAdsBazaar.adsBazaarStorage();
        LibAdsBazaar.InfluencerApplication[] storage briefApps = ds.applications[_briefId];
        
        for (uint256 i = 0; i < briefApps.length; i++) {
            if (briefApps[i].influencer == msg.sender && briefApps[i].isSelected) {
                briefApps[i].hasClaimed = true;
                return true;
            }
        }
        
        return false;
    }

    function getPendingPayments(address _influencer) external view returns (
        bytes32[] memory briefIds,
        uint256[] memory amounts,
        bool[] memory approved
    ) {
        LibAdsBazaar.AdsBazaarStorage storage ds = LibAdsBazaar.adsBazaarStorage();
        LibAdsBazaar.PendingPayment[] storage payments = ds.influencerPendingPayments[_influencer];
        uint256 count = payments.length;
        
        briefIds = new bytes32[](count);
        amounts = new uint256[](count);
        approved = new bool[](count);
        
        for (uint256 i = 0; i < count; i++) {
            briefIds[i] = payments[i].briefId;
            amounts[i] = payments[i].amount;
            approved[i] = payments[i].isApproved;
        }
        
        return (briefIds, amounts, approved);
    }

    function getTotalPendingAmount(address _influencer) external view returns (uint256) {
        LibAdsBazaar.AdsBazaarStorage storage ds = LibAdsBazaar.adsBazaarStorage();
        return ds.totalPendingAmount[_influencer];
    }
}