// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

import "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-contracts/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {SelfVerificationRoot} from "@selfxyz/contracts/contracts/abstract/SelfVerificationRoot.sol";
import {ISelfVerificationRoot} from "@selfxyz/contracts/contracts/interfaces/ISelfVerificationRoot.sol";
import {SelfCircuitLibrary} from "@selfxyz/contracts/contracts/libraries/SelfCircuitLibrary.sol";


contract AdsBazaar is SelfVerificationRoot, ReentrancyGuard {
    address public owner;
    IERC20 public cUSD;
    uint256 public platformFeePercentage = 5; // 0.5%
    
    // Updated timing constants 
    uint256 public constant CAMPAIGN_PREPARATION_PERIOD = 1 days;     
    uint256 public constant PROOF_SUBMISSION_GRACE_PERIOD = 2 days;    
    uint256 public constant VERIFICATION_PERIOD = 3 days;              
    uint256 public constant SELECTION_DEADLINE_PERIOD = 5 days; 
    uint256 public constant SELECTION_GRACE_PERIOD = 1 hours;
    uint256 public constant DISPUTE_RESOLUTION_DEADLINE = 2 days;
    
    // Self protocol related mappings
    mapping(address => bool) public verifiedInfluencers;
    mapping(uint256 => bool) internal _nullifiers;

    // Dispute resolution mappings
    mapping(address => bool) public disputeResolvers;
    address[] public disputeResolversList;
    mapping(bytes32 => mapping(address => uint256)) public disputeTimestamp;
    
    // Platform statistics
    uint256 public totalInfluencers;
    uint256 public totalBusinesses;
    uint256 public totalUsers;
    uint256 public totalEscrowAmount;
    
    // Error definition
    error RegisteredNullifier();

    constructor(
        address _cUSD,
        address _identityVerificationHub, 
        uint256 _scope, 
        uint256[] memory _attestationIds
    ) SelfVerificationRoot(
        _identityVerificationHub, 
        _scope, 
        _attestationIds
    ) {
        cUSD = IERC20(_cUSD);
        owner = msg.sender;
    }

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
        EXPIRED         // For campaigns that exceed selection deadline
    }

    // Target audience enum
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
        NONE,           // No dispute raised
        FLAGGED,        // Business has flagged the submission
        RESOLVED_VALID, // Dispute resolved - submission is valid
        RESOLVED_INVALID, // Dispute resolved - submission is invalid
        EXPIRED         // Dispute expired without resolution
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
        uint256 proofSubmissionDeadline;  // promotionEndTime + PROOF_SUBMISSION_GRACE_PERIOD
        uint256 verificationDeadline;     // proofSubmissionDeadline + VERIFICATION_PERIOD
        uint256 maxInfluencers;
        uint256 selectedInfluencersCount;
        TargetAudience targetAudience;
        uint256 creationTime;
        uint256 selectionDeadline;        // creationTime + SELECTION_DEADLINE_PERIOD
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
        string disputeReason; // Reason provided by business for flagging
        address resolvedBy;   // Address of resolver who made the decision 
    }

    struct UserProfile {
        bool isRegistered;
        bool isBusiness;
        bool isInfluencer;
        UserStatus status;
        string profileData; 
        uint256 completedCampaigns; // For influencers
        uint256 totalEscrowed; // For businesses
    }

    struct PendingPayment {
        bytes32 briefId;
        uint256 amount;
        bool isApproved;
    }
   
    struct BriefData {
        address business;
        string name; 
        string description;
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
        uint256 selectionDeadline;        // Added to return data
    }
    
    struct ApplicationData {
        address[] influencers;
        string[] messages;
        uint256[] timestamps;
        bool[] isSelected;
        bool[] hasClaimed;
        string[] proofLinks;
        bool[] isApproved;
    }

    bytes32[] private allBriefIds;
    
    mapping(bytes32 => AdBrief) public briefs;
    mapping(bytes32 => InfluencerApplication[]) public applications;
    mapping(address => UserProfile) public users;
    mapping(address => bytes32[]) public businessBriefs;
    mapping(address => bytes32[]) public influencerApplications;
    mapping(address => PendingPayment[]) public influencerPendingPayments;
    mapping(address => uint256) public totalPendingAmount; // Total amount pending for each influencer
    mapping(bytes32 => uint256) public briefApplicationCounts;
    // Simplified influencer profile - just stores JSON string
    mapping(address => string) public influencerProfiles;

    // Events
    event UserRegistered(address indexed user, bool isBusiness, bool isInfluencer);
    event BriefCreated(bytes32 indexed briefId, address indexed business, uint256 budget, uint256 maxInfluencers, TargetAudience targetAudience, uint256 selectionDeadline);
    event BriefCancelled(bytes32 indexed briefId);
    event BriefExpired(bytes32 indexed briefId);  // NEW: For expired campaigns
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
    
    // Self protocol related events
    event VerificationConfigUpdated(address indexed updater);

    // Dispute resolution events
    event DisputeResolverAdded(address indexed resolver);
    event DisputeResolverRemoved(address indexed resolver);
    event SubmissionFlagged(bytes32 indexed briefId, address indexed influencer, address indexed business, string reason);
    event DisputeResolved(bytes32 indexed briefId, address indexed influencer, address indexed resolver, bool isValid);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }

    modifier onlyBusiness() {
        require(users[msg.sender].isBusiness, "Not registered as business");
        _;
    }

    modifier onlyInfluencer() {
        require(users[msg.sender].isInfluencer, "Not registered as influencer");
        _;
    }

    modifier onlyDisputeResolver() {
        require(disputeResolvers[msg.sender], "Not authorized dispute resolver");
        _;
    }

    modifier briefExists(bytes32 _briefId) {
        require(briefs[_briefId].business != address(0), "Brief does not exist");
        _;
    }

    modifier autoApprovalCheck(bytes32 _briefId) {
        if (block.timestamp > briefs[_briefId].verificationDeadline && 
            briefs[_briefId].status == CampaignStatus.ASSIGNED) {
            _processPayments(_briefId);
            briefs[_briefId].status = CampaignStatus.COMPLETED;
        }
        _;
    }


    function registerUser(bool _isBusiness, bool _isInfluencer, string calldata _profileData) external {
        require(_isBusiness || _isInfluencer, "Must register as business or influencer");
        require(!(_isBusiness && _isInfluencer), "Cannot be both business and influencer");
        require(!users[msg.sender].isRegistered, "User already registered");
        
        users[msg.sender] = UserProfile({
            isRegistered: true,
            isBusiness: _isBusiness,
            isInfluencer: _isInfluencer,
            profileData: _profileData,
            status: UserStatus.NEW_COMER,
            completedCampaigns: 0,
            totalEscrowed: 0
        });
        
        // Update platform statistics
        totalUsers++;
        if (_isBusiness) {
            totalBusinesses++;
        }
        if (_isInfluencer) {
            totalInfluencers++;
        }
        
        emit UserRegistered(msg.sender, _isBusiness, _isInfluencer);
    }

    // update influencer profile (JSON string)
    function updateInfluencerProfile(string calldata _profileData) external onlyInfluencer {
        influencerProfiles[msg.sender] = _profileData;
        emit InfluencerProfileUpdated(msg.sender, _profileData);
    }

    // Get influencer profile
    function getInfluencerProfile(address _influencer) external view returns (string memory) {
        return influencerProfiles[_influencer];
    }
    
    function createAdBrief(
        string calldata _name,
        string calldata _description,
        string calldata _requirements,
        uint256 _budget,
        uint256 _promotionDuration,
        uint256 _maxInfluencers,
        uint8 _targetAudience
    ) external onlyBusiness {
        require(_budget > 0, "Budget must be greater than 0");
        require(_promotionDuration >= 1 days, "Promotion duration must be at least 1 day");
        require(_maxInfluencers > 0, "Max influencers must be greater than 0");
        require(_maxInfluencers <= 10, "Cannot select more than 10 influencers");
        require(_targetAudience < uint8(type(TargetAudience).max), "Invalid target audience");
        
        // Transfer tokens from business to contract
        require(cUSD.transferFrom(msg.sender, address(this), _budget), "Token transfer failed");

        // Update business's total escrowed amount and status
        users[msg.sender].totalEscrowed += _budget;
        _updateBusinessStatus(msg.sender);
        
        // Update total escrow amount
        totalEscrowAmount += _budget;
        
        bytes32 briefId = keccak256(
            abi.encodePacked(
                msg.sender,
                _name,
                _description,
                _requirements,
                _budget,
                _promotionDuration,
                block.timestamp
            )
        );
        
        // Calculate selection deadline
        uint256 selectionDeadline = block.timestamp + SELECTION_DEADLINE_PERIOD;
        
        // Create brief
        briefs[briefId] = AdBrief({
            briefId: briefId,
            business: msg.sender,
            name: _name,
            description: _description,
            requirements: _requirements,
            budget: _budget,
            status: CampaignStatus.OPEN,
            promotionDuration: _promotionDuration,
            promotionStartTime: 0, 
            promotionEndTime: 0,
            proofSubmissionDeadline: 0,
            verificationDeadline: 0,
            maxInfluencers: _maxInfluencers,
            selectedInfluencersCount: 0,
            targetAudience: TargetAudience(_targetAudience),
            creationTime: block.timestamp,
            selectionDeadline: selectionDeadline  // Set selection deadline
        });
        
        // Add to business briefs
        businessBriefs[msg.sender].push(briefId);
        allBriefIds.push(briefId);
        
        emit BriefCreated(briefId, msg.sender, _budget, _maxInfluencers, TargetAudience(_targetAudience), selectionDeadline);
    }
    
    function cancelAdBrief(bytes32 _briefId) external onlyBusiness briefExists(_briefId) {
        AdBrief storage brief = briefs[_briefId];
        require(brief.business == msg.sender, "Not the brief owner");
        require(brief.status == CampaignStatus.OPEN, "Brief can only be cancelled if open");
        
        // Can cancel if no influencers have been selected yet
        require(brief.selectedInfluencersCount == 0, "Cannot cancel: influencers already selected");
        
        brief.status = CampaignStatus.CANCELLED;
        
        // Update business's total escrowed amount and status
        users[msg.sender].totalEscrowed -= brief.budget;
        _updateBusinessStatus(msg.sender);
        
        // Update total escrow amount
        totalEscrowAmount -= brief.budget;
        
        // Refund the budget to business
        require(cUSD.transfer(brief.business, brief.budget), "Refund failed");
        
        emit BriefCancelled(_briefId);
    }

    // Function to expire campaigns that exceed selection deadline
    function expireCampaign(bytes32 _briefId) external briefExists(_briefId) {
        AdBrief storage brief = briefs[_briefId];
        require(brief.status == CampaignStatus.OPEN, "Campaign is not open");
        require(block.timestamp > brief.selectionDeadline + SELECTION_GRACE_PERIOD, "Grace period still active");
        
        brief.status = CampaignStatus.EXPIRED;
        
        // Update business's total escrowed amount and status
        users[brief.business].totalEscrowed -= brief.budget;
        _updateBusinessStatus(brief.business);
        
        // Update total escrow amount
        totalEscrowAmount -= brief.budget;
        
        // Refund the budget to business
        require(cUSD.transfer(brief.business, brief.budget), "Refund failed");
        
        emit BriefExpired(_briefId);
        emit BudgetRefunded(_briefId, brief.business, brief.budget);
    }
    
    function selectInfluencer(bytes32 _briefId, uint256 _applicationIndex) external onlyBusiness briefExists(_briefId) {
        AdBrief storage brief = briefs[_briefId];
        require(brief.business == msg.sender, "Not the brief owner");
        require(brief.status == CampaignStatus.OPEN, "Brief not in open status");
        // Check selection deadline
        require(block.timestamp <= brief.selectionDeadline + SELECTION_GRACE_PERIOD, "Selection period has ended");
        require(brief.selectedInfluencersCount < brief.maxInfluencers, "Max influencers already selected");
        require(_applicationIndex < applications[_briefId].length, "Invalid application index");
        
        InfluencerApplication storage application = applications[_briefId][_applicationIndex];
        require(!application.isSelected, "Influencer already selected");
        
        application.isSelected = true;
        brief.selectedInfluencersCount++;
        
        // If all slots filled, change status to ASSIGNED and set all timing parameters
        if (brief.selectedInfluencersCount == brief.maxInfluencers) {
            brief.status = CampaignStatus.ASSIGNED;
            // FIXED: Add preparation period before campaign starts
            brief.promotionStartTime = block.timestamp + CAMPAIGN_PREPARATION_PERIOD;
            brief.promotionEndTime = brief.promotionStartTime + brief.promotionDuration;
            brief.proofSubmissionDeadline = brief.promotionEndTime + PROOF_SUBMISSION_GRACE_PERIOD;
            brief.verificationDeadline = brief.proofSubmissionDeadline + VERIFICATION_PERIOD;
            
            emit PromotionStarted(
                _briefId, 
                brief.promotionStartTime, 
                brief.promotionEndTime,
                brief.proofSubmissionDeadline,
                brief.verificationDeadline
            );
        }
        
        emit InfluencerSelected(_briefId, application.influencer);
    }
    
    function completeCampaign(bytes32 _briefId) external onlyBusiness briefExists(_briefId) {
        AdBrief storage brief = briefs[_briefId];
        require(brief.business == msg.sender, "Not the brief owner");
        require(brief.status == CampaignStatus.ASSIGNED, "Brief not in assigned status");
        require(block.timestamp >= brief.proofSubmissionDeadline, "Proof submission period still active");
        
        
        uint256 pendingCount = getPendingDisputeCount(_briefId);
        if (pendingCount > 0) {
            emit CampaignCompletionBlocked(_briefId, pendingCount);
            revert("Cannot complete campaign with pending disputes");
        }
        
        // Mark as completed
        brief.status = CampaignStatus.COMPLETED;
        
        // Process payments for all selected influencers
        _processPayments(_briefId);
    }

    function applyToBrief(bytes32 _briefId, string calldata _message) external onlyInfluencer briefExists(_briefId) {
        AdBrief storage brief = briefs[_briefId];
        require(brief.status == CampaignStatus.OPEN, "Brief not open for applications");
        // FIXED: Check if selection deadline has passed
        require(block.timestamp <= brief.selectionDeadline, "Application period has ended");
        
        // Check if influencer has already applied
        for (uint256 i = 0; i < applications[_briefId].length; i++) {
            require(applications[_briefId][i].influencer != msg.sender, "Already applied");
        }

        briefApplicationCounts[_briefId]++;
        
        // Create application
        InfluencerApplication memory newApplication = InfluencerApplication({
            influencer: msg.sender,
            message: _message,
            timestamp: block.timestamp,
            isSelected: false,
            hasClaimed: false,
            proofLink: "",
            isApproved: false,
            disputeStatus: DisputeStatus.NONE,
            disputeReason: "",
            resolvedBy: address(0)
        });
        
        applications[_briefId].push(newApplication);
        influencerApplications[msg.sender].push(_briefId);
        
        emit ApplicationSubmitted(_briefId, msg.sender);
    }
    
    function submitProof(bytes32 _briefId, string calldata _proofLink) external onlyInfluencer briefExists(_briefId) {
        AdBrief storage brief = briefs[_briefId];
        require(brief.status == CampaignStatus.ASSIGNED, "Brief not in assigned status");
        require(block.timestamp >= brief.promotionStartTime, "Promotion has not started yet");
        require(block.timestamp <= brief.promotionEndTime, "Promotion has already ended");
        require(block.timestamp <= brief.proofSubmissionDeadline, "Proof submission period has ended");
        
        bool found = false;
        for (uint256 i = 0; i < applications[_briefId].length; i++) {
            if (applications[_briefId][i].influencer == msg.sender && applications[_briefId][i].isSelected) {
                applications[_briefId][i].proofLink = _proofLink;
                found = true;
                emit ProofSubmitted(_briefId, msg.sender, _proofLink);
                break;
            }
        }
        
        require(found, "Not selected for this brief");
    }

    function claimPayments() external onlyInfluencer nonReentrant{
        uint256 totalAmount = totalPendingAmount[msg.sender];
        require(totalAmount > 0, "No pending payments to claim");
        
        // Reset pending amount
        totalPendingAmount[msg.sender] = 0;
        
        // Mark all payments as claimed
        PendingPayment[] storage payments = influencerPendingPayments[msg.sender];
        for (uint256 i = 0; i < payments.length; i++) {
            if (payments[i].isApproved && !findAndMarkAsClaimed(payments[i].briefId)) {
                // This should never happen, but just in case
                revert("Error marking payment as claimed");
            }
        }
        
        // Clear pending payments array
        delete influencerPendingPayments[msg.sender];
        
        // Transfer total amount
        require(cUSD.transfer(msg.sender, totalAmount), "Payment transfer failed");
        
        emit PaymentClaimed(msg.sender, totalAmount);
    }
    
    // Helper function to find application and mark as claimed
    function findAndMarkAsClaimed(bytes32 _briefId) internal returns (bool) {
        InfluencerApplication[] storage briefApps = applications[_briefId];
        
        for (uint256 i = 0; i < briefApps.length; i++) {
            if (briefApps[i].influencer == msg.sender && briefApps[i].isSelected) {
                briefApps[i].hasClaimed = true;
                return true;
            }
        }
        
        return false;
    }

    // Auto-approval function - can only be called after verification deadline
    function triggerAutoApproval(bytes32 _briefId) external briefExists(_briefId) {
        AdBrief storage brief = briefs[_briefId];
        require(brief.status == CampaignStatus.ASSIGNED, "Brief not in assigned status");
        require(block.timestamp > brief.verificationDeadline, "Verification deadline not yet passed");
        
        _finalizeExpiredDisputes(_briefId);
        
        // Mark brief as completed
        brief.status = CampaignStatus.COMPLETED;
        
        // Process payments for all selected influencers
        _processPayments(_briefId);
        
        emit AutoApprovalTriggered(_briefId);
    }

    // Internal function to process payments - handles both manual completion and auto-approval
    function _processPayments(bytes32 _briefId) internal {
        AdBrief storage brief = briefs[_briefId];
        
        // Count influencers who actually submitted valid proof (not flagged as invalid)
        uint256 influencersWithValidProof = 0;
        
        // First pass: Count valid submissions
        for (uint256 i = 0; i < applications[_briefId].length; i++) {
            InfluencerApplication storage application = applications[_briefId][i];
            if (application.isSelected) {
                // Only count if proof was submitted and is not resolved as invalid or expired
                if (bytes(application.proofLink).length > 0 && 
                    application.disputeStatus != DisputeStatus.RESOLVED_INVALID &&
                    application.disputeStatus != DisputeStatus.EXPIRED) {
                    influencersWithValidProof++;
                }
            }
        }
        
        // Calculate payments only for valid performing influencers
        uint256 equalShare = 0;
        uint256 refundAmount = 0;
        
        if (influencersWithValidProof > 0) {
            equalShare = brief.budget / influencersWithValidProof;  // Divide only among valid performers
            refundAmount = brief.budget % influencersWithValidProof; // Handle remainder
        } else {
            // No valid submissions - refund entire budget
            refundAmount = brief.budget;
        }
        
        // Update total escrow amount
        totalEscrowAmount -= brief.budget;
        
        // Second pass: Process payments for valid submissions only
        for (uint256 i = 0; i < applications[_briefId].length; i++) {
            InfluencerApplication storage application = applications[_briefId][i];
            
            if (application.isSelected) {
                    // Only approve and pay if proof was submitted and is not resolved as invalid or expired
                    if (bytes(application.proofLink).length > 0 && 
                    application.disputeStatus != DisputeStatus.RESOLVED_INVALID &&
                    application.disputeStatus != DisputeStatus.EXPIRED) {
                    
                    application.isApproved = true;
                    
                    // Calculate platform fee
                    uint256 platformFee = (equalShare * platformFeePercentage) / 1000;
                    uint256 influencerAmount = equalShare - platformFee;
                    
                    // Transfer platform fee directly to owner immediately
                    require(cUSD.transfer(owner, platformFee), "Platform fee transfer failed");
                    emit PlatformFeeTransferred(owner, platformFee);
                    
                    // Add to pending payments
                    address influencer = application.influencer;
                    PendingPayment memory payment = PendingPayment({
                        briefId: _briefId,
                        amount: influencerAmount,
                        isApproved: true
                    });
                    
                    influencerPendingPayments[influencer].push(payment);
                    totalPendingAmount[influencer] += influencerAmount;
                    
                    // Update influencer's completed campaigns and status
                    users[influencer].completedCampaigns++;
                    _updateInfluencerStatus(influencer);
                    
                    emit ProofApproved(_briefId, influencer);
                    emit PaymentReleased(_briefId, influencer, influencerAmount);
                }
                // Non-performers or invalid submissions don't get approved or paid
                else {
                    emit ProofNotSubmitted(_briefId, application.influencer);
                }
            }
        }
        
        // Refund unused budget to business (for non-performers/invalid submissions + remainder)
        if (refundAmount > 0) {
            require(cUSD.transfer(brief.business, refundAmount), "Refund transfer failed");
            emit BudgetRefunded(_briefId, brief.business, refundAmount);
        }
        emit CampaignCompleted(_briefId,refundAmount);
    }

    // Implement Self protocol verification function (optional for influencers)
    function verifySelfProof(
        ISelfVerificationRoot.DiscloseCircuitProof memory proof
    ) public override {
        // Check if nullifier has been registered
        if (_nullifiers[proof.pubSignals[NULLIFIER_INDEX]]) {
            revert RegisteredNullifier();
        }
        
        // Verify the proof with Self verification hub
        super.verifySelfProof(proof);
        
        // Mark nullifier as used to prevent replay attacks
        _nullifiers[proof.pubSignals[NULLIFIER_INDEX]] = true;
        
        // Get the user address from the proof
        address userAddress = address(uint160(proof.pubSignals[USER_IDENTIFIER_INDEX]));
        
        // Mark the influencer as verified
        verifiedInfluencers[userAddress] = true;
        
        emit InfluencerVerified(userAddress);
    }

    // Set verification configuration for Self protocol
    function setVerificationConfig(
        ISelfVerificationRoot.VerificationConfig memory newVerificationConfig
    ) external onlyOwner {
        _setVerificationConfig(newVerificationConfig);
        emit VerificationConfigUpdated(msg.sender);
    }

    // Get verification configuration
    function getVerificationConfig() external view returns (ISelfVerificationRoot.VerificationConfig memory) {
        return _getVerificationConfig();
    }

    // Get individual platform statistics
    function getTotalInfluencers() external view returns (uint256) {
        return totalInfluencers;
    }

    function getTotalBusinesses() external view returns (uint256) {
        return totalBusinesses;
    }

    function getTotalUsers() external view returns (uint256) {
        return totalUsers;
    }

    function getTotalEscrowAmount() external view returns (uint256) {
        return totalEscrowAmount;
    }

    function getPendingPayments(address _influencer) external view returns (
        bytes32[] memory briefIds,
        uint256[] memory amounts,
        bool[] memory approved
    ) {
        PendingPayment[] storage payments = influencerPendingPayments[_influencer];
        uint256 count = payments.length;
        
        briefIds = new bytes32[](count);
        amounts = new uint256[](count);
        approved = new bool[](count);
        
        for (uint256 i = 0; i < count; i++) {
            briefIds[i] = payments[i].briefId;
            amounts[i] = payments[i].amount;
            approved[i] = payments[i].isApproved;
        }
        
        return (briefIds, amounts, approved);
    }

    // Get total pending amount for an influencer
    function getTotalPendingAmount(address _influencer) external view returns (uint256) {
        return totalPendingAmount[_influencer];
    }
   
    function getAdBrief(bytes32 _briefId) external view returns (BriefData memory) {
        AdBrief storage brief = briefs[_briefId];
        return BriefData({
            business: brief.business,
            name: brief.name,
            description: brief.description,
            budget: brief.budget,
            status: brief.status,
            promotionDuration: brief.promotionDuration,
            promotionStartTime: brief.promotionStartTime,
            promotionEndTime: brief.promotionEndTime,
            proofSubmissionDeadline: brief.proofSubmissionDeadline,
            verificationDeadline: brief.verificationDeadline,
            maxInfluencers: brief.maxInfluencers,
            selectedInfluencersCount: brief.selectedInfluencersCount,
            targetAudience: brief.targetAudience,
            selectionDeadline: brief.selectionDeadline
        });
    }

    function getAllBriefs() external view returns (bytes32[] memory) {
        return allBriefIds;
    }
    
    function getBusinessBriefs(address _business) external view returns (bytes32[] memory) {
        return businessBriefs[_business];
    }
    
    function getInfluencerApplications(address _influencer) external view returns (bytes32[] memory) {
        return influencerApplications[_influencer];
    }

    function hasInfluencerApplied(bytes32 _briefId, address _influencer) public view returns (bool) {
        InfluencerApplication[] storage briefApplications = applications[_briefId];
        for (uint256 i = 0; i < briefApplications.length; i++) {
            if (briefApplications[i].influencer == _influencer) {
                return true;
            }
        }
        return false;
    }
    
    function getBriefApplications(bytes32 _briefId) external view returns (ApplicationData memory) {
        InfluencerApplication[] storage briefApps = applications[_briefId];
        uint256 count = briefApps.length;
        
        address[] memory influencers = new address[](count);
        string[] memory messages = new string[](count);
        uint256[] memory timestamps = new uint256[](count);
        bool[] memory isSelected = new bool[](count);
        bool[] memory hasClaimed = new bool[](count);
        string[] memory proofLinks = new string[](count);
        bool[] memory isApproved = new bool[](count);
        
        for (uint256 i = 0; i < count; i++) {
            influencers[i] = briefApps[i].influencer;
            messages[i] = briefApps[i].message;
            timestamps[i] = briefApps[i].timestamp;
            isSelected[i] = briefApps[i].isSelected;
            hasClaimed[i] = briefApps[i].hasClaimed;
            proofLinks[i] = briefApps[i].proofLink;
            isApproved[i] = briefApps[i].isApproved;
        }
        
        return ApplicationData({
            influencers: influencers,
            messages: messages,
            timestamps: timestamps,
            isSelected: isSelected,
            hasClaimed: hasClaimed,
            proofLinks: proofLinks,
            isApproved: isApproved
        });
    }
    
    function setPlatformFee(uint256 _newFeePercentage) external onlyOwner {
        require(_newFeePercentage <= 10, "Fee too high"); // Max 1%
        platformFeePercentage = _newFeePercentage;
    }
    
    // Check if an influencer is verified (optional feature)
    function isInfluencerVerified(address _influencer) external view returns (bool) {
        return verifiedInfluencers[_influencer];
    }

    function getUserStatus(address _user) external view returns (UserStatus) {
        return users[_user].status;
    }
    
    function getInfluencerStats(address _influencer) external view returns (uint256 completedCampaigns, UserStatus status) {
        require(users[_influencer].isInfluencer, "Not an influencer");
        return (users[_influencer].completedCampaigns, users[_influencer].status);
    }
    
    function getBusinessStats(address _business) external view returns (uint256 totalEscrowed, UserStatus status) {
        require(users[_business].isBusiness, "Not a business");
        return (users[_business].totalEscrowed, users[_business].status);
    }

    // Helper functions to update user statuses
    function _updateInfluencerStatus(address _influencer) internal {
        uint256 completed = users[_influencer].completedCampaigns;
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
        
        if (users[_influencer].status != newStatus) {
            users[_influencer].status = newStatus;
            emit UserStatusUpdated(_influencer, newStatus);
        }
    }
    
    function _updateBusinessStatus(address _business) internal {
        uint256 totalEscrowed = users[_business].totalEscrowed;
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
        
        if (users[_business].status != newStatus) {
            users[_business].status = newStatus;
            emit UserStatusUpdated(_business, newStatus);
        }
    }


    //DISPUTE RESOLUTION FUNCTIONS

     // Dispute resolution functions
    function addDisputeResolver(address _resolver) external onlyOwner {
        require(_resolver != address(0), "Invalid resolver address");
        require(!disputeResolvers[_resolver], "Already a dispute resolver");
        
        disputeResolvers[_resolver] = true;
        disputeResolversList.push(_resolver);
        
        emit DisputeResolverAdded(_resolver);
    }

    function removeDisputeResolver(address _resolver) external onlyOwner {
        require(disputeResolvers[_resolver], "Not a dispute resolver");
        
        disputeResolvers[_resolver] = false;
        
        // Remove from array
        for (uint256 i = 0; i < disputeResolversList.length; i++) {
            if (disputeResolversList[i] == _resolver) {
                disputeResolversList[i] = disputeResolversList[disputeResolversList.length - 1];
                disputeResolversList.pop();
                break;
            }
        }
        
        emit DisputeResolverRemoved(_resolver);
    }

    function getDisputeResolvers() external view returns (address[] memory) {
        return disputeResolversList;
    }

    function flagSubmission(bytes32 _briefId, address _influencer, string calldata _reason) external onlyBusiness briefExists(_briefId) {
        AdBrief storage brief = briefs[_briefId];
        require(brief.business == msg.sender, "Not the brief owner");
        require(brief.status == CampaignStatus.ASSIGNED, "Brief not in assigned status");
        require(bytes(_reason).length > 0, "Dispute reason required");
        
        bool found = false;
        for (uint256 i = 0; i < applications[_briefId].length; i++) {
            InfluencerApplication storage application = applications[_briefId][i];
            if (application.influencer == _influencer && application.isSelected) {
                require(bytes(application.proofLink).length > 0, "No proof submitted yet");
                require(application.disputeStatus == DisputeStatus.NONE, "Already flagged or resolved");
                
                application.disputeStatus = DisputeStatus.FLAGGED;
                application.disputeReason = _reason;
                found = true;
                
                emit SubmissionFlagged(_briefId, _influencer, msg.sender, _reason);
                break;
            }
        }
        
        require(found, "Influencer not found or not selected");
        disputeTimestamp[_briefId][_influencer] = block.timestamp;
    }

    function resolveDispute(bytes32 _briefId, address _influencer, bool _isValid) external onlyDisputeResolver briefExists(_briefId) {
        require(block.timestamp <= disputeTimestamp[_briefId][_influencer] + DISPUTE_RESOLUTION_DEADLINE,"Dispute resolution deadline passed");
        bool found = false;
        for (uint256 i = 0; i < applications[_briefId].length; i++) {
            InfluencerApplication storage application = applications[_briefId][i];
            if (application.influencer == _influencer && application.isSelected) {
                require(application.disputeStatus == DisputeStatus.FLAGGED, "No active dispute to resolve");
                
                application.disputeStatus = _isValid ? DisputeStatus.RESOLVED_VALID : DisputeStatus.RESOLVED_INVALID;
                application.resolvedBy = msg.sender;
                found = true;
                
                emit DisputeResolved(_briefId, _influencer, msg.sender, _isValid);
                break;
            }
        }
        
        require(found, "Influencer not found or not selected");
    }

    function getApplicationDispute(bytes32 _briefId, address _influencer) external view returns (
        DisputeStatus disputeStatus,
        string memory disputeReason,
        address resolvedBy
    ) {
        for (uint256 i = 0; i < applications[_briefId].length; i++) {
            InfluencerApplication storage application = applications[_briefId][i];
            if (application.influencer == _influencer && application.isSelected) {
                return (application.disputeStatus, application.disputeReason, application.resolvedBy);
            }
        }
        revert("Influencer not found or not selected");
    }

    
    function hasPendingDisputes(bytes32 _briefId) public view returns (bool) {
        for (uint256 i = 0; i < applications[_briefId].length; i++) {
            InfluencerApplication storage app = applications[_briefId][i];
            if (app.isSelected && app.disputeStatus == DisputeStatus.FLAGGED) {
                uint256 disputeTime = disputeTimestamp[_briefId][app.influencer];
                // Check if still within resolution period
                if (block.timestamp <= disputeTime + DISPUTE_RESOLUTION_DEADLINE) {
                    return true;
                }
            }
        }
        return false;
    }

    function getPendingDisputeCount(bytes32 _briefId) public view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 0; i < applications[_briefId].length; i++) {
            InfluencerApplication storage app = applications[_briefId][i];
            if (app.isSelected && app.disputeStatus == DisputeStatus.FLAGGED) {
                uint256 disputeTime = disputeTimestamp[_briefId][app.influencer];
                if (block.timestamp <= disputeTime + DISPUTE_RESOLUTION_DEADLINE) {
                    count++;
                }
            }
        }
        return count;
    }

    function _finalizeExpiredDisputes(bytes32 _briefId) internal {
        for (uint256 i = 0; i < applications[_briefId].length; i++) {
            InfluencerApplication storage app = applications[_briefId][i];
            if (app.isSelected && app.disputeStatus == DisputeStatus.FLAGGED) {
                uint256 disputeTime = disputeTimestamp[_briefId][app.influencer];
                if (block.timestamp > disputeTime + DISPUTE_RESOLUTION_DEADLINE) {
                    // Option 1 Policy: Default expired disputes to INVALID for safety
                    app.disputeStatus = DisputeStatus.EXPIRED;
                    emit DisputeExpired(_briefId, app.influencer, false);
                }
            }
        }
    }

    function expireDispute(bytes32 _briefId, address _influencer) external briefExists(_briefId) {
        require(disputeTimestamp[_briefId][_influencer] > 0, "No dispute exists");
        require(block.timestamp > disputeTimestamp[_briefId][_influencer] + DISPUTE_RESOLUTION_DEADLINE, 
            "Dispute not yet expired");
        
        // Find and update the application
        for (uint256 i = 0; i < applications[_briefId].length; i++) {
            InfluencerApplication storage app = applications[_briefId][i];
            if (app.influencer == _influencer && app.isSelected && 
                app.disputeStatus == DisputeStatus.FLAGGED) {
                
                app.disputeStatus = DisputeStatus.EXPIRED;
                emit DisputeExpired(_briefId, _influencer, false);
                break;
            }
        }
    }

}