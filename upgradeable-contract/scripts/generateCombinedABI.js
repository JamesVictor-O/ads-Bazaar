const fs = require('fs');
const path = require('path');

// Read the ABI files
const gettersFacetPath = path.join(__dirname, '../out/GettersFacet.sol/GettersFacet.json');
const userManagementFacetPath = path.join(__dirname, '../out/UserManagementFacet.sol/UserManagementFacet.json');
const campaignManagementFacetPath = path.join(__dirname, '../out/CampaignManagementFacet.sol/CampaignManagementFacet.json');
const applicationManagementFacetPath = path.join(__dirname, '../out/ApplicationManagementFacet.sol/ApplicationManagementFacet.json');
const paymentManagementFacetPath = path.join(__dirname, '../out/PaymentManagementFacet.sol/PaymentManagementFacet.json');
const proofManagementFacetPath = path.join(__dirname, '../out/ProofManagementFacet.sol/ProofManagementFacet.json');
const disputeManagementFacetPath = path.join(__dirname, '../out/DisputeManagementFacet.sol/DisputeManagementFacet.json');
const selfVerificationFacetPath = path.join(__dirname, '../out/SelfVerificationFacet.sol/SelfVerificationFacet.json');
const multiCurrencyCampaignFacetPath = path.join(__dirname, '../out/MultiCurrencyCampaignFacet.sol/MultiCurrencyCampaignFacet.json');
const multiCurrencyPaymentFacetPath = path.join(__dirname, '../out/MultiCurrencyPaymentFacet.sol/MultiCurrencyPaymentFacet.json');

const gettersFacetABI = JSON.parse(fs.readFileSync(gettersFacetPath, 'utf8')).abi;
const userManagementFacetABI = JSON.parse(fs.readFileSync(userManagementFacetPath, 'utf8')).abi;
const campaignManagementFacetABI = JSON.parse(fs.readFileSync(campaignManagementFacetPath, 'utf8')).abi;
const applicationManagementFacetABI = JSON.parse(fs.readFileSync(applicationManagementFacetPath, 'utf8')).abi;
const paymentManagementFacetABI = JSON.parse(fs.readFileSync(paymentManagementFacetPath, 'utf8')).abi;
const proofManagementFacetABI = JSON.parse(fs.readFileSync(proofManagementFacetPath, 'utf8')).abi;
const disputeManagementFacetABI = JSON.parse(fs.readFileSync(disputeManagementFacetPath, 'utf8')).abi;
const selfVerificationFacetABI = JSON.parse(fs.readFileSync(selfVerificationFacetPath, 'utf8')).abi;
const multiCurrencyCampaignFacetABI = JSON.parse(fs.readFileSync(multiCurrencyCampaignFacetPath, 'utf8')).abi;
const multiCurrencyPaymentFacetABI = JSON.parse(fs.readFileSync(multiCurrencyPaymentFacetPath, 'utf8')).abi;

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

// Campaign Management functions that don't need currency-specific versions
// (These work with any currency automatically)
const requiredCampaignManagementFunctions = [
  'completeCampaign',
  'expireCampaign', 
  'startCampaignWithPartialSelection',
  'cancelCampaignWithCompensation'
];

const filteredCampaignManagementFunctions = campaignManagementFacetABI.filter(item => 
  (item.type === 'function' && requiredCampaignManagementFunctions.includes(item.name)) ||
  item.type === 'event'
);

// Filter the required functions from ApplicationManagementFacet
const requiredApplicationManagementFunctions = [
  'applyToBrief',
  'selectInfluencer'
];

const filteredApplicationManagementFunctions = applicationManagementFacetABI.filter(item => 
  (item.type === 'function' && requiredApplicationManagementFunctions.includes(item.name)) ||
  item.type === 'event'
);

// Note: Legacy PaymentManagementFacet functions are no longer included
// All payment management is now handled by MultiCurrencyPaymentFacet
const filteredPaymentManagementFunctions = [];

// Filter the required functions from ProofManagementFacet
const requiredProofManagementFunctions = [
  'submitProof',
  'approveProof',
  'flagSubmission',
  'triggerAutoApproval'
];

const filteredProofManagementFunctions = proofManagementFacetABI.filter(item => 
  (item.type === 'function' && requiredProofManagementFunctions.includes(item.name)) ||
  item.type === 'event'
);

// Filter the required functions from DisputeManagementFacet
const requiredDisputeManagementFunctions = [
  'raiseDispute',
  'resolveDispute',
  'expireDispute',
  'getDisputeTimestamp',
  'hasPendingDisputes',
  'getPendingDisputeCount'
];

const filteredDisputeManagementFunctions = disputeManagementFacetABI.filter(item => 
  (item.type === 'function' && requiredDisputeManagementFunctions.includes(item.name)) ||
  item.type === 'event'
);

// Filter the required functions from SelfVerificationFacet
const requiredSelfVerificationFunctions = [
  'verifySelfProof',
  'isInfluencerVerified'
];

const filteredSelfVerificationFunctions = selfVerificationFacetABI.filter(item => 
  (item.type === 'function' && requiredSelfVerificationFunctions.includes(item.name)) ||
  item.type === 'event'
);

// Filter the required functions from MultiCurrencyCampaignFacet
const requiredMultiCurrencyCampaignFunctions = [
  'createAdBriefWithToken',
  'cancelAdBriefWithToken',
  'cancelCampaignWithCompensation',
  'completeCampaignWithToken', 
  'expireCampaignWithToken',
  'getSupportedTokens',
  'isTokenSupported',
  'getSupportedTokensInfo',
  'getCampaignStatsByCurrency'
];

const filteredMultiCurrencyCampaignFunctions = multiCurrencyCampaignFacetABI.filter(item => 
  (item.type === 'function' && requiredMultiCurrencyCampaignFunctions.includes(item.name)) ||
  item.type === 'event'
);

// Filter the required functions from MultiCurrencyPaymentFacet
const requiredMultiCurrencyPaymentFunctions = [
  'claimPaymentsInToken',
  'claimAllPendingPayments',
  'getMultiCurrencyPendingPayments',
  'getTotalMultiCurrencyPendingAmount',
  'getAllPendingPayments',
  'convertCurrency',
  'getExchangeRate'
];

const filteredMultiCurrencyPaymentFunctions = multiCurrencyPaymentFacetABI.filter(item => 
  (item.type === 'function' && requiredMultiCurrencyPaymentFunctions.includes(item.name)) ||
  item.type === 'event'
);

// Combine the ABIs
const combinedABI = [
  ...filteredGettersFunctions,
  ...filteredUserManagementFunctions,
  ...filteredCampaignManagementFunctions,
  ...filteredApplicationManagementFunctions,
  ...filteredPaymentManagementFunctions,
  ...filteredProofManagementFunctions,
  ...filteredDisputeManagementFunctions,
  ...filteredSelfVerificationFunctions,
  ...filteredMultiCurrencyCampaignFunctions,
  ...filteredMultiCurrencyPaymentFunctions
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