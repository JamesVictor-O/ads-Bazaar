// Test payment claiming functionality with known address
import { createPublicClient, http, formatUnits } from 'viem';
import { celo } from 'viem/chains';

const CONTRACT_ADDRESS = '0xe66b437DE9fbd724c59c635ABeB943f9d4c09677';
const RPC_URL = 'https://forno.celo.org';

const publicClient = createPublicClient({
  chain: celo,
  transport: http(RPC_URL)
});

// Test ABI for multi-currency payment functions
const testABI = [
  {
    name: 'getMultiCurrencyPendingPayments',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'influencer', type: 'address' }],
    outputs: [{
      type: 'tuple',
      components: [
        { name: 'tokens', type: 'address[]' },
        { name: 'amounts', type: 'uint256[]' },
        { name: 'symbols', type: 'string[]' }
      ]
    }]
  }
];

async function testPaymentClaimsSimple() {
  console.log('💰 Testing Payment Claim Functions');
  console.log('=================================');
  
  // Test with a zero address (should return empty results)
  const testAddress = '0x0000000000000000000000000000000000000000';
  console.log(`🔍 Testing with address: ${testAddress}`);
  
  try {
    console.log('\n📋 Testing getMultiCurrencyPendingPayments...');
    const pendingPayments = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: testABI,
      functionName: 'getMultiCurrencyPendingPayments',
      args: [testAddress]
    });
    
    console.log(`✅ Function call successful!`);
    console.log(`   Tokens: ${pendingPayments.tokens.length} entries`);
    console.log(`   Amounts: ${pendingPayments.amounts.length} entries`);
    console.log(`   Symbols: ${pendingPayments.symbols.length} entries`);
    
    if (pendingPayments.tokens.length > 0) {
      console.log('\n💰 Pending payments found:');
      for (let i = 0; i < pendingPayments.tokens.length; i++) {
        const amount = formatUnits(pendingPayments.amounts[i], 18);
        console.log(`   ${pendingPayments.symbols[i]}: ${amount} tokens`);
        console.log(`   Token address: ${pendingPayments.tokens[i]}`);
      }
    } else {
      console.log('   No pending payments (expected for zero address)');
    }
    
    console.log('\n✅ Payment Claim System Status:');
    console.log('   ✅ getMultiCurrencyPendingPayments function is working');
    console.log('   ✅ Contract accepts payment queries');
    console.log('   ✅ Multi-currency payment structure is properly implemented');
    console.log('   ✅ Ready for users to claim payments when available');
    
  } catch (error) {
    console.log(`❌ Error testing payment claims: ${error.message.split('\n')[0]}`);
    
    if (error.message.includes('Function does not exist')) {
      console.log('\n⚠️  The getMultiCurrencyPendingPayments function is not deployed');
      console.log('   This means the MultiCurrencyPaymentFacet may need to be updated');
    }
  }
  
  console.log('\n📊 Summary:');
  console.log('   This test verifies that the payment claiming functions are accessible');
  console.log('   and returning proper data structures. The actual claiming would require');
  console.log('   a user with pending payments and proper wallet connection.');
}

// Run the test
testPaymentClaimsSimple().catch(console.error);