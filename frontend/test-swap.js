// Quick test script to verify Mento Protocol connectivity
import { providers } from 'ethers';
import { Mento } from '@mento-protocol/mento-sdk';

async function testMentoConnection() {
  console.log('🧪 Testing Mento Protocol Connection...');
  console.log('=====================================');
  
  const rpcUrls = [
    'https://celo-mainnet.g.alchemy.com/v2/qMj263vOQ9uKwIE4R9s3638-8zRBds9t',
    'https://forno.celo.org',
    'https://rpc.ankr.com/celo'
  ];
  
  for (const rpcUrl of rpcUrls) {
    try {
      console.log(`\n🔍 Testing RPC: ${rpcUrl}`);
      
      // Test basic RPC connection
      const provider = new providers.JsonRpcProvider(rpcUrl);
      const network = await provider.getNetwork();
      console.log(`✅ RPC connected. Network: ${network.name}, ChainId: ${network.chainId}`);
      
      // Test Mento SDK creation
      console.log('🚀 Testing Mento SDK...');
      const mento = await Mento.create(provider);
      console.log('✅ Mento SDK created successfully');
      
      // Test getting exchanges
      console.log('📊 Getting exchanges...');
      const exchanges = await mento.getExchanges();
      console.log(`✅ Found ${exchanges.length} exchanges`);
      
      if (exchanges.length > 0) {
        console.log('📋 Sample exchanges:');
        exchanges.slice(0, 3).forEach((exchange, i) => {
          console.log(`  ${i + 1}. Exchange ID: ${exchange.id}, Assets: ${exchange.assets.length}`);
        });
      }
      
      // Test getting a quote (cUSD -> cEUR)
      console.log('💰 Testing quote: 1 cUSD -> cEUR...');
      try {
        const cUSD = '0x765DE816845861e75A25fCA122bb6898B8B1282a';
        const cEUR = '0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73';
        const oneToken = '1000000000000000000'; // 1 token in wei
        
        const quote = await mento.getAmountOut(cUSD, cEUR, oneToken);
        const rate = Number(quote.toString()) / 1e18;
        console.log(`✅ Quote: 1 cUSD = ${rate.toFixed(6)} cEUR`);
        
        console.log('🎉 All tests passed! Swap functionality should work.');
        return true;
      } catch (quoteError) {
        console.error('❌ Quote test failed:', quoteError.message);
        return false;
      }
      
    } catch (error) {
      console.error(`❌ Failed with ${rpcUrl}:`, error.message);
      continue;
    }
  }
  
  console.error('❌ All RPC endpoints failed');
  return false;
}

// Run the test
testMentoConnection().catch(console.error);