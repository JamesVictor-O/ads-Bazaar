const fs = require('fs');
const path = require('path');

// Read the combined ABI
const combinedABIPath = path.join(__dirname, '../combined-abi/AdsBazaarDiamond_ABI_only.json');
const combinedABI = JSON.parse(fs.readFileSync(combinedABIPath, 'utf8'));

// Required functions from the user's request
const requiredFromGetters = [
  'isUsernameAvailable',
  'getUserUsername', 
  'getUserByUsername',
  'getUsers',
  'getInfluencerProfile'
];

const requiredFromUserManagement = [
  'registerUser',
  'updateInfluencerProfile'
];

// All functions in the ABI
const functions = combinedABI.filter(item => item.type === 'function');
const events = combinedABI.filter(item => item.type === 'event');

console.log('=== COMBINED ABI VERIFICATION ===\n');

console.log('✅ REQUIRED FUNCTIONS FROM GETTERSFACET:');
requiredFromGetters.forEach(funcName => {
  const found = functions.find(f => f.name === funcName);
  if (found) {
    console.log(`✓ ${funcName} - Found`);
    if (funcName === 'registerUser') {
      console.log(`   Parameters: ${found.inputs.map(i => i.type).join(', ')}`);
    }
  } else {
    console.log(`✗ ${funcName} - Missing`);
  }
});

console.log('\n✅ REQUIRED FUNCTIONS FROM USERMANAGEMENTFACET:');
requiredFromUserManagement.forEach(funcName => {
  const found = functions.find(f => f.name === funcName);
  if (found) {
    console.log(`✓ ${funcName} - Found`);
    if (funcName === 'registerUser') {
      console.log(`   Parameters: ${found.inputs.map(i => i.type).join(', ')}`);
      console.log(`   Parameter count: ${found.inputs.length}`);
    }
  } else {
    console.log(`✗ ${funcName} - Missing`);
  }
});

console.log('\n📊 SUMMARY:');
console.log(`Total functions: ${functions.length}`);
console.log(`Total events: ${events.length}`);

console.log('\n📋 ALL FUNCTIONS IN COMBINED ABI:');
functions.forEach((func, index) => {
  const params = func.inputs.map(i => i.type).join(', ');
  console.log(`${index + 1}. ${func.name}(${params}) - ${func.stateMutability}`);
});

console.log('\n🎯 EVENTS:');
events.forEach((event, index) => {
  console.log(`${index + 1}. ${event.name}`);
});

// Verify registerUser has 4 parameters (with username)
const registerUserFunc = functions.find(f => f.name === 'registerUser');
if (registerUserFunc) {
  console.log('\n🔍 REGISTER USER FUNCTION DETAILS:');
  console.log(`Parameters: ${registerUserFunc.inputs.length}`);
  registerUserFunc.inputs.forEach((input, index) => {
    console.log(`  ${index + 1}. ${input.name} (${input.type})`);
  });
  
  if (registerUserFunc.inputs.length === 4 && 
      registerUserFunc.inputs.some(i => i.name === '_username')) {
    console.log('✅ registerUser has correct 4-parameter signature with username!');
  } else {
    console.log('❌ registerUser does not have the expected 4-parameter signature');
  }
}