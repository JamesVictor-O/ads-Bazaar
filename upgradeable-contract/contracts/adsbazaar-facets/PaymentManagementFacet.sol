// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

// Legacy PaymentManagementFacet replaced by MultiCurrencyPaymentFacet
// All payment management functions now support multi-currency operations
// This file is kept for backward compatibility but contains no active functions

// TO USE PAYMENT FUNCTIONS:
// - Use claimPaymentsInToken() instead of claimPayments()
// - Use claimAllPendingPayments() to claim payments across all currencies
// - Use getMultiCurrencyPendingPayments() instead of getPendingPayments()
// - Use getTotalMultiCurrencyPendingAmount() instead of getTotalPendingAmount()
// - All functions in MultiCurrencyPaymentFacet support cUSD and other currencies

contract PaymentManagementFacet {
    // This contract is deprecated - use MultiCurrencyPaymentFacet instead
    // All legacy functions have been removed to eliminate complexity
    // The multi-currency functions handle cUSD as well as other supported tokens
}