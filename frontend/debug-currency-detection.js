// Debug currency detection for cEUR campaigns
import { createPublicClient, http } from 'viem';
import { celo } from 'viem/chains';

const CONTRACT_ADDRESS = '0xc48fa76f729bceebb79c1b65de8feb52f9475cf9';
const RPC_URL = 'https://celo-mainnet.g.alchemy.com/v2/qMj263vOQ9uKwIE4R9s3638-8zRBds9t';

const publicClient = createPublicClient({
  chain: celo,
  transport: http(RPC_URL)
});

// Expected token addresses from contracts.ts
const MENTO_TOKENS = {
  cUSD: {
    address: '0x765DE816845861e75A25fCA122bb6898B8B1282a',
    symbol: 'cUSD',
    name: 'Celo Dollar'
  },
  cEUR: {
    address: '0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73',
    symbol: 'cEUR', 
    name: 'Celo Euro'
  },
  cREAL: {
    address: '0xe8537a3d056DA446677B9E9d6c5dB704EaAb4787',
    symbol: 'cREAL',
    name: 'Brazilian Real'
  }
};

// ABI for testing
const testABI = [
  {
    name: 'getBusinessBriefs',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'business', type: 'address' }],
    outputs: [{ type: 'bytes32[]' }]
  },
  {
    name: 'getCampaignTokenInfo',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'briefId', type: 'bytes32' }],
    outputs: [{
      type: 'tuple',
      components: [
        { name: 'tokenAddress', type: 'address' },
        { name: 'symbol', type: 'string' },
        { name: 'currency', type: 'uint8' }
      ]
    }]
  },
  {
    name: 'getAdBrief',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'briefId', type: 'bytes32' }],
    outputs: [{
      type: 'tuple',
      components: [
        { name: 'business', type: 'address' },
        { name: 'name', type: 'string' },
        { name: 'description', type: 'string' },
        { name: 'requirements', type: 'string' },
        { name: 'budget', type: 'uint256' },
        { name: 'status', type: 'uint8' },
        { name: 'promotionDuration', type: 'uint256' },
        { name: 'promotionStartTime', type: 'uint256' },
        { name: 'promotionEndTime', type: 'uint256' },
        { name: 'proofSubmissionDeadline', type: 'uint256' },
        { name: 'verificationDeadline', type: 'uint256' },
        { name: 'maxInfluencers', type: 'uint256' },
        { name: 'selectedInfluencersCount', type: 'uint256' },
        { name: 'targetAudience', type: 'uint8' },
        { name: 'creationTime', type: 'uint256' },
        { name: 'selectionDeadline', type: 'uint256' },
        { name: 'applicationPeriod', type: 'uint256' },
        { name: 'proofSubmissionGracePeriod', type: 'uint256' },
        { name: 'verificationPeriod', type: 'uint256' },
        { name: 'selectionGracePeriod', type: 'uint256' }
      ]
    }]
  }
];

// Currency detection function (from frontend code)
function getCurrencyFromTokenAddress(tokenAddress) {
  console.log(`🔍 Looking up currency for token address: ${tokenAddress}`);
  console.log('📋 Available tokens:', Object.keys(MENTO_TOKENS));
  
  const currency = Object.entries(MENTO_TOKENS).find(([_, token]) => 
    token.address.toLowerCase() === tokenAddress.toLowerCase()
  );
  
  const result = currency ? currency[0] : 'cUSD';
  console.log(`✅ Currency lookup result: ${result}`);
  return result;
}

async function debugCurrencyDetection() {
  console.log('🔍 Debugging Currency Detection for cEUR Campaign');
  console.log('================================================');
  
  try {
    // You'll need to provide your business address
    console.log('Please provide your business address to debug your campaigns.');
    console.log('For now, checking the contract functions...\n');

    // 1. Check if getCampaignTokenInfo function exists and works
    console.log('1️⃣ Testing getCampaignTokenInfo Function');
    console.log('---------------------------------------');
    
    // Test with a dummy campaign ID to see function response structure
    const dummyCampaignId = '0x0000000000000000000000000000000000000000000000000000000000000001';
    
    try {
      const tokenInfo = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: testABI,
        functionName: 'getCampaignTokenInfo',
        args: [dummyCampaignId]
      });
      
      console.log('✅ getCampaignTokenInfo function is accessible');
      console.log('Response structure:', tokenInfo);
      
    } catch (error) {
      if (error.message.includes('Campaign not found')) {
        console.log('✅ getCampaignTokenInfo function exists (expected error for dummy ID)');
      } else {
        console.log('❌ getCampaignTokenInfo function error:', error.message);
      }
    }

    // 2. Test currency mapping logic
    console.log('\n2️⃣ Testing Currency Mapping Logic');
    console.log('----------------------------------');
    
    // Test with known token addresses
    const testAddresses = [
      { address: '0x765DE816845861e75A25fCA122bb6898B8B1282a', expected: 'cUSD' },
      { address: '0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73', expected: 'cEUR' },
      { address: '0xe8537a3d056DA446677B9E9d6c5dB704EaAb4787', expected: 'cREAL' }
    ];
    
    testAddresses.forEach(test => {
      const result = getCurrencyFromTokenAddress(test.address);
      console.log(`${result === test.expected ? '✅' : '❌'} ${test.address} → ${result} (expected: ${test.expected})`);
    });

    // 3. Test with different address formats
    console.log('\n3️⃣ Testing Address Format Variations');
    console.log('------------------------------------');
    
    const ceurAddress = '0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73';
    const variations = [
      ceurAddress,                                           // Normal
      ceurAddress.toUpperCase(),                            // All caps
      ceurAddress.toLowerCase(),                            // All lowercase
      ' ' + ceurAddress + ' ',                             // With spaces
      '0x' + ceurAddress.slice(2).padStart(40, '0')       // Zero-padded
    ];
    
    variations.forEach((variation, i) => {
      const result = getCurrencyFromTokenAddress(variation.trim());
      console.log(`Test ${i+1}: "${variation}" → ${result}`);
    });

    // 4. Check contract configuration
    console.log('\n4️⃣ Contract Token Configuration');
    console.log('-------------------------------');
    
    console.log('Expected cEUR address:', MENTO_TOKENS.cEUR.address);
    console.log('Expected cUSD address:', MENTO_TOKENS.cUSD.address);
    
    // 5. Debugging recommendations
    console.log('\n🛠️  Debugging Your Specific Campaign');
    console.log('=====================================');
    console.log('To debug your cEUR campaign, please:');
    console.log('');
    console.log('1. Get your business address from MetaMask/wallet');
    console.log('2. Find your campaign ID in the browser console logs');
    console.log('3. Run this command with your campaign ID:');
    console.log('   node debug-campaign-specific.js <your-campaign-id>');
    console.log('');
    console.log('Or check the browser developer console for logs like:');
    console.log('- "Looking up currency for token address: ..."');
    console.log('- "Campaign token info call failed..."');
    console.log('- "Final currency result: ..."');
    
    // 6. Potential fixes
    console.log('\n🔧 Potential Solutions');
    console.log('======================');
    console.log('If the issue persists:');
    console.log('1. Clear browser cache and refresh');
    console.log('2. Check if the campaign was created with the correct token address');
    console.log('3. Verify the frontend is using the latest ABI');
    console.log('4. Check browser console for specific error messages');

  } catch (error) {
    console.error('❌ Debug script failed:', error);
  }
}

// Run the debug script
debugCurrencyDetection().catch(console.error);