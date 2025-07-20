// Test if getTotalEscrowAmount function exists
import { createPublicClient, http } from 'viem';
import { celo } from 'viem/chains';

const CONTRACT_ADDRESS = '0xe66b437DE9fbd724c59c635ABeB943f9d4c09677';
const RPC_URL = 'https://forno.celo.org';

const publicClient = createPublicClient({
  chain: celo,
  transport: http(RPC_URL)
});

const testABI = [
  {
    name: 'getTotalEscrowAmount',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }]
  }
];

async function testEscrowFunction() {
  console.log('🧪 Testing getTotalEscrowAmount Function');
  console.log('====================================');
  
  try {
    const totalEscrowAmount = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: testABI,
      functionName: 'getTotalEscrowAmount'
    });
    console.log(`✅ getTotalEscrowAmount(): ${totalEscrowAmount.toString()} wei`);
    console.log(`   In tokens: ${(Number(totalEscrowAmount) / 1e18).toFixed(2)}`);
    
  } catch (error) {
    console.log(`❌ getTotalEscrowAmount(): ${error.message.split('\\n')[0]}`);
    console.log('   This function also doesn\'t exist in the diamond contract');
  }
}

testEscrowFunction().catch(console.error);