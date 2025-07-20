const { getSelectors, FacetCutAction } = require('./libraries/diamond.js')
const { ethers } = require('hardhat')
async function deployDiamond() {
  const accounts = await ethers.getSigners()
  const contractOwner = accounts[0]

  // deploy DiamondCutFacet
  const DiamondCutFacet = await ethers.getContractFactory('DiamondCutFacet')
  const diamondCutFacet = await DiamondCutFacet.deploy()
  await diamondCutFacet.deployed()
  console.log('DiamondCutFacet deployed:', diamondCutFacet.address)

  // deploy Diamond
  const Diamond = await ethers.getContractFactory('Diamond')
  const diamond = await Diamond.deploy(
    contractOwner.address,
    diamondCutFacet.address,
  )
  await diamond.deployed()
  console.log('Diamond deployed:', diamond.address)

  // deploy AdsBazaarInit
  // AdsBazaarInit provides a function that is called when the diamond is upgraded to initialize state variables
  // Read about how the diamondCut function works here: https://eips.ethereum.org/EIPS/eip-2535#addingreplacingremoving-functions
  const AdsBazaarInit = await ethers.getContractFactory('AdsBazaarInit')
  const adsBazaarInit = await AdsBazaarInit.deploy()
  await adsBazaarInit.deployed()
  console.log('AdsBazaarInit deployed:', adsBazaarInit.address)

  // deploy facets
  console.log('')
  console.log('Deploying standard diamond facets')
  const StandardFacetNames = ['DiamondLoupeFacet', 'OwnershipFacet']
  const cut = []
  for (const FacetName of StandardFacetNames) {
    const Facet = await ethers.getContractFactory(FacetName)
    const facet = await Facet.deploy()
    await facet.deployed()
    console.log(`${FacetName} deployed: ${facet.address}`)
    cut.push({
      facetAddress: facet.address,
      action: FacetCutAction.Add,
      functionSelectors: getSelectors(facet),
    })
  }

  // deploy AdsBazaar facets
  console.log('')
  console.log('Deploying AdsBazaar facets')
  const AdsBazaarFacetNames = [
    'UserManagementFacet',
    'CampaignManagementFacet', 
    'ApplicationManagementFacet',
    'ProofManagementFacet',
    'PaymentManagementFacet',
    'DisputeManagementFacet',
    'GettersFacet',
    'MultiCurrencyPaymentFacet',
    'MultiCurrencyCampaignFacet'
  ]
  
  for (const FacetName of AdsBazaarFacetNames) {
    const Facet = await ethers.getContractFactory(FacetName)
    const facet = await Facet.deploy()
    await facet.deployed()
    console.log(`${FacetName} deployed: ${facet.address}`)
    cut.push({
      facetAddress: facet.address,
      action: FacetCutAction.Add,
      functionSelectors: getSelectors(facet),
    })
  }

  // upgrade diamond with facets
  console.log('')
  console.log('Diamond Cut:', cut)
  const diamondCut = await ethers.getContractAt('IDiamondCut', diamond.address)
  let tx
  let receipt
  // call to init function - initialize with all required parameters
  const owner = contractOwner.address
  const cUSD = '0x765DE816845861e75A25fCA122bb6898B8B1282a' // Celo mainnet cUSD
  const platformFeePercentage = 100 // 1% (100 basis points)
  const identityVerificationHub = '0x77117D60eaB7C044e785D68edB6C7E0e134970Ea'
  const scope = process.env.HASHED_SCOPE || '8842010690511844304671443815706539493229053006563555412648726180531649441904'
  const attestationIds = [1] // For passport verification
  
  let functionCall = adsBazaarInit.interface.encodeFunctionData('init', [
    owner, 
    cUSD, 
    platformFeePercentage,
    identityVerificationHub,
    scope,
    attestationIds
  ])
  tx = await diamondCut.diamondCut(cut, adsBazaarInit.address, functionCall)
  console.log('Diamond cut tx: ', tx.hash)
  receipt = await tx.wait()
  if (!receipt.status) {
    throw Error(`Diamond upgrade failed: ${tx.hash}`)
  }
  console.log('Completed diamond cut')
  return diamond.address
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
if (require.main === module) {
  deployDiamond()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}

exports.deployDiamond = deployDiamond
