const fs = require('fs');
const path = require('path');

// Read the ABI files
const gettersFacetPath = path.join(__dirname, '../out/GettersFacet.sol/GettersFacet.json');
const userManagementFacetPath = path.join(__dirname, '../out/UserManagementFacet.sol/UserManagementFacet.json');

const gettersFacetABI = JSON.parse(fs.readFileSync(gettersFacetPath, 'utf8')).abi;
const userManagementFacetABI = JSON.parse(fs.readFileSync(userManagementFacetPath, 'utf8')).abi;

// Filter the required functions from GettersFacet
const requiredGetterFunctions = [
  'isUsernameAvailable',
  'getUserUsername',
  'getUserByUsername',
  'getUsers',
  'getInfluencerProfile',
  'getAdBrief',
  'getAllBriefs',
  'getBriefApplications',
  'getBusinessBriefs',
  'getBusinessStats',
  'getCUSD',
  'getInfluencerApplications',
  'getInfluencerStats',
  'getOwner',
  'getPlatformFeePercentage',
  'getTotalBusinesses',
  'getTotalEscrowAmount',
  'getTotalInfluencers',
  'getTotalUsers',
  'getUserStatus',
  'isRegistered',
  'isInfluencer'
];

const filteredGettersFunctions = gettersFacetABI.filter(item => 
  item.type === 'function' && requiredGetterFunctions.includes(item.name)
);

// Filter the required functions from UserManagementFacet
const requiredUserManagementFunctions = [
  'registerUser',
  'updateInfluencerProfile'
];

const filteredUserManagementFunctions = userManagementFacetABI.filter(item => 
  (item.type === 'function' && requiredUserManagementFunctions.includes(item.name)) ||
  item.type === 'event'
);

// Combine the ABIs
const combinedABI = [
  ...filteredGettersFunctions,
  ...filteredUserManagementFunctions
];

// Sort functions alphabetically for easier lookup
combinedABI.sort((a, b) => {
  if (a.type === b.type) {
    return (a.name || '').localeCompare(b.name || '');
  }
  // Events last
  if (a.type === 'event') return 1;
  if (b.type === 'event') return -1;
  return 0;
});

// Create the output
const output = {
  contractName: "AdsBazaarDiamond",
  abi: combinedABI
};

// Write the combined ABI to a file
const outputPath = path.join(__dirname, '../combined-abi/AdsBazaarDiamond.json');
const outputDir = path.dirname(outputPath);

// Create directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

console.log('Combined ABI generated successfully!');
console.log(`Output file: ${outputPath}`);
console.log(`Total functions: ${combinedABI.filter(item => item.type === 'function').length}`);
console.log(`Total events: ${combinedABI.filter(item => item.type === 'event').length}`);

// Also output just the ABI array for easy copying
const abiOnlyPath = path.join(__dirname, '../combined-abi/AdsBazaarDiamond_ABI_only.json');
fs.writeFileSync(abiOnlyPath, JSON.stringify(combinedABI, null, 2));

console.log(`\nABI array only saved to: ${abiOnlyPath}`);