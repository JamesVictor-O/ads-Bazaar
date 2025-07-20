// Test what functions are actually available in the diamond contract
import { createPublicClient, http } from 'viem';
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

// Test ABI for functions we expect
const testABI = [
  {
    name: 'getTotalUsers',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }]
  },
  {
    name: 'getUsers',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'address[]' }]
  }
];

async function testAvailableFunctions() {
  console.log('🔍 Testing Available Functions in Diamond Contract');
  console.log('================================================');
  
  try {
    // Get all facets and their function selectors
    const facets = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: diamondLoupeABI,
      functionName: 'facets'
    });
    
    console.log(`\n📋 Diamond has ${facets.length} facets deployed`);
    
    // Collect all function selectors
    const allSelectors = new Set();
    facets.forEach(facet => {
      console.log(`\nFacet: ${facet.facetAddress}`);
      console.log(`Functions: ${facet.functionSelectors.length}`);
      facet.functionSelectors.forEach(selector => {
        allSelectors.add(selector.toLowerCase());
      });
    });
    
    console.log(`\n📊 Total function selectors: ${allSelectors.size}`);
    
    // Test some basic functions
    console.log('\n🧪 Testing Basic Functions:');
    
    try {
      const totalUsers = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: testABI,
        functionName: 'getTotalUsers'
      });
      console.log(`✅ getTotalUsers(): ${totalUsers.toString()}`);
    } catch (error) {
      console.log(`❌ getTotalUsers(): ${error.message.split('\\n')[0]}`);
    }

    try {
      const users = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: testABI,
        functionName: 'getUsers'
      });
      console.log(`✅ getUsers(): Array with ${users.length} users`);
      
      // Count businesses and influencers from user data
      if (users.length > 0) {
        console.log('\n🔍 Analyzing Users:');
        console.log(`   Total Users: ${users.length}`);
        // Note: We'd need to check individual user profiles to count businesses vs influencers
        // But this shows the user data exists
      }
    } catch (error) {
      console.log(`❌ getUsers(): ${error.message.split('\\n')[0]}`);
    }

    // Check specific functions we need for platform stats
    const requiredFunctions = [
      'getTotalUsers',
      'getTotalBusinesses', 
      'getTotalInfluencers',
      'getTotalEscrowAmount'
    ];

    console.log('\n📋 Required Platform Stats Functions:');
    for (const func of requiredFunctions) {
      // Calculate function selector for this function
      const selector = publicClient.keccak256(`${func}()`).slice(0, 10);
      const exists = allSelectors.has(selector.toLowerCase());
      console.log(`${exists ? '✅' : '❌'} ${func}: ${exists ? 'Available' : 'Missing'}`);
    }

    console.log('\n💡 Recommendations:');
    console.log('   1. If getTotalBusinesses/getTotalInfluencers are missing, we need to implement them');
    console.log('   2. Or modify the frontend to calculate these from existing user data');
    console.log('   3. Or use placeholder values until functions are implemented');

  } catch (error) {
    console.error('❌ Error testing available functions:', error);
  }
}

// Run the test
testAvailableFunctions().catch(console.error);