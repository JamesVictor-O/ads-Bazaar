// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

import {LibAdsBazaar} from "./LibAdsBazaar.sol";

library LibMultiCurrencyAdsBazaar {
    bytes32 constant MULTICURRENCY_STORAGE_POSITION = keccak256("multicurrency.adsbazaar.storage");
    
    // Mento Stablecoin addresses on Celo
    address constant CUSD_ADDRESS = 0x765DE816845861e75A25fCA122bb6898B8B1282a;
    address constant CEUR_ADDRESS = 0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73;
    address constant CREAL_ADDRESS = 0xe8537a3d056DA446677B9E9d6c5dB704EaAb4787;
    address constant CKES_ADDRESS = 0x456a3D042C0DbD3db53D5489e98dFb038553B0d0;
    address constant EXOF_ADDRESS = 0x73F93dcc49cB8A239e2032663e9475dd5ef29A08;
    address constant CNGN_ADDRESS = 0x17700282592D6917F6A73D0bF8AcCf4D578c131e;

    enum SupportedCurrency {
        cUSD,
        cEUR,
        cREAL,
        cKES,
        eXOF,
        cNGN
    }

    struct MultiCurrencyStorage {
        // Token whitelist
        mapping(address => bool) supportedTokens;
        mapping(SupportedCurrency => address) currencyToAddress;
        mapping(address => SupportedCurrency) addressToCurrency;
        
        // Campaign currency tracking
        mapping(bytes32 => address) campaignTokens;
        mapping(bytes32 => SupportedCurrency) campaignCurrencies;
        
        // Multi-currency pending payments
        mapping(address => mapping(address => uint256)) influencerPendingByToken;
        mapping(address => mapping(address => LibAdsBazaar.PendingPayment[])) influencerPaymentsByToken;
        
        // Platform fees by currency
        mapping(address => uint256) platformFeesByToken;
        
        // Exchange rate integration (for display purposes)
        mapping(address => mapping(address => uint256)) lastKnownRates; // from -> to -> rate (18 decimals)
        mapping(address => uint256) lastRateUpdate;
        
        // Statistics by currency
        mapping(address => uint256) totalEscrowByToken;
        mapping(address => uint256) totalVolumeByToken;
        
        // Business preferences
        mapping(address => address) businessPreferredToken;
        mapping(address => address) influencerPreferredToken;
    }

    function multiCurrencyStorage() internal pure returns (MultiCurrencyStorage storage mcs) {
        bytes32 position = MULTICURRENCY_STORAGE_POSITION;
        assembly {
            mcs.slot := position
        }
    }

    function initializeMultiCurrency() internal {
        MultiCurrencyStorage storage mcs = multiCurrencyStorage();
        
        // Initialize supported tokens
        mcs.supportedTokens[CUSD_ADDRESS] = true;
        mcs.supportedTokens[CEUR_ADDRESS] = true;
        mcs.supportedTokens[CREAL_ADDRESS] = true;
        mcs.supportedTokens[CKES_ADDRESS] = true;
        mcs.supportedTokens[EXOF_ADDRESS] = true;
        mcs.supportedTokens[CNGN_ADDRESS] = true;
        
        // Map currencies to addresses
        mcs.currencyToAddress[SupportedCurrency.cUSD] = CUSD_ADDRESS;
        mcs.currencyToAddress[SupportedCurrency.cEUR] = CEUR_ADDRESS;
        mcs.currencyToAddress[SupportedCurrency.cREAL] = CREAL_ADDRESS;
        mcs.currencyToAddress[SupportedCurrency.cKES] = CKES_ADDRESS;
        mcs.currencyToAddress[SupportedCurrency.eXOF] = EXOF_ADDRESS;
        mcs.currencyToAddress[SupportedCurrency.cNGN] = CNGN_ADDRESS;
        
        // Map addresses to currencies
        mcs.addressToCurrency[CUSD_ADDRESS] = SupportedCurrency.cUSD;
        mcs.addressToCurrency[CEUR_ADDRESS] = SupportedCurrency.cEUR;
        mcs.addressToCurrency[CREAL_ADDRESS] = SupportedCurrency.cREAL;
        mcs.addressToCurrency[CKES_ADDRESS] = SupportedCurrency.cKES;
        mcs.addressToCurrency[EXOF_ADDRESS] = SupportedCurrency.eXOF;
        mcs.addressToCurrency[CNGN_ADDRESS] = SupportedCurrency.cNGN;
    }

    function getCurrencyAddress(SupportedCurrency currency) internal view returns (address) {
        return multiCurrencyStorage().currencyToAddress[currency];
    }

    function getCurrencyFromAddress(address tokenAddress) internal view returns (SupportedCurrency) {
        return multiCurrencyStorage().addressToCurrency[tokenAddress];
    }

    function isTokenSupported(address tokenAddress) internal view returns (bool) {
        return multiCurrencyStorage().supportedTokens[tokenAddress];
    }

    function getAllSupportedTokens() internal view returns (address[] memory tokens, SupportedCurrency[] memory currencies) {
        tokens = new address[](6);
        currencies = new SupportedCurrency[](6);
        
        tokens[0] = CUSD_ADDRESS;
        tokens[1] = CEUR_ADDRESS;
        tokens[2] = CREAL_ADDRESS;
        tokens[3] = CKES_ADDRESS;
        tokens[4] = EXOF_ADDRESS;
        tokens[5] = CNGN_ADDRESS;
        
        currencies[0] = SupportedCurrency.cUSD;
        currencies[1] = SupportedCurrency.cEUR;
        currencies[2] = SupportedCurrency.cREAL;
        currencies[3] = SupportedCurrency.cKES;
        currencies[4] = SupportedCurrency.eXOF;
        currencies[5] = SupportedCurrency.cNGN;
    }

    // Events
    event MultiCurrencyInitialized();
    event CampaignCreatedWithToken(bytes32 indexed briefId, address indexed business, address token, uint256 budget);
    event PaymentClaimedInToken(address indexed influencer, address token, uint256 amount);
    event TokenSupported(address indexed token, SupportedCurrency currency);
    event ExchangeRateUpdated(address indexed fromToken, address indexed toToken, uint256 rate);
    event PreferredTokenSet(address indexed user, address token, bool isBusiness);
    event PlatformFeeCollectedInToken(address token, uint256 amount);

    // Helper functions
    function enforceTokenSupported(address tokenAddress) internal view {
        require(isTokenSupported(tokenAddress), "Token not supported");
    }

    function getCurrencySymbol(SupportedCurrency currency) internal pure returns (string memory) {
        if (currency == SupportedCurrency.cUSD) return "cUSD";
        if (currency == SupportedCurrency.cEUR) return "cEUR";
        if (currency == SupportedCurrency.cREAL) return "cREAL";
        if (currency == SupportedCurrency.cKES) return "cKES";
        if (currency == SupportedCurrency.eXOF) return "eXOF";
        if (currency == SupportedCurrency.cNGN) return "cNGN";
        return "UNKNOWN";
    }

    function updateExchangeRate(address fromToken, address toToken, uint256 rate) internal {
        MultiCurrencyStorage storage mcs = multiCurrencyStorage();
        mcs.lastKnownRates[fromToken][toToken] = rate;
        mcs.lastRateUpdate[fromToken] = block.timestamp;
        
        emit ExchangeRateUpdated(fromToken, toToken, rate);
    }

    function getExchangeRate(address fromToken, address toToken) internal view returns (uint256 rate, uint256 lastUpdate) {
        MultiCurrencyStorage storage mcs = multiCurrencyStorage();
        return (mcs.lastKnownRates[fromToken][toToken], mcs.lastRateUpdate[fromToken]);
    }
}