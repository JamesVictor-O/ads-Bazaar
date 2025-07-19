// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

import {LibAdsBazaar} from "../libraries/LibAdsBazaar.sol";
import {LibMultiCurrencyAdsBazaar} from "../libraries/LibMultiCurrencyAdsBazaar.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract MultiCurrencyPaymentFacet is ReentrancyGuard {
    using LibAdsBazaar for LibAdsBazaar.AdsBazaarStorage;
    using LibMultiCurrencyAdsBazaar for LibMultiCurrencyAdsBazaar.MultiCurrencyStorage;

    // Initialize multi-currency support (owner only)
    function initializeMultiCurrency() external {
        LibAdsBazaar.enforceOwner();
        LibMultiCurrencyAdsBazaar.initializeMultiCurrency();
        emit LibMultiCurrencyAdsBazaar.MultiCurrencyInitialized();
    }

    // Claim payments in a specific token
    function claimPaymentsInToken(address tokenAddress) external nonReentrant {
        LibAdsBazaar.AdsBazaarStorage storage ds = LibAdsBazaar.adsBazaarStorage();
        LibMultiCurrencyAdsBazaar.MultiCurrencyStorage storage mcs = LibMultiCurrencyAdsBazaar.multiCurrencyStorage();
        
        require(ds.users[msg.sender].isInfluencer, "Not registered as influencer");
        LibMultiCurrencyAdsBazaar.enforceTokenSupported(tokenAddress);
        
        uint256 totalAmount = mcs.influencerPendingByToken[msg.sender][tokenAddress];
        require(totalAmount > 0, "No pending payments in this token");
        
        // Reset pending amount for this token
        mcs.influencerPendingByToken[msg.sender][tokenAddress] = 0;
        
        // Mark all payments as claimed for this token
        LibAdsBazaar.PendingPayment[] storage payments = mcs.influencerPaymentsByToken[msg.sender][tokenAddress];
        for (uint256 i = 0; i < payments.length; i++) {
            if (payments[i].isApproved && !_findAndMarkAsClaimedInToken(payments[i].briefId, tokenAddress)) {
                revert("Error marking payment as claimed");
            }
        }
        
        // Clear pending payments array for this token
        delete mcs.influencerPaymentsByToken[msg.sender][tokenAddress];
        
        // Transfer total amount in the specified token
        require(IERC20(tokenAddress).transfer(msg.sender, totalAmount), "Payment transfer failed");
        
        emit LibMultiCurrencyAdsBazaar.PaymentClaimedInToken(msg.sender, tokenAddress, totalAmount);
    }

    // Claim all pending payments across all tokens
    function claimAllPendingPayments() external nonReentrant {
        LibAdsBazaar.AdsBazaarStorage storage ds = LibAdsBazaar.adsBazaarStorage();
        require(ds.users[msg.sender].isInfluencer, "Not registered as influencer");
        
        (address[] memory tokens,) = LibMultiCurrencyAdsBazaar.getAllSupportedTokens();
        
        bool anyClaimed = false;
        for (uint256 i = 0; i < tokens.length; i++) {
            if (_claimTokenIfPending(tokens[i])) {
                anyClaimed = true;
            }
        }
        
        require(anyClaimed, "No pending payments to claim");
    }

    function _claimTokenIfPending(address tokenAddress) internal returns (bool) {
        LibMultiCurrencyAdsBazaar.MultiCurrencyStorage storage mcs = LibMultiCurrencyAdsBazaar.multiCurrencyStorage();
        
        uint256 totalAmount = mcs.influencerPendingByToken[msg.sender][tokenAddress];
        if (totalAmount == 0) return false;
        
        // Reset pending amount for this token
        mcs.influencerPendingByToken[msg.sender][tokenAddress] = 0;
        
        // Mark all payments as claimed for this token
        LibAdsBazaar.PendingPayment[] storage payments = mcs.influencerPaymentsByToken[msg.sender][tokenAddress];
        for (uint256 i = 0; i < payments.length; i++) {
            if (payments[i].isApproved && !_findAndMarkAsClaimedInToken(payments[i].briefId, tokenAddress)) {
                revert("Error marking payment as claimed");
            }
        }
        
        // Clear pending payments array for this token
        delete mcs.influencerPaymentsByToken[msg.sender][tokenAddress];
        
        // Transfer total amount in the specified token
        require(IERC20(tokenAddress).transfer(msg.sender, totalAmount), "Payment transfer failed");
        
        emit LibMultiCurrencyAdsBazaar.PaymentClaimedInToken(msg.sender, tokenAddress, totalAmount);
        return true;
    }

    function _findAndMarkAsClaimedInToken(bytes32 _briefId, address tokenAddress) internal returns (bool) {
        LibAdsBazaar.AdsBazaarStorage storage ds = LibAdsBazaar.adsBazaarStorage();
        LibMultiCurrencyAdsBazaar.MultiCurrencyStorage storage mcs = LibMultiCurrencyAdsBazaar.multiCurrencyStorage();
        
        // Ensure this campaign was created with the specified token
        require(mcs.campaignTokens[_briefId] == tokenAddress, "Campaign token mismatch");
        
        LibAdsBazaar.InfluencerApplication[] storage briefApps = ds.applications[_briefId];
        
        for (uint256 i = 0; i < briefApps.length; i++) {
            if (briefApps[i].influencer == msg.sender && briefApps[i].isSelected) {
                briefApps[i].hasClaimed = true;
                return true;
            }
        }
        
        return false;
    }

    // Add payment to influencer's pending payments in specific token
    function addPendingPaymentInToken(
        address influencer,
        bytes32 briefId,
        uint256 amount,
        address tokenAddress,
        bool isApproved
    ) external {
        LibAdsBazaar.AdsBazaarStorage storage ds = LibAdsBazaar.adsBazaarStorage();
        LibMultiCurrencyAdsBazaar.MultiCurrencyStorage storage mcs = LibMultiCurrencyAdsBazaar.multiCurrencyStorage();
        
        // This should only be called by other facets (internal function access control)
        LibAdsBazaar.enforceOwner(); // For now, restrict to owner. In production, use proper facet access control
        LibMultiCurrencyAdsBazaar.enforceTokenSupported(tokenAddress);
        
        // Add to pending payments by token
        mcs.influencerPaymentsByToken[influencer][tokenAddress].push(
            LibAdsBazaar.PendingPayment({
                briefId: briefId,
                amount: amount,
                isApproved: isApproved
            })
        );
        
        if (isApproved) {
            mcs.influencerPendingByToken[influencer][tokenAddress] += amount;
        }
    }

    // Get pending payments for a specific token
    function getPendingPaymentsInToken(address _influencer, address tokenAddress) external view returns (
        bytes32[] memory briefIds,
        uint256[] memory amounts,
        bool[] memory approved
    ) {
        LibMultiCurrencyAdsBazaar.MultiCurrencyStorage storage mcs = LibMultiCurrencyAdsBazaar.multiCurrencyStorage();
        LibAdsBazaar.PendingPayment[] storage payments = mcs.influencerPaymentsByToken[_influencer][tokenAddress];
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

    // Get total pending amount for a specific token
    function getTotalPendingAmountInToken(address _influencer, address tokenAddress) external view returns (uint256) {
        LibMultiCurrencyAdsBazaar.MultiCurrencyStorage storage mcs = LibMultiCurrencyAdsBazaar.multiCurrencyStorage();
        return mcs.influencerPendingByToken[_influencer][tokenAddress];
    }

    // Get all pending payments across all tokens
    function getAllPendingPayments(address _influencer) external view returns (
        address[] memory tokens,
        uint256[] memory amounts,
        string[] memory symbols
    ) {
        (address[] memory supportedTokens, LibMultiCurrencyAdsBazaar.SupportedCurrency[] memory currencies) = 
            LibMultiCurrencyAdsBazaar.getAllSupportedTokens();
        
        LibMultiCurrencyAdsBazaar.MultiCurrencyStorage storage mcs = LibMultiCurrencyAdsBazaar.multiCurrencyStorage();
        
        uint256 count = 0;
        // First pass: count non-zero amounts
        for (uint256 i = 0; i < supportedTokens.length; i++) {
            if (mcs.influencerPendingByToken[_influencer][supportedTokens[i]] > 0) {
                count++;
            }
        }
        
        tokens = new address[](count);
        amounts = new uint256[](count);
        symbols = new string[](count);
        
        uint256 index = 0;
        // Second pass: populate arrays
        for (uint256 i = 0; i < supportedTokens.length; i++) {
            uint256 pending = mcs.influencerPendingByToken[_influencer][supportedTokens[i]];
            if (pending > 0) {
                tokens[index] = supportedTokens[i];
                amounts[index] = pending;
                symbols[index] = LibMultiCurrencyAdsBazaar.getCurrencySymbol(currencies[i]);
                index++;
            }
        }
        
        return (tokens, amounts, symbols);
    }

    // Set preferred payment token for user
    function setPreferredPaymentToken(address tokenAddress, bool isBusiness) external {
        LibAdsBazaar.AdsBazaarStorage storage ds = LibAdsBazaar.adsBazaarStorage();
        LibMultiCurrencyAdsBazaar.MultiCurrencyStorage storage mcs = LibMultiCurrencyAdsBazaar.multiCurrencyStorage();
        
        if (isBusiness) {
            require(ds.users[msg.sender].isBusiness, "Not registered as business");
            mcs.businessPreferredToken[msg.sender] = tokenAddress;
        } else {
            require(ds.users[msg.sender].isInfluencer, "Not registered as influencer");
            mcs.influencerPreferredToken[msg.sender] = tokenAddress;
        }
        
        LibMultiCurrencyAdsBazaar.enforceTokenSupported(tokenAddress);
        
        emit LibMultiCurrencyAdsBazaar.PreferredTokenSet(msg.sender, tokenAddress, isBusiness);
    }

    // Get preferred payment token for user
    function getPreferredPaymentToken(address user, bool isBusiness) external view returns (address) {
        LibMultiCurrencyAdsBazaar.MultiCurrencyStorage storage mcs = LibMultiCurrencyAdsBazaar.multiCurrencyStorage();
        
        if (isBusiness) {
            address preferred = mcs.businessPreferredToken[user];
            return preferred != address(0) ? preferred : LibMultiCurrencyAdsBazaar.CUSD_ADDRESS; // Default to cUSD
        } else {
            address preferred = mcs.influencerPreferredToken[user];
            return preferred != address(0) ? preferred : LibMultiCurrencyAdsBazaar.CUSD_ADDRESS; // Default to cUSD
        }
    }

    // Get supported tokens and their info
    function getSupportedTokensInfo() external view returns (
        address[] memory tokens,
        string[] memory symbols,
        uint256[] memory totalEscrow,
        uint256[] memory totalVolume
    ) {
        (address[] memory supportedTokens, LibMultiCurrencyAdsBazaar.SupportedCurrency[] memory currencies) = 
            LibMultiCurrencyAdsBazaar.getAllSupportedTokens();
        
        LibMultiCurrencyAdsBazaar.MultiCurrencyStorage storage mcs = LibMultiCurrencyAdsBazaar.multiCurrencyStorage();
        
        tokens = supportedTokens;
        symbols = new string[](supportedTokens.length);
        totalEscrow = new uint256[](supportedTokens.length);
        totalVolume = new uint256[](supportedTokens.length);
        
        for (uint256 i = 0; i < supportedTokens.length; i++) {
            symbols[i] = LibMultiCurrencyAdsBazaar.getCurrencySymbol(currencies[i]);
            totalEscrow[i] = mcs.totalEscrowByToken[supportedTokens[i]];
            totalVolume[i] = mcs.totalVolumeByToken[supportedTokens[i]];
        }
        
        return (tokens, symbols, totalEscrow, totalVolume);
    }

    // Legacy support: claim payments (defaults to cUSD)
    function claimPayments() external nonReentrant {
        this.claimPaymentsInToken(LibMultiCurrencyAdsBazaar.CUSD_ADDRESS);
    }

    // Legacy support: get pending payments (defaults to cUSD)
    function getPendingPayments(address _influencer) external view returns (
        bytes32[] memory briefIds,
        uint256[] memory amounts,
        bool[] memory approved
    ) {
        return this.getPendingPaymentsInToken(_influencer, LibMultiCurrencyAdsBazaar.CUSD_ADDRESS);
    }

    // Legacy support: get total pending amount (defaults to cUSD)
    function getTotalPendingAmount(address _influencer) external view returns (uint256) {
        return this.getTotalPendingAmountInToken(_influencer, LibMultiCurrencyAdsBazaar.CUSD_ADDRESS);
    }
}