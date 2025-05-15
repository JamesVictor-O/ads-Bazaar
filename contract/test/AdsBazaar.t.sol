// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

import "forge-std/Test.sol";
import "../src/AdsBazaar.sol";
import "openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";


contract MockCUSD is ERC20 {
    constructor() ERC20("Mock cUSD", "cUSD") {
        _mint(msg.sender, 1000000 * 10**18); // Mint 1 million tokens
    }

    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }
}

contract AdsBazaarTest is Test {
    AdsBazaar public adsBazaar;
    MockCUSD public cUSD;
    
    address public owner = address(1);
    address public business1 = address(2);
    address public business2 = address(3);
    address public influencer1 = address(4);
    address public influencer2 = address(5);
    address public influencer3 = address(6);
    
    uint256 public constant INITIAL_BALANCE = 10000 * 10**18; // 10,000 cUSD
    bytes32 public briefId;
    
    function setUp() public {
        vm.startPrank(owner);
        cUSD = new MockCUSD();
        adsBazaar = new AdsBazaar(address(cUSD));
        vm.stopPrank();
        
        
        fundAccount(business1);
        fundAccount(business2);
        fundAccount(influencer1);
        fundAccount(influencer2);
        fundAccount(influencer3);
    }
    
    function fundAccount(address account) internal {
        vm.startPrank(owner);
        cUSD.transfer(account, INITIAL_BALANCE);
        vm.stopPrank();
    }

    function testRegistration() public {
        // Register business1 as business
        vm.startPrank(business1);
        adsBazaar.registerUser(true, false, '{"name": "Business One", "website": "business1.com"}');
        
        // Verify registration
        (bool isRegistered, bool isBusiness, bool isInfluencer, string memory profileData) = adsBazaar.users(business1);
        assertTrue(isRegistered);
        assertTrue(isBusiness);
        assertFalse(isInfluencer);
        vm.stopPrank();
        
        // Register influencer1 as influencer
        vm.startPrank(influencer1);
        adsBazaar.registerUser(false, true, '{"name": "Influencer One", "followers": 10000}');
        
        // Verify registration
        (isRegistered, isBusiness, isInfluencer, profileData) = adsBazaar.users(influencer1);
        assertTrue(isRegistered);
        assertFalse(isBusiness);
        assertTrue(isInfluencer);
        vm.stopPrank();
    }

    // Test that user cannot register as both business and influencer
    function testCannotRegisterAsBoth() public {
        vm.startPrank(business1);
        vm.expectRevert("Cannot be both business and influencer");
        adsBazaar.registerUser(true, true, '{"name": "Invalid Registration"}');
        vm.stopPrank();
    }
    
    function testCompleteUserFlow() public {
        // 1. Register users and create brief
        _setupUsersAndCreateBrief();
        
        // 2. Apply to brief and select influencers
        _applyAndSelectInfluencers();
        
        // 3. Submit proofs and complete campaign
        _submitProofsAndComplete();
        
        // 4. Claim payments
        _claimPayments();
    }
    
    // Helper function for step 1 of the user flow
    function _setupUsersAndCreateBrief() internal {
        // Register users
        vm.prank(business1);
        adsBazaar.registerUser(true, false, '{"name": "Business One"}');
        
        vm.prank(influencer1);
        adsBazaar.registerUser(false, true, '{"name": "Influencer One"}');
        
        vm.prank(influencer2);
        adsBazaar.registerUser(false, true, '{"name": "Influencer Two"}');
        
        // Business creates ad brief
        uint256 budget = 1000 * 10**18; // 1000 cUSD
        uint256 applicationDeadline = block.timestamp + 1 days;
        uint256 promotionDuration = 7 days;
        uint256 maxInfluencers = 2;
        uint8 targetAudience = uint8(AdsBazaar.TargetAudience.TECH);
        uint256 verificationPeriod = 2 days;
        
        vm.startPrank(business1);
        cUSD.approve(address(adsBazaar), budget);
        adsBazaar.createAdBrief(
            "First Campaign",
            "Test Ad Campaign",
            budget,
            applicationDeadline,
            promotionDuration,
            maxInfluencers,
            targetAudience,
            verificationPeriod
        );
        vm.stopPrank();
        
        // Get the brief ID (first in business1's list)
        bytes32[] memory briefs = adsBazaar.getBusinessBriefs(business1);
        assertEq(briefs.length, 1);
        briefId = briefs[0];
    }
    
    // Helper function for step 2 of the user flow
    function _applyAndSelectInfluencers() internal {
        // Influencers apply to the brief
        vm.prank(influencer1);
        adsBazaar.applyToBrief(briefId, "I would like to promote your product");
        
        vm.prank(influencer2);
        adsBazaar.applyToBrief(briefId, "I have great reach in your target market");
        
        // Verify applications
        AdsBazaar.ApplicationData memory appData = adsBazaar.getBriefApplications(briefId);
        assertEq(appData.influencers.length, 2);
        assertEq(appData.influencers[0], influencer1);
        assertEq(appData.influencers[1], influencer2);
        
        // Business selects influencers
        vm.startPrank(business1);
        adsBazaar.selectInfluencer(briefId, 0); // Select influencer1
        adsBazaar.selectInfluencer(briefId, 1); // Select influencer2
        vm.stopPrank();
        
        // Verify brief status changed to ASSIGNED
        AdsBazaar.BriefData memory briefData = adsBazaar.getAdBrief(briefId);
        assertEq(uint256(briefData.status), uint256(AdsBazaar.Status.ASSIGNED));
        assertEq(briefData.selectedInfluencersCount, 2);
        assertTrue(briefData.promotionStartTime > 0);
        assertEq(briefData.promotionEndTime, briefData.promotionStartTime + briefData.promotionDuration);
        assertEq(briefData.verificationDeadline, briefData.promotionEndTime + 2 days);
    }
    
    // Helper function for step 3 of the user flow
    function _submitProofsAndComplete() internal {
        // Influencers submit proof of promotion
        vm.prank(influencer1);
        adsBazaar.submitProof(briefId, "https://social.com/proof1");
        
        vm.prank(influencer2);
        adsBazaar.submitProof(briefId, "https://social.com/proof2");
        
        // Get promotion end time
        AdsBazaar.BriefData memory briefData = adsBazaar.getAdBrief(briefId);
        
        // Wait for promotion period to end
        vm.warp(briefData.promotionEndTime + 1);
        
        // Business completes the campaign
        uint256 ownerBalanceBefore = cUSD.balanceOf(owner);
        
        vm.prank(business1);
        adsBazaar.completeCampaign(briefId);
        
        // Verify brief status changed to COMPLETED
        briefData = adsBazaar.getAdBrief(briefId);
        assertEq(uint256(briefData.status), uint256(AdsBazaar.Status.COMPLETED));
        
        // Verify platform fees were transferred to owner
        uint256 platformFeePercentage = adsBazaar.platformFeePercentage();
        uint256 expectedFeePerInfluencer = (briefData.budget / 2 * platformFeePercentage) / 1000;
        assertEq(cUSD.balanceOf(owner), ownerBalanceBefore + (expectedFeePerInfluencer * 2));
        
        // Verify pending payments for influencers
        uint256 expectedPaymentPerInfluencer = (briefData.budget / 2) - expectedFeePerInfluencer;
        
        // Check pending payments for influencer1
        uint256 pendingAmount1 = adsBazaar.getTotalPendingAmount(influencer1);
        assertEq(pendingAmount1, expectedPaymentPerInfluencer);
        
        // Check pending payments for influencer2
        uint256 pendingAmount2 = adsBazaar.getTotalPendingAmount(influencer2);
        assertEq(pendingAmount2, expectedPaymentPerInfluencer);
        
        // Check that applications were marked as approved
        AdsBazaar.ApplicationData memory appData = adsBazaar.getBriefApplications(briefId);
        assertTrue(appData.isApproved[0]);
        assertTrue(appData.isApproved[1]);
    }
    
    //  helper function for claiming payments
    function _claimPayments() internal {
        // Get balances before claiming
        uint256 influencer1BalanceBefore = cUSD.balanceOf(influencer1);
        uint256 influencer2BalanceBefore = cUSD.balanceOf(influencer2);
        
        // Get expected payment amounts
        uint256 pendingAmount1 = adsBazaar.getTotalPendingAmount(influencer1);
        uint256 pendingAmount2 = adsBazaar.getTotalPendingAmount(influencer2);
        
        // Influencer1 claims payment
        vm.prank(influencer1);
        adsBazaar.claimPayments();
        
        // Verify payment was received and pending amount was reset
        assertEq(cUSD.balanceOf(influencer1), influencer1BalanceBefore + pendingAmount1);
        assertEq(adsBazaar.getTotalPendingAmount(influencer1), 0);
        
        // Verify the application is marked as claimed
        AdsBazaar.ApplicationData memory appData = adsBazaar.getBriefApplications(briefId);
        assertTrue(appData.hasClaimed[0]);
        
        // Influencer2 claims payment
        vm.prank(influencer2);
        adsBazaar.claimPayments();
        
        // Verify payment was received and pending amount was reset
        assertEq(cUSD.balanceOf(influencer2), influencer2BalanceBefore + pendingAmount2);
        assertEq(adsBazaar.getTotalPendingAmount(influencer2), 0);
        
        // Verify the application is marked as claimed
        appData = adsBazaar.getBriefApplications(briefId);
        assertTrue(appData.hasClaimed[1]);
    }
    
    // Test cancelling a brief
    function testCancelAdBrief() public {
        // Register business
        vm.prank(business1);
        adsBazaar.registerUser(true, false, '{"name": "Business One"}');
        
        // Create ad brief
        uint256 budget = 500 * 10**18;
        uint256 applicationDeadline = block.timestamp + 1 days;
        uint8 targetAudience = uint8(AdsBazaar.TargetAudience.FASHION);
        uint256 verificationPeriod = 2 days;
        
        vm.startPrank(business1);
        cUSD.approve(address(adsBazaar), budget);
        adsBazaar.createAdBrief(
            "New camp",
            "Campaign to Cancel",
            budget,
            applicationDeadline,
            7 days,
            2,
            targetAudience,
            verificationPeriod
        );
        
        // Get the brief ID
        bytes32[] memory briefs = adsBazaar.getBusinessBriefs(business1);
        briefId = briefs[0];
        
        // Check business balance before cancellation
        uint256 balanceBefore = cUSD.balanceOf(business1);
        
        // Cancel the brief
        adsBazaar.cancelAdBrief(briefId);
        vm.stopPrank();
        
        // Verify brief status is CANCELLED
        AdsBazaar.BriefData memory briefData = adsBazaar.getAdBrief(briefId);
        assertEq(uint256(briefData.status), uint256(AdsBazaar.Status.CANCELLED));
        
        // Verify business received refund
        assertEq(cUSD.balanceOf(business1), balanceBefore + budget);
    }
    
    // Test admin functions
    function testAdminFunctions() public {
        // Set platform fee
        vm.prank(owner);
        adsBazaar.setPlatformFee(1); // 0.1%
        assertEq(adsBazaar.platformFeePercentage(), 1);
        
        // Try to set fee as non-owner (should fail)
        vm.prank(business1);
        vm.expectRevert("Not authorized");
        adsBazaar.setPlatformFee(0);
        
        // Test withdraw fees
        _setupAndCompleteForFeeTest();
        
        // Now withdraw fees
        uint256 ownerBalanceBefore = cUSD.balanceOf(owner);
        uint256 contractBalance = cUSD.balanceOf(address(adsBazaar));
        
        vm.prank(owner);
        adsBazaar.withdrawFees();
        
        // Verify owner received the fees
        assertEq(cUSD.balanceOf(owner), ownerBalanceBefore + contractBalance);
        assertEq(cUSD.balanceOf(address(adsBazaar)), 0);
    }
    
    // Helper function for admin fee test
    function _setupAndCompleteForFeeTest() internal {
        // First we need to create a brief, select influencers, and complete it
        vm.prank(business1);
        adsBazaar.registerUser(true, false, '{"name": "Business One"}');
        
        vm.prank(influencer1);
        adsBazaar.registerUser(false, true, '{"name": "Influencer One"}');
        
        uint256 budget = 100 * 10**18;
        uint8 targetAudience = uint8(AdsBazaar.TargetAudience.GAMING);
        uint256 verificationPeriod = 1 days;
        
        vm.startPrank(business1);
        cUSD.approve(address(adsBazaar), budget);
        adsBazaar.createAdBrief(
            "Fee",
            "Fee Test",
            budget,
            block.timestamp + 1 days,
            1 days,
            1,
            targetAudience,
            verificationPeriod
        );
        
        bytes32[] memory briefs = adsBazaar.getBusinessBriefs(business1);
        briefId = briefs[0];
        vm.stopPrank();
        
        vm.prank(influencer1);
        adsBazaar.applyToBrief(briefId, "Application");
        
        vm.prank(business1);
        adsBazaar.selectInfluencer(briefId, 0);
        
        // Fast forward to end of promotion
        AdsBazaar.BriefData memory briefData = adsBazaar.getAdBrief(briefId);
        vm.warp(briefData.promotionEndTime + 1);
        
        vm.prank(business1);
        adsBazaar.completeCampaign(briefId);
        
        // At this point, the platform fee should be in the contract
        // but let's artificially send some cUSD to the contract for testing
        vm.prank(owner);
        cUSD.transfer(address(adsBazaar), 10 * 10**18);
    }
    
    // Test application deadline enforcement
    function testApplicationDeadline() public {
        // Register users
        vm.prank(business1);
        adsBazaar.registerUser(true, false, '{"name": "Business One"}');
        
        vm.prank(influencer1);
        adsBazaar.registerUser(false, true, '{"name": "Influencer One"}');
        
        // Register influencer2 as well
        vm.prank(influencer2);
        adsBazaar.registerUser(false, true, '{"name": "Influencer Two"}');
        
        // Create ad brief with short deadline
        uint256 budget = 100 * 10**18;
        uint256 applicationDeadline = block.timestamp + 1 hours;
        uint8 targetAudience = uint8(AdsBazaar.TargetAudience.ENTERTAINMENT);
        uint256 verificationPeriod = 1 days;
        
        vm.startPrank(business1);
        cUSD.approve(address(adsBazaar), budget);
        adsBazaar.createAdBrief(
            "Deadline",
            "Deadline Test",
            budget,
            applicationDeadline,
            7 days,
            1,
            targetAudience,
            verificationPeriod
        );
        
        bytes32[] memory briefs = adsBazaar.getBusinessBriefs(business1);
        briefId = briefs[0];
        vm.stopPrank();
        
        // Apply before deadline (should succeed)
        vm.prank(influencer1);
        adsBazaar.applyToBrief(briefId, "Application before deadline");
        
        // Verify application was recorded
        AdsBazaar.ApplicationData memory appData = adsBazaar.getBriefApplications(briefId);
        assertEq(appData.influencers.length, 1);
        assertEq(appData.influencers[0], influencer1);
        
        // Fast forward past deadline
        vm.warp(applicationDeadline + 1);
        
        // Apply after deadline (should fail)
        vm.prank(influencer2);
        vm.expectRevert("Application deadline passed");
        adsBazaar.applyToBrief(briefId, "Application after deadline");
        
        // Verify no new application was added
        appData = adsBazaar.getBriefApplications(briefId);
        assertEq(appData.influencers.length, 1);
    }
    
    // Test selecting more influencers than allowed
    function testMaxInfluencersLimit() public {
        // Register users
        vm.prank(business1);
        adsBazaar.registerUser(true, false, '{"name": "Business One"}');
        
        vm.prank(influencer1);
        adsBazaar.registerUser(false, true, '{"name": "Influencer One"}');
        
        vm.prank(influencer2);
        adsBazaar.registerUser(false, true, '{"name": "Influencer Two"}');
        
        // Create ad brief with max 1 influencer
        uint256 budget = 100 * 10**18;
        uint8 targetAudience = uint8(AdsBazaar.TargetAudience.SPORTS);
        uint256 verificationPeriod = 1 days;
        
        vm.startPrank(business1);
        cUSD.approve(address(adsBazaar), budget);
        adsBazaar.createAdBrief(
            "Max",
            "Max Influencers Test",
            budget,
            block.timestamp + 1 days,
            7 days,
            1, // Max 1 influencer
            targetAudience, 
            verificationPeriod
        );
        
        bytes32[] memory briefs = adsBazaar.getBusinessBriefs(business1);
        briefId = briefs[0];
        vm.stopPrank();
        
        // Both influencers apply
        vm.prank(influencer1);
        adsBazaar.applyToBrief(briefId, "First application");
        
        vm.prank(influencer2);
        adsBazaar.applyToBrief(briefId, "Second application");
        
        // Business selects first influencer
        vm.prank(business1);
        adsBazaar.selectInfluencer(briefId, 0);
        
        // Try to select the second influencer (should fail)
        vm.startPrank(business1);
        vm.expectRevert("Brief not in open status");
        adsBazaar.selectInfluencer(briefId, 1);
        vm.stopPrank();
    }
    
    // Test new target audience functionality
    function testTargetAudience() public {
        // Register business
        vm.prank(business1);
        adsBazaar.registerUser(true, false, '{"name": "Business One"}');
        
        // Create ad brief with specific target audience
        uint256 budget = 100 * 10**18;
        uint8 targetAudience = uint8(AdsBazaar.TargetAudience.FITNESS);
        uint256 verificationPeriod = 1 days;
        
        vm.startPrank(business1);
        cUSD.approve(address(adsBazaar), budget);
        adsBazaar.createAdBrief(
            "Fit",
            "Fitness Campaign",
            budget,
            block.timestamp + 1 days,
            7 days,
            2,
            targetAudience,
            verificationPeriod
        );
        
        bytes32[] memory briefs = adsBazaar.getBusinessBriefs(business1);
        briefId = briefs[0];
        vm.stopPrank();
        
        // Verify target audience is set correctly
        AdsBazaar.BriefData memory briefData = adsBazaar.getAdBrief(briefId);
        assertEq(uint8(briefData.targetAudience), targetAudience);
    }
    
    // Test verification deadline
    function testVerificationDeadline() public {
        // Register users
        vm.prank(business1);
        adsBazaar.registerUser(true, false, '{"name": "Business One"}');
        
        vm.prank(influencer1);
        adsBazaar.registerUser(false, true, '{"name": "Influencer One"}');
        
        // Create ad brief
        uint256 budget = 100 * 10**18;
        uint8 targetAudience = uint8(AdsBazaar.TargetAudience.EDUCATION);
        uint256 verificationPeriod = 3 days; // 3 days verification period
        
        vm.startPrank(business1);
        cUSD.approve(address(adsBazaar), budget);
        adsBazaar.createAdBrief(
            "Verify",
            "Verification Test",
            budget,
            block.timestamp + 1 days,
            2 days, // 2 days promotion
            1,
            targetAudience,
            verificationPeriod
        );
        
        bytes32[] memory briefs = adsBazaar.getBusinessBriefs(business1);
        briefId = briefs[0];
        vm.stopPrank();
        
        // Influencer applies
        vm.prank(influencer1);
        adsBazaar.applyToBrief(briefId, "I'll promote this");
        
        // Business selects influencer
        vm.prank(business1);
        adsBazaar.selectInfluencer(briefId, 0);
        
        // Verify verification deadline is set
        AdsBazaar.BriefData memory briefData = adsBazaar.getAdBrief(briefId);
        assertTrue(briefData.verificationDeadline > 0);
        
        // Confirm it's equal to promotion end time + 2 days (default verification period)
        assertEq(briefData.verificationDeadline, briefData.promotionEndTime + 2 days);
    }
    
    // Test getPendingPayments function
    function testGetPendingPayments() public {
        // Setup complete flow
        _setupUsersAndCreateBrief();
        _applyAndSelectInfluencers();
        
        // Submit proofs
        vm.prank(influencer1);
        adsBazaar.submitProof(briefId, "https://proof1.com");
        
        vm.prank(influencer2);
        adsBazaar.submitProof(briefId, "https://proof2.com");
        
        // Complete campaign
        AdsBazaar.BriefData memory briefData = adsBazaar.getAdBrief(briefId);
        vm.warp(briefData.promotionEndTime + 1);
        
        vm.prank(business1);
        adsBazaar.completeCampaign(briefId);
        
        // Check pending payments for influencer1
        (bytes32[] memory briefIds, uint256[] memory amounts, bool[] memory approved) = adsBazaar.getPendingPayments(influencer1);
        
        // Assert expectations
        assertEq(briefIds.length, 1);
        assertEq(briefIds[0], briefId);
        assertTrue(amounts[0] > 0);
        assertTrue(approved[0]);
        
        // Check total pending amount
        uint256 totalPending = adsBazaar.getTotalPendingAmount(influencer1);
        assertEq(totalPending, amounts[0]);
    }

    function testCannotClaimTwice() public {
        _setupUsersAndCreateBrief();
        _applyAndSelectInfluencers();
        _submitProofsAndComplete();

        vm.prank(influencer1);
        adsBazaar.claimPayments();

        vm.prank(influencer1);
        vm.expectRevert("No pending payments to claim");
        adsBazaar.claimPayments();
    }
}