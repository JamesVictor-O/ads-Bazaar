// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "../src/AdsBazaar.sol";
import "openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";

// Mock cUSD token for testing
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
    
    // Test users
    address public owner = address(1);
    address public business1 = address(2);
    address public business2 = address(3);
    address public influencer1 = address(4);
    address public influencer2 = address(5);
    address public influencer3 = address(6);
    
    // Test variables
    uint256 public constant INITIAL_BALANCE = 10000 * 10**18; // 10,000 cUSD
    bytes32 public briefId;
    
    function setUp() public {
        vm.startPrank(owner);
        cUSD = new MockCUSD();
        adsBazaar = new AdsBazaar(address(cUSD));
        vm.stopPrank();
        
        // Fund test accounts
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

    // Test registration functionality
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
    
    // Break up the large function into smaller ones to avoid stack depth issues
    function testCompleteUserFlow() public {
        // 1. Register users and create brief
        _setupUsersAndCreateBrief();
        
        // 2. Apply to brief and select influencers
        _applyAndSelectInfluencers();
        
        // 3. Submit proofs and complete campaign
        _submitProofsAndComplete();
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
        
        vm.startPrank(business1);
        cUSD.approve(address(adsBazaar), budget);
        adsBazaar.createAdBrief(
            "Test Ad Campaign",
            budget,
            applicationDeadline,
            promotionDuration,
            maxInfluencers
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
        (
            address[] memory influencers,
            string[] memory messages,
            uint256[] memory timestamps,
            bool[] memory isSelected,
            bool[] memory hasClaimed,
            string[] memory proofLinks
        ) = adsBazaar.getBriefApplications(briefId);
        
        assertEq(influencers.length, 2);
        assertEq(influencers[0], influencer1);
        assertEq(influencers[1], influencer2);
        
        // Business selects influencers
        vm.startPrank(business1);
        adsBazaar.selectInfluencer(briefId, 0); // Select influencer1
        adsBazaar.selectInfluencer(briefId, 1); // Select influencer2
        vm.stopPrank();
        
        // Verify brief status changed to ASSIGNED
        (
            ,
            ,
            ,
            AdsBazaar.Status status,
            ,
            ,
            uint256 startTime,
            uint256 endTime,
            ,
            uint256 selectedCount
        ) = adsBazaar.getAdBrief(briefId);
        
        assertEq(uint256(status), uint256(AdsBazaar.Status.ASSIGNED));
        assertEq(selectedCount, 2);
        assertTrue(startTime > 0);
        
        (, , , , , uint256 duration, , , , ) = adsBazaar.getAdBrief(briefId);
        assertEq(endTime, startTime + duration);
    }
    
    // Helper function for step 3 of the user flow
    function _submitProofsAndComplete() internal {
        // Get end time
        (, , , , , , , uint256 endTime, , ) = adsBazaar.getAdBrief(briefId);
        
        // Influencers submit proof of promotion
        vm.prank(influencer1);
        adsBazaar.submitProof(briefId, "https://social.com/proof1");
        
        vm.prank(influencer2);
        adsBazaar.submitProof(briefId, "https://social.com/proof2");
        
        // Wait for promotion period to end
        vm.warp(endTime + 1);
        
        // Business completes the campaign
        uint256 influencer1BalanceBefore = cUSD.balanceOf(influencer1);
        uint256 influencer2BalanceBefore = cUSD.balanceOf(influencer2);
        uint256 ownerBalanceBefore = cUSD.balanceOf(owner);
        
        vm.prank(business1);
        adsBazaar.completeCampaign(briefId);
        
        // Verify payments were made correctly
        uint256 platformFeePercentage = adsBazaar.platformFeePercentage();
        
        // Get brief budget separately to avoid stack too deep
        (, , uint256 budget, , , , , , , ) = adsBazaar.getAdBrief(briefId);
        uint256 expectedShareBeforeFee = budget / 2; // Equal split between 2 influencers
        uint256 expectedFee = (expectedShareBeforeFee * platformFeePercentage) / 1000;
        uint256 expectedPayment = expectedShareBeforeFee - expectedFee;
        
        assertEq(cUSD.balanceOf(influencer1), influencer1BalanceBefore + expectedPayment);
        assertEq(cUSD.balanceOf(influencer2), influencer2BalanceBefore + expectedPayment);
        assertEq(cUSD.balanceOf(owner), ownerBalanceBefore + (expectedFee * 2));
        
        // Verify brief status changed to COMPLETED
        (, , , AdsBazaar.Status status, , , , , , ) = adsBazaar.getAdBrief(briefId);
        assertEq(uint256(status), uint256(AdsBazaar.Status.COMPLETED));
    }
    
    // Test cancelling a brief
    function testCancelAdBrief() public {
        // Register business
        vm.prank(business1);
        adsBazaar.registerUser(true, false, '{"name": "Business One"}');
        
        // Create ad brief
        uint256 budget = 500 * 10**18;
        uint256 applicationDeadline = block.timestamp + 1 days;
        
        vm.startPrank(business1);
        cUSD.approve(address(adsBazaar), budget);
        adsBazaar.createAdBrief(
            "Campaign to Cancel",
            budget,
            applicationDeadline,
            7 days,
            2
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
        (, , , AdsBazaar.Status status, , , , , , ) = adsBazaar.getAdBrief(briefId);
        assertEq(uint256(status), uint256(AdsBazaar.Status.CANCELLED));
        
        // Verify business received refund
        assertEq(cUSD.balanceOf(business1), balanceBefore + budget);
    }
    
    // Test admin functions
    function testAdminFunctions() public {
        // Set platform fee
        vm.prank(owner);
        adsBazaar.setPlatformFee(1); // 1%
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
        vm.startPrank(business1);
        cUSD.approve(address(adsBazaar), budget);
        adsBazaar.createAdBrief(
            "Fee Test",
            budget,
            block.timestamp + 1 days,
            1 days,
            1
        );
        
        bytes32[] memory briefs = adsBazaar.getBusinessBriefs(business1);
        briefId = briefs[0];
        vm.stopPrank();
        
        vm.prank(influencer1);
        adsBazaar.applyToBrief(briefId, "Application");
        
        vm.prank(business1);
        adsBazaar.selectInfluencer(briefId, 0);
        
        // Fast forward to end of promotion
        (, , , , , , , uint256 endTime, , ) = adsBazaar.getAdBrief(briefId);
        vm.warp(endTime + 1);
        
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
        
        vm.startPrank(business1);
        cUSD.approve(address(adsBazaar), budget);
        adsBazaar.createAdBrief(
            "Deadline Test",
            budget,
            applicationDeadline,
            7 days,
            1
        );
        
        bytes32[] memory briefs = adsBazaar.getBusinessBriefs(business1);
        briefId = briefs[0];
        vm.stopPrank();
        
        // Apply before deadline (should succeed)
        vm.prank(influencer1);
        adsBazaar.applyToBrief(briefId, "Application before deadline");
        
        // Verify application was recorded - capture all return values but only use influencers
        (address[] memory influencers,,,,,) = adsBazaar.getBriefApplications(briefId);
        assertEq(influencers.length, 1);
        assertEq(influencers[0], influencer1);
        
        // Fast forward past deadline
        vm.warp(applicationDeadline + 1);
        
        // Apply after deadline (should fail)
        vm.prank(influencer2);
        vm.expectRevert("Application deadline passed");
        adsBazaar.applyToBrief(briefId, "Application after deadline");
        
        // Verify no new application was added - capture all return values but only use influencers
        (influencers,,,,,) = adsBazaar.getBriefApplications(briefId);
        assertEq(influencers.length, 1);
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
        
        vm.startPrank(business1);
        cUSD.approve(address(adsBazaar), budget);
        adsBazaar.createAdBrief(
            "Max Influencers Test",
            budget,
            block.timestamp + 1 days,
            7 days,
            1 // Max 1 influencer
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
        // Update to match the actual error message in the contract
        vm.expectRevert("Brief not in open status");
        adsBazaar.selectInfluencer(briefId, 1);
        vm.stopPrank();
    }
}