// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

import "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-contracts/contracts/access/Ownable.sol";
import {SelfVerificationRoot} from "@selfxyz/contracts/contracts/abstract/SelfVerificationRoot.sol";
import {ISelfVerificationRoot} from "@selfxyz/contracts/contracts/interfaces/ISelfVerificationRoot.sol";
import {SelfCircuitLibrary} from "@selfxyz/contracts/contracts/libraries/SelfCircuitLibrary.sol";

contract AdsBazaar is SelfVerificationRoot {
    address public owner;
    IERC20 public cUSD;
    uint256 public platformFeePercentage = 5; // 0.5%
    
    // Self protocol related mappings
    mapping(address => bool) public verifiedInfluencers;
    mapping(uint256 => bool) internal _nullifiers;
    
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

    enum Status {
        OPEN,           
        ASSIGNED,       
        COMPLETED,      
        CANCELLED       
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

    struct AdBrief {
        bytes32 briefId;
        address business;
        string name; 
        string description;
        uint256 budget;
        Status status;
        uint256 applicationDeadline; 
        uint256 promotionDuration;   
        uint256 promotionStartTime;  
        uint256 promotionEndTime;  
        uint256 maxInfluencers;
        uint256 selectedInfluencersCount;
        TargetAudience targetAudience;
        uint256 verificationDeadline;
    }

    struct InfluencerApplication {
        address influencer;
        string message;
        uint256 timestamp;
        bool isSelected;
        bool hasClaimed;
        string proofLink;
        bool isApproved;  
    }

    struct UserProfile {
        bool isRegistered;
        bool isBusiness;
        bool isInfluencer;
        string profileData; 
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
        Status status;
        uint256 applicationDeadline;
        uint256 promotionDuration;
        uint256 promotionStartTime;
        uint256 promotionEndTime;
        uint256 maxInfluencers;
        uint256 selectedInfluencersCount;
        TargetAudience targetAudience;
        uint256 verificationDeadline;
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
    event BriefCreated(bytes32 indexed briefId, address indexed business, uint256 budget, uint256 maxInfluencers, TargetAudience targetAudience);
    event BriefCancelled(bytes32 indexed briefId);
    event ApplicationSubmitted(bytes32 indexed briefId, address indexed influencer);
    event InfluencerSelected(bytes32 indexed briefId, address indexed influencer);
    event ProofSubmitted(bytes32 indexed briefId, address indexed influencer, string proofLink);
    event ProofApproved(bytes32 indexed briefId, address indexed influencer);
    event PaymentReleased(bytes32 indexed briefId, address indexed influencer, uint256 amount);
    event PromotionStarted(bytes32 indexed briefId, uint256 startTime, uint256 endTime);
    event PaymentClaimed(address indexed influencer, uint256 amount);
    event VerificationDeadlineSet(bytes32 indexed briefId, uint256 deadline);
    event AutoApprovalTriggered(bytes32 indexed briefId);
    event InfluencerVerified(address indexed influencer);
    event PlatformFeeTransferred(address indexed recipient, uint256 amount);
    event InfluencerProfileUpdated(address indexed influencer, string profileData);
    
    // Self protocol related events
    event VerificationConfigUpdated(address indexed updater);
    
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

    modifier briefExists(bytes32 _briefId) {
        require(briefs[_briefId].business != address(0), "Brief does not exist");
        _;
    }

    // Add modifier for verified influencers
    modifier onlyVerifiedInfluencer() {
        require(users[msg.sender].isInfluencer, "Not registered as influencer");
        require(verifiedInfluencers[msg.sender], "Influencer identity not verified");
        _;
    }
    
    function registerUser(bool _isBusiness, bool _isInfluencer, string calldata _profileData) external {
        require(_isBusiness || _isInfluencer, "Must register as business or influencer");
        require(!(_isBusiness && _isInfluencer), "Cannot be both business and influencer");
        
        users[msg.sender] = UserProfile({
            isRegistered: true,
            isBusiness: _isBusiness,
            isInfluencer: _isInfluencer,
            profileData: _profileData
        });
        
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
        uint256 _budget,
        uint256 _applicationDeadline,
        uint256 _promotionDuration,
        uint256 _maxInfluencers,
        uint8 _targetAudience,
        uint256 _verificationPeriod  // Period in seconds after promotion ends for verification
    ) external onlyBusiness {
        require(_budget > 0, "Budget must be greater than 0");
        require(_applicationDeadline > block.timestamp, "Application deadline must be in the future");
        require(_promotionDuration > 0, "Promotion duration must be greater than 0");
        require(_maxInfluencers > 0, "Max influencers must be greater than 0");
        require(_targetAudience < uint8(type(TargetAudience).max), "Invalid target audience");
        require(_verificationPeriod > 0, "Verification period must be greater than 0");
        
        // Transfer tokens from business to contract
        require(cUSD.transferFrom(msg.sender, address(this), _budget), "Token transfer failed");
        
        bytes32 briefId = keccak256(
            abi.encodePacked(
                msg.sender,
                _description,
                _budget,
                _applicationDeadline,
                _promotionDuration,
                block.timestamp
            )
        );
        
        // Create brief
        briefs[briefId] = AdBrief({
            briefId: briefId,
            business: msg.sender,
            name: _name,
            description: _description,
            budget: _budget,
            status: Status.OPEN,
            applicationDeadline: _applicationDeadline,
            promotionDuration: _promotionDuration,
            promotionStartTime: 0, 
            promotionEndTime: 0,   
            maxInfluencers: _maxInfluencers,
            selectedInfluencersCount: 0,
            targetAudience: TargetAudience(_targetAudience),
            verificationDeadline: 0  // Will be set when promotion starts
        });
        
        // Add to business briefs
        businessBriefs[msg.sender].push(briefId);
        allBriefIds.push(briefId);
        
        emit BriefCreated(briefId, msg.sender, _budget, _maxInfluencers, TargetAudience(_targetAudience));
    }
    
    function cancelAdBrief(bytes32 _briefId) external onlyBusiness briefExists(_briefId) {
        AdBrief storage brief = briefs[_briefId];
        require(brief.business == msg.sender, "Not the brief owner");
        require(brief.status == Status.OPEN, "Brief can only be cancelled if open");
        
        // 1. Can cancel if deadline passed with no applications
        // 2. Can cancel if deadline passed and fewer influencers applied than maxInfluencers
        bool canCancel = false;
        
        // If application deadline has passed and no influencers applied
        if (block.timestamp > brief.applicationDeadline && applications[_briefId].length == 0) {
            canCancel = true;
        }
        // If application deadline has passed and fewer influencers applied than max expected
        else if (block.timestamp > brief.applicationDeadline && applications[_briefId].length < brief.maxInfluencers) {
            canCancel = true;
        }
        // If no influencers have been selected yet
        else if (brief.selectedInfluencersCount == 0) {
            canCancel = true;
        }
        
        require(canCancel, "Cannot cancel: influencers already selected or conditions not met");
        
        brief.status = Status.CANCELLED;
        
        // Refund the budget to business
        require(cUSD.transfer(brief.business, brief.budget), "Refund failed");
        
        emit BriefCancelled(_briefId);
    }
    
    function selectInfluencer(bytes32 _briefId, uint256 _applicationIndex) external onlyBusiness briefExists(_briefId) {
        AdBrief storage brief = briefs[_briefId];
        require(brief.business == msg.sender, "Not the brief owner");
        require(brief.status == Status.OPEN, "Brief not in open status");
        require(brief.selectedInfluencersCount < brief.maxInfluencers, "Max influencers already selected");
        require(_applicationIndex < applications[_briefId].length, "Invalid application index");
        
        InfluencerApplication storage application = applications[_briefId][_applicationIndex];
        require(!application.isSelected, "Influencer already selected");
        
        application.isSelected = true;
        brief.selectedInfluencersCount++;
        
        // If all slots filled, change status to ASSIGNED and set promotion period
        if (brief.selectedInfluencersCount == brief.maxInfluencers) {
            brief.status = Status.ASSIGNED;
            brief.promotionStartTime = block.timestamp;
            brief.promotionEndTime = block.timestamp + brief.promotionDuration;
            // Set verification deadline (2 days after promotion ends)
            brief.verificationDeadline = brief.promotionEndTime + 2 days;
            
            emit PromotionStarted(_briefId, brief.promotionStartTime, brief.promotionEndTime);
            emit VerificationDeadlineSet(_briefId, brief.verificationDeadline);
        }
        
        emit InfluencerSelected(_briefId, application.influencer);
    }
    
    function completeCampaign(bytes32 _briefId) external onlyBusiness briefExists(_briefId) {
        AdBrief storage brief = briefs[_briefId];
        require(brief.business == msg.sender, "Not the brief owner");
        require(brief.status == Status.ASSIGNED, "Brief not in assigned status");
        require(block.timestamp >= brief.promotionEndTime, "Promotion period not yet ended");
        
        // Mark as completed
        brief.status = Status.COMPLETED;
        
        // Distribute budget equally among selected influencers
        uint256 equalShare = brief.budget / brief.selectedInfluencersCount;
        
        for (uint256 i = 0; i < applications[_briefId].length; i++) {
            if (applications[_briefId][i].isSelected) {
                applications[_briefId][i].isApproved = true;
                
                // Calculate platform fee
                uint256 platformFee = (equalShare * platformFeePercentage) / 1000;
                uint256 influencerAmount = equalShare - platformFee;
                
                // Transfer platform fee directly to owner immediately
                require(cUSD.transfer(owner, platformFee), "Platform fee transfer failed");
                emit PlatformFeeTransferred(owner, platformFee);
                
                // Add to pending payments instead of direct transfer
                address influencer = applications[_briefId][i].influencer;
                PendingPayment memory payment = PendingPayment({
                    briefId: _briefId,
                    amount: influencerAmount,
                    isApproved: true
                });
                
                influencerPendingPayments[influencer].push(payment);
                totalPendingAmount[influencer] += influencerAmount;
                
                emit ProofApproved(_briefId, influencer);
                emit PaymentReleased(_briefId, influencer, influencerAmount);
            }
        }
    }

    function applyToBrief(bytes32 _briefId, string calldata _message) external onlyInfluencer briefExists(_briefId) {
        AdBrief storage brief = briefs[_briefId];
        require(brief.status == Status.OPEN, "Brief not open for applications");
        require(block.timestamp < brief.applicationDeadline, "Application deadline passed");
        
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
            isApproved: false
        });
        
        applications[_briefId].push(newApplication);
        influencerApplications[msg.sender].push(_briefId);
        
        emit ApplicationSubmitted(_briefId, msg.sender);
    }
    
    function submitProof(bytes32 _briefId, string calldata _proofLink) external onlyInfluencer briefExists(_briefId) {
        AdBrief storage brief = briefs[_briefId];
        require(brief.status == Status.ASSIGNED, "Brief not in assigned status");
        require(block.timestamp <= brief.promotionEndTime, "Promotion period has ended");
        
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

    // Modified to require verification through Self protocol
    function claimPayments() external onlyInfluencer {
        require(verifiedInfluencers[msg.sender], "Identity verification required");
        
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

    // Implement Self protocol verification function
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
            applicationDeadline: brief.applicationDeadline,
            promotionDuration: brief.promotionDuration,
            promotionStartTime: brief.promotionStartTime,
            promotionEndTime: brief.promotionEndTime,
            maxInfluencers: brief.maxInfluencers,
            selectedInfluencersCount: brief.selectedInfluencersCount,
            targetAudience: brief.targetAudience,
            verificationDeadline: brief.verificationDeadline
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
    
    // Check if an influencer is verified
    function isInfluencerVerified(address _influencer) external view returns (bool) {
        return verifiedInfluencers[_influencer];
    }

    function triggerAutoApproval(bytes32 _briefId) external onlyOwner briefExists(_briefId) {
        AdBrief storage brief = briefs[_briefId];
        require(brief.status == Status.ASSIGNED, "Brief not in assigned status");
        require(block.timestamp > brief.verificationDeadline, "Verification deadline not yet passed");
        
        // Mark brief as completed
        brief.status = Status.COMPLETED;
        
        // Calculate equal share for all selected influencers
        uint256 equalShare = brief.budget / brief.selectedInfluencersCount;
        uint256 platformFee = (equalShare * platformFeePercentage) / 1000;
        uint256 influencerAmount = equalShare - platformFee;
        
        // Process all selected applications
        for (uint256 i = 0; i < applications[_briefId].length; i++) {
            InfluencerApplication storage application = applications[_briefId][i];
            
            if (application.isSelected) {
                // Only approve if proof was submitted
                if (bytes(application.proofLink).length > 0) {
                    application.isApproved = true;
                    
                    // Transfer platform fee directly to owner
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
                    
                    emit ProofApproved(_briefId, influencer);
                    emit PaymentReleased(_briefId, influencer, influencerAmount);
                }
            }
        }
        
        emit AutoApprovalTriggered(_briefId);
    }
}