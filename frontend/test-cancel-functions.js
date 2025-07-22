// Test cancelCampaignWithCompensation and other cancel functions
import { createPublicClient, http, keccak256, toBytes } from 'viem';
import { celo } from 'viem/chains';

const CONTRACT_ADDRESS = '0xe66b437DE9fbd724c59c635ABeB943f9d4c09677';
const RPC_URL = 'https://forno.celo.org';

const publicClient = createPublicClient({
  chain: celo,
  transport: http(RPC_URL)
});

// Diamond Loupe ABI to check available functions
const diamondLoupeABI = [
  {
    name: 'facets',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{
      type: 'tuple[]',
      components: [
        { name: 'facetAddress', type: 'address' },
        { name: 'functionSelectors', type: 'bytes4[]' }
      ]
    }]
  }
];

async function testCancelFunctions() {
  console.log('🔍 Testing Cancel Functions Availability');
  console.log('=====================================');
  
  try {
    // Get all facets and their function selectors
    const facets = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: diamondLoupeABI,
      functionName: 'facets'
    });
    
    // Collect all function selectors
    const allSelectors = new Set();
    facets.forEach(facet => {
      facet.functionSelectors.forEach(selector => {
        allSelectors.add(selector.toLowerCase());
      });
    });
    
    console.log(`📊 Total function selectors in diamond: ${allSelectors.size}\n`);
    
    // Test cancel functions we expect
    const cancelFunctions = [
      'cancelAdBriefWithToken(bytes32)',
      'cancelCampaignWithCompensation(bytes32,uint256)'
    ];

    console.log('🧪 Testing Cancel Functions:');
    for (const func of cancelFunctions) {
      // Calculate function selector for this function
      const selector = keccak256(toBytes(func)).slice(0, 10);
      const exists = allSelectors.has(selector.toLowerCase());
      console.log(`${exists ? '✅' : '❌'} ${func}`);
      console.log(`   Selector: ${selector}`);
      console.log(`   Available: ${exists ? 'YES' : 'NO'}\n`);
    }

    // Test payment claim functions
    const paymentFunctions = [
      'claimPaymentsInToken(address)',
      'claimAllPendingPayments()'
    ];

    console.log('💰 Testing Payment Claim Functions:');
    for (const func of paymentFunctions) {
      const selector = keccak256(toBytes(func)).slice(0, 10);
      const exists = allSelectors.has(selector.toLowerCase());
      console.log(`${exists ? '✅' : '❌'} ${func}`);
      console.log(`   Selector: ${selector}`);
      console.log(`   Available: ${exists ? 'YES' : 'NO'}\n`);
    }

    // Test other important functions
    const otherFunctions = [
      'createAdBriefWithToken(string,string,string,uint256,uint256,uint256,uint8,uint256,uint256,uint256,uint256,address)',
      'getTotalUsers()',
      'getAdBrief(bytes32)'
    ];

    console.log('🔧 Testing Other Important Functions:');
    for (const func of otherFunctions) {
      const selector = keccak256(toBytes(func)).slice(0, 10);
      const exists = allSelectors.has(selector.toLowerCase());
      console.log(`${exists ? '✅' : '❌'} ${func.split('(')[0]}`);
    }

    console.log('\n📋 Summary:');
    console.log('   This test verifies that the contract has the required function selectors');
    console.log('   If any functions show as missing, they may need to be added to the diamond');
    console.log('   or the ABI may need to be updated with the correct function signatures.');

  } catch (error) {
    console.error('❌ Error testing cancel functions:', error);
  }
}

// Run the test
testCancelFunctions().catch(console.error);