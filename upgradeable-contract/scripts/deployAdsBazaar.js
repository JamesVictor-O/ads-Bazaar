const { deployDiamond } = require('./libraries/diamond.js')

async function deployAdsBazaar() {
  // Deploy diamond with AdsBazaar facets
  const diamond = await deployDiamond()
  
  console.log('\n=== ADSBAZAAR DIAMOND DEPLOYMENT ===')
  console.log('Diamond deployed:', diamond.address)
  
  // Log the diamond address and facets
  console.log('\nAdsBazaar Diamond is now ready for use!')
  console.log('Contract address:', diamond.address)
  
  return diamond.address
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
if (require.main === module) {
  deployAdsBazaar()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error)
      process.exit(1)
    })
}

exports.deployAdsBazaar = deployAdsBazaar