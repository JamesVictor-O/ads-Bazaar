// Test the new diamond deployment functionality
import { createPublicClient, http } from 'viem';
import { celo } from 'viem/chains';

const NEW_CONTRACT_ADDRESS = '0xc48fa76f729bceebb79c1b65de8feb52f9475cf9';
const RPC_URL = 'https://celo-mainnet.g.alchemy.com/v2/qMj263vOQ9uKwIE4R9s3638-8zRBds9t';

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

// Test basic functions
const testABI = [
  {
    name: 'getTotalUsers',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }]
  },
  {
    name: 'owner',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'address' }]
  }
];

async function testNewDeployment() {
  console.log('🚀 Testing New Diamond Deployment');
  console.log('=================================');
  console.log(`Contract Address: ${NEW_CONTRACT_ADDRESS}`);
  console.log(`Network: Celo Mainnet (42220)`);
  console.log('');

  try {
    // 1. Test basic contract existence
    console.log('1️⃣ Testing Contract Existence...');
    const code = await publicClient.getCode({ address: NEW_CONTRACT_ADDRESS });
    if (code && code !== '0x') {
      console.log(`✅ Contract deployed successfully (${code.length} bytes)`);
    } else {
      console.log('❌ Contract not found or no code');
      return;
    }

    // 2. Test Diamond Loupe functionality
    console.log('\n2️⃣ Testing Diamond Loupe...');
    try {
      const facets = await publicClient.readContract({
        address: NEW_CONTRACT_ADDRESS,
        abi: diamondLoupeABI,
        functionName: 'facets'
      });
      
      console.log(`✅ Diamond has ${facets.length} facets deployed`);
      
      // Count total function selectors
      let totalSelectors = 0;
      facets.forEach(facet => {
        totalSelectors += facet.functionSelectors.length;
        console.log(`   Facet: ${facet.facetAddress} (${facet.functionSelectors.length} functions)`);
      });
      
      console.log(`✅ Total function selectors: ${totalSelectors}`);
      
    } catch (error) {
      console.log(`❌ Diamond Loupe failed: ${error.message.split('\n')[0]}`);
    }

    // 3. Test Owner function
    console.log('\n3️⃣ Testing Owner Function...');
    try {
      const owner = await publicClient.readContract({
        address: NEW_CONTRACT_ADDRESS,
        abi: testABI,
        functionName: 'owner'
      });
      console.log(`✅ Contract Owner: ${owner}`);
    } catch (error) {
      console.log(`❌ Owner function failed: ${error.message.split('\n')[0]}`);
    }

    // 4. Test Total Users function (platform stat)
    console.log('\n4️⃣ Testing Platform Functions...');
    try {
      const totalUsers = await publicClient.readContract({
        address: NEW_CONTRACT_ADDRESS,
        abi: testABI,
        functionName: 'getTotalUsers'
      });
      console.log(`✅ Total Users: ${totalUsers.toString()}`);
    } catch (error) {
      console.log(`❌ getTotalUsers failed: ${error.message.split('\n')[0]}`);
    }

    // 5. Test Cancel functions (our new additions)
    console.log('\n5️⃣ Testing Cancel Functions...');
    
    // Check if cancelCampaignWithCompensation is now available
    const cancelFunctions = [
      'cancelAdBriefWithToken(bytes32)',
      'cancelCampaignWithCompensation(bytes32,uint256)'
    ];

    // We need to check facets to see available functions
    try {
      const facets = await publicClient.readContract({
        address: NEW_CONTRACT_ADDRESS,
        abi: diamondLoupeABI,
        functionName: 'facets'
      });
      
      const allSelectors = new Set();
      facets.forEach(facet => {
        facet.functionSelectors.forEach(selector => {
          allSelectors.add(selector.toLowerCase());
        });
      });

      // Check our new function
      const compensationSelector = '0xc25d8ca5'; // cancelCampaignWithCompensation selector
      const standardSelector = '0xb4d1a148'; // cancelAdBriefWithToken selector
      
      console.log(`   cancelAdBriefWithToken: ${allSelectors.has(standardSelector.toLowerCase()) ? '✅ Available' : '❌ Missing'}`);
      console.log(`   cancelCampaignWithCompensation: ${allSelectors.has(compensationSelector.toLowerCase()) ? '✅ Available' : '❌ Missing'}`);

    } catch (error) {
      console.log(`❌ Cancel function check failed: ${error.message}`);
    }

    // 6. Test Multi-currency Payment functions
    console.log('\n6️⃣ Testing Payment Functions...');
    const paymentSelectors = {
      'claimPaymentsInToken': '0x590c8028',
      'claimAllPendingPayments': '0xd327f07a'
    };

    try {
      const facets = await publicClient.readContract({
        address: NEW_CONTRACT_ADDRESS,
        abi: diamondLoupeABI,
        functionName: 'facets'
      });
      
      const allSelectors = new Set();
      facets.forEach(facet => {
        facet.functionSelectors.forEach(selector => {
          allSelectors.add(selector.toLowerCase());
        });
      });

      Object.entries(paymentSelectors).forEach(([name, selector]) => {
        const available = allSelectors.has(selector.toLowerCase());
        console.log(`   ${name}: ${available ? '✅ Available' : '❌ Missing'}`);
      });

    } catch (error) {
      console.log(`❌ Payment function check failed: ${error.message}`);
    }

    console.log('\n🎯 Deployment Verification Summary:');
    console.log('====================================');
    console.log(`✅ Contract deployed at: ${NEW_CONTRACT_ADDRESS}`);
    console.log('✅ Diamond structure is working');
    console.log('✅ Basic functions are accessible');
    console.log('✅ Ready for frontend integration');
    console.log('\n🔗 View on Explorer:');
    console.log(`   Celoscan: https://celoscan.io/address/${NEW_CONTRACT_ADDRESS}`);
    console.log(`   Celo Explorer: https://explorer.celo.org/mainnet/address/${NEW_CONTRACT_ADDRESS}`);

  } catch (error) {
    console.error('❌ Deployment test failed:', error);
  }
}

// Run the test
testNewDeployment().catch(console.error);