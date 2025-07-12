// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

import {ISelfVerificationRoot} from "@selfxyz/contracts/contracts/interfaces/ISelfVerificationRoot.sol";

library LibAdsBazaar {
    bytes32 constant ADSBAZAAR_STORAGE_POSITION = keccak256("adsbazaar.storage");
    
    // Timing constants (only keep non-configurable ones)
    uint256 constant SELECTION_GRACE_PERIOD = 1 hours;
    uint256 constant DISPUTE_RESOLUTION_DEADLINE = 2 days;
    uint256 constant MAX_VERIFICATION_PERIOD = 5 days; // Maximum allowed verification period
    uint256 constant MAX_APPLICATION_PERIOD = 14 days; // Maximum application period
    uint256 constant MAX_PROOF_GRACE_PERIOD = 2 days; // Maximum proof submission grace period

    enum UserStatus {
        NEW_COMER,
        RISING,
        POPULAR,
        ELITE,
        SUPERSTAR
    }

    enum CampaignStatus {
        OPEN,           
        ASSIGNED,       
        COMPLETED,      
        CANCELLED,
        EXPIRED
    }

    enum TargetAudience {
        GENERAL,
        FASHION,
        TECH,
        GAMING,
        FITNESS,
        BEAUTY,
        FOOD,
        TRAVEL,
        BUSINESS,
        EDUCATION,
        ENTERTAINMENT,
        SPORTS,
        LIFESTYLE,
        OTHER
    }

    enum DisputeStatus {
        NONE,
        FLAGGED,
        RESOLVED_VALID,
        RESOLVED_INVALID,
        EXPIRED
    }

    struct AdBrief {
        bytes32 briefId;
        address business;
        string name; 
        string description;
        string requirements;
        uint256 budget;
        CampaignStatus status;
        uint256 promotionDuration;   
        uint256 promotionStartTime;  
        uint256 promotionEndTime;
        uint256 proofSubmissionDeadline;
        uint256 verificationDeadline;
        uint256 maxInfluencers;
        uint256 selectedInfluencersCount;
        TargetAudience targetAudience;
        uint256 creationTime;
        uint256 selectionDeadline;
        // New configurable timing fields
        uint256 applicationPeriod;        // How long applications are open
        uint256 proofSubmissionGracePeriod; // Grace period for proof submission
        uint256 verificationPeriod;       // Verification period (max 5 days)
    }

    struct InfluencerApplication {
        address influencer;
        string message;
        uint256 timestamp;
        bool isSelected;
        bool hasClaimed;
        string proofLink;
        bool isApproved; 
        DisputeStatus disputeStatus;
        string disputeReason;
        address resolvedBy;
    }

    struct UserProfile {
        bool isRegistered;
        bool isBusiness;
        bool isInfluencer;
        UserStatus status;
        string username;
        string profileData; 
        uint256 completedCampaigns;
        uint256 totalEscrowed;
    }

    struct PendingPayment {
        bytes32 briefId;
        uint256 amount;
        bool isApproved;
    }

    struct AdsBazaarStorage {
        // Core contract variables
        address owner;
        address cUSD;
        uint256 platformFeePercentage;
        
        
        // Self protocol related
        mapping(address => bool) verifiedInfluencers;
        mapping(uint256 => bool) nullifiers;
        ISelfVerificationRoot.VerificationConfig verificationConfig;
        address identityVerificationHub;
        uint256 scope;
        uint256[] attestationIds;
        
        // Dispute resolution
        mapping(address => bool) disputeResolvers;
        address[] disputeResolversList;
        mapping(bytes32 => mapping(address => uint256)) disputeTimestamp;
        
        // Platform statistics
        uint256 totalInfluencers;
        uint256 totalBusinesses;
        uint256 totalUsers;
        uint256 totalEscrowAmount;
        
        // Main data mappings
        bytes32[] allBriefIds;
        mapping(bytes32 => AdBrief) briefs;
        mapping(bytes32 => InfluencerApplication[]) applications;
        mapping(address => UserProfile) users;
        mapping(address => bytes32[]) businessBriefs;
        mapping(address => bytes32[]) influencerApplications;
        mapping(address => PendingPayment[]) influencerPendingPayments;
        mapping(address => uint256) totalPendingAmount;
        mapping(bytes32 => uint256) briefApplicationCounts;
        mapping(address => string) influencerProfiles;
        
        // Username mappings
        mapping(string => address) usernameToAddress;
        mapping(string => bool) usernameExists;
    }

    function adsBazaarStorage() internal pure returns (AdsBazaarStorage storage ds) {
        bytes32 position = ADSBAZAAR_STORAGE_POSITION;
        assembly {
            ds.slot := position
        }
    }

    // Events
    event UserRegistered(address indexed user, bool isBusiness, bool isInfluencer);
    event BriefCreated(bytes32 indexed briefId, address indexed business, uint256 budget, uint256 maxInfluencers, TargetAudience targetAudience, uint256 selectionDeadline);
    event BriefCancelled(bytes32 indexed briefId);
    event BriefExpired(bytes32 indexed briefId);
    event ApplicationSubmitted(bytes32 indexed briefId, address indexed influencer);
    event InfluencerSelected(bytes32 indexed briefId, address indexed influencer);
    event ProofSubmitted(bytes32 indexed briefId, address indexed influencer, string proofLink);
    event ProofApproved(bytes32 indexed briefId, address indexed influencer);
    event PaymentReleased(bytes32 indexed briefId, address indexed influencer, uint256 amount);
    event PromotionStarted(bytes32 indexed briefId, uint256 startTime, uint256 endTime, uint256 proofDeadline, uint256 verificationDeadline);
    event PaymentClaimed(address indexed influencer, uint256 amount);
    event AutoApprovalTriggered(bytes32 indexed briefId);
    event InfluencerVerified(address indexed influencer);
    event PlatformFeeTransferred(address indexed recipient, uint256 amount);
    event InfluencerProfileUpdated(address indexed influencer, string profileData);
    event UserStatusUpdated(address indexed user, UserStatus newStatus);
    event ProofNotSubmitted(bytes32 indexed briefId, address indexed influencer);
    event BudgetRefunded(bytes32 indexed briefId, address indexed business, uint256 amount);
    event CampaignCompleted(bytes32 indexed briefId, uint256 totalRefunded);
    event DisputeExpired(bytes32 indexed briefId, address indexed influencer, bool defaultedToInvalid);
    event CampaignCompletionBlocked(bytes32 indexed briefId, uint256 pendingDisputeCount);
    event VerificationConfigUpdated(address indexed updater);
    event DisputeResolverAdded(address indexed resolver);
    event DisputeResolverRemoved(address indexed resolver);
    event SubmissionFlagged(bytes32 indexed briefId, address indexed influencer, address indexed business, string reason);
    event DisputeResolved(bytes32 indexed briefId, address indexed influencer, address indexed resolver, bool isValid);

    // Common modifier functions (to be used in facets)
    function enforceOwner() internal view {
        require(msg.sender == adsBazaarStorage().owner, "Not authorized");
    }

    function enforceBusiness() internal view {
        require(adsBazaarStorage().users[msg.sender].isBusiness, "Not registered as business");
    }

    function enforceInfluencer() internal view {
        require(adsBazaarStorage().users[msg.sender].isInfluencer, "Not registered as influencer");
    }

    function enforceDisputeResolver() internal view {
        require(adsBazaarStorage().disputeResolvers[msg.sender], "Not authorized dispute resolver");
    }

    function enforceBriefExists(bytes32 _briefId) internal view {
        require(adsBazaarStorage().briefs[_briefId].business != address(0), "Brief does not exist");
    }

    // Helper functions for status updates
    function updateInfluencerStatus(address _influencer) internal {
        AdsBazaarStorage storage ds = adsBazaarStorage();
        uint256 completed = ds.users[_influencer].completedCampaigns;
        UserStatus newStatus;
        
        if (completed >= 500) {
            newStatus = UserStatus.SUPERSTAR;
        } else if (completed >= 100) {
            newStatus = UserStatus.ELITE;
        } else if (completed >= 50) {
            newStatus = UserStatus.POPULAR;
        } else if (completed >= 20) {
            newStatus = UserStatus.RISING;
        } else {
            newStatus = UserStatus.NEW_COMER;
        }
        
        if (ds.users[_influencer].status != newStatus) {
            ds.users[_influencer].status = newStatus;
            emit UserStatusUpdated(_influencer, newStatus);
        }
    }
    
    function updateBusinessStatus(address _business) internal {
        AdsBazaarStorage storage ds = adsBazaarStorage();
        uint256 totalEscrowed = ds.users[_business].totalEscrowed;
        UserStatus newStatus;
        
        if (totalEscrowed >= 1000 ether) { 
            newStatus = UserStatus.SUPERSTAR;
        } else if (totalEscrowed >= 500 ether) {
            newStatus = UserStatus.ELITE;
        } else if (totalEscrowed >= 200 ether) {
            newStatus = UserStatus.POPULAR;
        } else if (totalEscrowed >= 50 ether) {
            newStatus = UserStatus.RISING;
        } else {
            newStatus = UserStatus.NEW_COMER;
        }
        
        if (ds.users[_business].status != newStatus) {
            ds.users[_business].status = newStatus;
            emit UserStatusUpdated(_business, newStatus);
        }
    }
}