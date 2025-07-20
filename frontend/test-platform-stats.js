// Test platform statistics functions
import { createPublicClient, http } from 'viem';
import { celo } from 'viem/chains';

const CONTRACT_ADDRESS = '0xe66b437DE9fbd724c59c635ABeB943f9d4c09677';
const RPC_URL = 'https://forno.celo.org';

const publicClient = createPublicClient({
  chain: celo,
  transport: http(RPC_URL)
});

// Simple ABI for the stats functions
const statsABI = [
  {
    name: 'getTotalUsers',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }]
  },
  {
    name: 'getTotalBusinesses',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }]
  },
  {
    name: 'getTotalInfluencers',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }]
  },
  {
    name: 'getTotalEscrowAmount',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }]
  }
];

async function testPlatformStats() {
  console.log('🧪 Testing Platform Statistics Functions');
  console.log('=========================================');
  
  try {
    // Test all platform stats functions
    console.log('\n📊 Testing Platform Stats Functions:');
    
    const totalUsers = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: statsABI,
      functionName: 'getTotalUsers'
    });
    console.log(`✅ Total Users: ${totalUsers.toString()}`);

    const totalBusinesses = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: statsABI,
      functionName: 'getTotalBusinesses'
    });
    console.log(`✅ Total Businesses: ${totalBusinesses.toString()}`);

    const totalInfluencers = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: statsABI,
      functionName: 'getTotalInfluencers'
    });
    console.log(`✅ Total Creators/Influencers: ${totalInfluencers.toString()}`);

    const totalEscrowAmount = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: statsABI,
      functionName: 'getTotalEscrowAmount'
    });
    console.log(`✅ Total Escrow Amount: ${totalEscrowAmount.toString()} wei (${(Number(totalEscrowAmount) / 1e18).toFixed(2)} tokens)`);

    console.log('\n=========================================');
    console.log('📋 Platform Statistics Summary:');
    console.log(`   Users: ${totalUsers.toString()}`);
    console.log(`   Businesses: ${totalBusinesses.toString()}`);
    console.log(`   Creators: ${totalInfluencers.toString()}`);
    console.log(`   Escrow: ${(Number(totalEscrowAmount) / 1e18).toFixed(2)} tokens`);
    
    // Check if businesses and creators are 0
    if (totalBusinesses.toString() === '0') {
      console.log('\n⚠️  WARNING: Total Businesses is 0!');
      console.log('   This might indicate:');
      console.log('   - No businesses have registered yet');
      console.log('   - The function is not working correctly');
      console.log('   - The contract state is not properly tracking businesses');
    }
    
    if (totalInfluencers.toString() === '0') {
      console.log('\n⚠️  WARNING: Total Influencers is 0!');
      console.log('   This might indicate:');
      console.log('   - No influencers have registered yet');
      console.log('   - The function is not working correctly');
      console.log('   - The contract state is not properly tracking influencers');
    }

    if (totalUsers.toString() !== '0' && (totalBusinesses.toString() === '0' || totalInfluencers.toString() === '0')) {
      console.log('\n🤔 INVESTIGATION NEEDED:');
      console.log('   Total users exists but businesses/influencers are 0');
      console.log('   This suggests the contract might not be properly categorizing users');
      console.log('   or the counting functions need to be implemented/fixed');
    }

  } catch (error) {
    console.error('❌ Error testing platform stats:', error);
  }
}

// Run the test
testPlatformStats().catch(console.error);