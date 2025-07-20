// Final test of platform statistics to confirm they're working
import { createPublicClient, http } from 'viem';
import { celo } from 'viem/chains';

const CONTRACT_ADDRESS = '0xe66b437DE9fbd724c59c635ABeB943f9d4c09677';
const RPC_URL = 'https://forno.celo.org';

const publicClient = createPublicClient({
  chain: celo,
  transport: http(RPC_URL)
});

// Complete ABI for all platform stats functions
const platformStatsABI = [
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

function formatNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

async function testFinalPlatformStats() {
  console.log('🏆 Final Platform Statistics Test');
  console.log('=================================');
  console.log(`Contract: ${CONTRACT_ADDRESS}`);
  console.log(`Network: Celo Mainnet (${celo.id})`);
  console.log('');
  
  try {
    // Test all four platform statistics functions
    const [totalUsers, totalBusinesses, totalInfluencers, totalEscrowAmount] = await Promise.all([
      publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: platformStatsABI,
        functionName: 'getTotalUsers'
      }),
      publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: platformStatsABI,
        functionName: 'getTotalBusinesses'
      }),
      publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: platformStatsABI,
        functionName: 'getTotalInfluencers'
      }),
      publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: platformStatsABI,
        functionName: 'getTotalEscrowAmount'
      })
    ]);

    // Display results as they would appear on the landing page
    console.log('📊 Platform Metrics (Landing Page Display):');
    console.log('==========================================');
    
    const stats = [
      {
        value: formatNumber(Number(totalUsers)),
        label: "Total Users",
        icon: "👥",
        actual: totalUsers.toString()
      },
      {
        value: formatNumber(Number(totalBusinesses)),
        label: "Businesses", 
        icon: "🏢",
        actual: totalBusinesses.toString()
      },
      {
        value: formatNumber(Number(totalInfluencers)),
        label: "Creators",
        icon: "⭐",
        actual: totalInfluencers.toString()
      },
      {
        value: `$${formatNumber(Number(totalEscrowAmount) / 1e18)}`,
        label: "Active Escrow",
        icon: "💰",
        actual: `${(Number(totalEscrowAmount) / 1e18).toFixed(2)} tokens`
      }
    ];

    stats.forEach(stat => {
      console.log(`${stat.icon} ${stat.label}: ${stat.value} (${stat.actual})`);
    });

    console.log('');
    console.log('✅ All platform statistics functions are working!');
    console.log('✅ Landing page metrics will update in real-time!');
    console.log('✅ As users register, the counts will automatically increase!');
    
    if (Number(totalUsers) > 0) {
      console.log('');
      console.log('🎯 Current Platform State:');
      if (Number(totalBusinesses) > 0) {
        console.log(`   • ${totalBusinesses} business(es) registered`);
      }
      if (Number(totalInfluencers) > 0) {
        console.log(`   • ${totalInfluencers} creator(s) registered`);
      }
      if (Number(totalEscrowAmount) > 0) {
        console.log(`   • $${(Number(totalEscrowAmount) / 1e18).toFixed(2)} in active escrow`);
      } else {
        console.log('   • No active campaigns with escrow yet');
      }
    }

  } catch (error) {
    console.error('❌ Error testing platform stats:', error);
  }
}

// Run the final test
testFinalPlatformStats().catch(console.error);