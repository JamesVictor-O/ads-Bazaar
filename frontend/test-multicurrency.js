// Test script for Multi-Currency AdsBazaar Diamond functionality
// Run this with: node test-multicurrency.js

import { ethers } from 'ethers';

// Contract configuration
const CONTRACT_ADDRESS = '0x2f00c10f7e0b6772a0d01d0f742590753edbe08b'; // From contracts.ts
const RPC_URL = 'https://forno.celo.org'; // Celo mainnet

// Test addresses
const MENTO_TOKENS = {
  cUSD: '0x765DE816845861e75A25fCA122bb6898B8B1282a',
  cEUR: '0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73',
  cREAL: '0xe8537a3d056DA446677B9E9d6c5dB704EaAb4787'
};

async function testMultiCurrencyContract() {
  console.log('🧪 Testing Multi-Currency AdsBazaar Diamond Contract');
  console.log('=' .repeat(60));
  
  // Create provider
  const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
  
  // Test 1: Check if contract exists
  console.log('\n1️⃣ Testing contract deployment...');
  try {
    const code = await provider.getCode(CONTRACT_ADDRESS);
    if (code === '0x') {
      console.log('❌ Contract not deployed at address:', CONTRACT_ADDRESS);
      return;
    }
    console.log('✅ Contract deployed successfully');
    console.log(`   Code size: ${code.length} bytes`);
  } catch (error) {
    console.log('❌ Error checking contract:', error.message);
    return;
  }

  // Test 2: Test Diamond Loupe functions
  console.log('\n2️⃣ Testing Diamond Loupe functions...');
  try {
    const contract = new ethers.Contract(CONTRACT_ADDRESS, [
      'function facets() external view returns (tuple(address facetAddress, bytes4[] functionSelectors)[])',
      'function facetAddresses() external view returns (address[])',
    ], provider);
    
    const facets = await contract.facets();
    console.log(`✅ Diamond has ${facets.length} facets:`);
    
    facets.forEach((facet, index) => {
      console.log(`   ${index + 1}. ${facet.facetAddress} (${facet.functionSelectors.length} functions)`);
    });
    
  } catch (error) {
    console.log('❌ Error testing Diamond Loupe:', error.message);
  }

  // Test 3: Test existing functions (should work)
  console.log('\n3️⃣ Testing existing functions...');
  try {
    const contract = new ethers.Contract(CONTRACT_ADDRESS, [
      'function getAllBriefs() external view returns (tuple(bytes32 id, string name, string description, string requirements, uint256 budget, address business, uint256 promotionDuration, uint256 maxInfluencers, uint8 targetAudience, uint256 applicationPeriod, uint256 proofSubmissionGracePeriod, uint256 verificationPeriod, uint256 selectionGracePeriod, uint8 status, uint256 timestamp, uint256 totalReward, address[] selectedInfluencers, bool fundsDeposited)[])',
      'function getTotalUsers() external view returns (uint256)',
      'function getPlatformFeePercentage() external view returns (uint256)',
    ], provider);
    
    const totalUsers = await contract.getTotalUsers();
    console.log(`✅ Total users: ${totalUsers}`);
    
    const platformFee = await contract.getPlatformFeePercentage();
    console.log(`✅ Platform fee: ${platformFee} basis points`);
    
    const briefs = await contract.getAllBriefs();
    console.log(`✅ Total campaigns: ${briefs.length}`);
    
  } catch (error) {
    console.log('❌ Error testing existing functions:', error.message);
  }

  // Test 4: Test Multi-Currency functions
  console.log('\n4️⃣ Testing Multi-Currency functions...');
  try {
    const multiCurrencyABI = [
      // Multi-Currency Payment functions
      'function getAllPendingPayments(address influencer) external view returns (tuple(address[] tokens, uint256[] amounts, string[] symbols))',
      'function getPendingPaymentsInToken(address influencer, address token) external view returns (uint256)',
      'function getTotalPendingAmountInToken(address token) external view returns (uint256)',
      'function getPreferredPaymentToken(address user, bool isBusiness) external view returns (address)',
      
      // Multi-Currency Campaign functions  
      'function getCampaignTokenInfo(bytes32 campaignId) external view returns (tuple(address tokenAddress, string symbol, uint8 currency))',
      'function getCampaignsByToken(address token) external view returns (bytes32[])',
      'function getCampaignStatsByCurrency() external view returns (tuple(address[] tokens, string[] symbols, uint256[] campaignCounts, uint256[] totalBudgets, uint256[] totalVolumes))',
      
      // Write functions for testing (view only - won't actually call)
      'function createAdBriefWithToken(string memory name, string memory description, string memory requirements, uint256 budget, uint256 promotionDuration, uint256 maxInfluencers, uint8 targetAudience, uint256 applicationPeriod, uint256 proofSubmissionGracePeriod, uint256 verificationPeriod, uint256 selectionGracePeriod, address token) external',
      'function claimPaymentsInToken(address token) external',
      'function claimAllPendingPayments() external',
      'function setPreferredPaymentToken(address token, bool isBusiness) external'
    ];
    
    const contract = new ethers.Contract(CONTRACT_ADDRESS, multiCurrencyABI, provider);
    
    // Test multi-currency stats
    try {
      const stats = await contract.getCampaignStatsByCurrency();
      console.log('✅ Multi-currency stats retrieved:');
      console.log(`   Supported tokens: ${stats.tokens.length}`);
      if (stats.tokens.length > 0) {
        stats.tokens.forEach((token, index) => {
          console.log(`   - ${stats.symbols[index]}: ${stats.campaignCounts[index]} campaigns`);
        });
      }
    } catch (error) {
      console.log('❌ Error getting campaign stats:', error.message);
    }
    
    // Test with a dummy address for pending payments
    const dummyAddress = '0x0000000000000000000000000000000000000001';
    try {
      const pendingPayments = await contract.getAllPendingPayments(dummyAddress);
      console.log('✅ Pending payments function works');
      console.log(`   Tokens with pending payments: ${pendingPayments.tokens.length}`);
    } catch (error) {
      console.log('❌ Error getting pending payments:', error.message);
    }
    
    // Test token-specific pending payments for cUSD
    try {
      const cusdPending = await contract.getPendingPaymentsInToken(dummyAddress, MENTO_TOKENS.cUSD);
      console.log(`✅ cUSD pending payments: ${ethers.formatEther(cusdPending)} cUSD`);
    } catch (error) {
      console.log('❌ Error getting cUSD pending payments:', error.message);
    }
    
  } catch (error) {
    console.log('❌ Error testing multi-currency functions:', error.message);
  }

  // Test 5: Check token contract interactions
  console.log('\n5️⃣ Testing Mento token contracts...');
  
  for (const [symbol, address] of Object.entries(MENTO_TOKENS)) {
    try {
      const tokenContract = new ethers.Contract(address, [
        'function name() external view returns (string)',
        'function symbol() external view returns (string)',
        'function decimals() external view returns (uint8)',
        'function totalSupply() external view returns (uint256)'
      ], provider);
      
      const name = await tokenContract.name();
      const tokenSymbol = await tokenContract.symbol();
      const decimals = await tokenContract.decimals();
      const totalSupply = await tokenContract.totalSupply();
      
      console.log(`✅ ${symbol} (${address}):`);
      console.log(`   Name: ${name}`);
      console.log(`   Symbol: ${tokenSymbol}`);
      console.log(`   Decimals: ${decimals}`);
      console.log(`   Total Supply: ${ethers.formatUnits(totalSupply, decimals)}`);
      
    } catch (error) {
      console.log(`❌ Error testing ${symbol} token:`, error.message);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('🎉 Multi-Currency Contract Testing Complete!');
  console.log('\n💡 Next steps for frontend testing:');
  console.log('   1. Update ABI with multi-currency functions');
  console.log('   2. Test campaign creation with different tokens');
  console.log('   3. Test payment claiming functionality');
  console.log('   4. Test currency conversion features');
}

// Run the test
testMultiCurrencyContract().catch(console.error);