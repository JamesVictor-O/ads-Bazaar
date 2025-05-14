// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;
import "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-contracts/contracts/access/Ownable.sol";


contract AdsBazaar {
    address public owner;
    IERC20 public cUSD;
    uint256 public platformFeePercentage = 5; 

    constructor(address _cUSD) {
        cUSD = IERC20(_cUSD);
        owner = msg.sender;
    }

    enum Status {
        OPEN,           
        ASSIGNED,       
        COMPLETED,      
        CANCELLED       
    }

    struct AdBrief {
        bytes32 briefId;
        address business;
        string description;
        uint256 budget;
        Status status;
        uint256 applicationDeadline; 
        uint256 promotionDuration;   
        uint256 promotionStartTime;  
        uint256 promotionEndTime;  
        uint256 maxInfluencers;
        uint256 selectedInfluencersCount;
    }

    struct InfluencerApplication {
        address influencer;
        string message;
        uint256 timestamp;
        bool isSelected;
        bool hasClaimed;
        string proofLink;
    }

    struct UserProfile {
        bool isRegistered;
        bool isBusiness;
        bool isInfluencer;
        string profileData; 
    }

   
    mapping(bytes32 => AdBrief) public briefs;
    mapping(bytes32 => InfluencerApplication[]) public applications;
    mapping(address => UserProfile) public users;
    mapping(address => bytes32[]) public businessBriefs;
    mapping(address => bytes32[]) public influencerApplications;

    // Events
    event UserRegistered(address indexed user, bool isBusiness, bool isInfluencer);
    event BriefCreated(bytes32 indexed briefId, address indexed business, uint256 budget, uint256 maxInfluencers);
    event BriefCancelled(bytes32 indexed briefId);
    event ApplicationSubmitted(bytes32 indexed briefId, address indexed influencer);
    event InfluencerSelected(bytes32 indexed briefId, address indexed influencer);
    event ProofSubmitted(bytes32 indexed briefId, address indexed influencer, string proofLink);
    event PaymentReleased(bytes32 indexed briefId, address indexed influencer, uint256 amount);
    event PromotionStarted(bytes32 indexed briefId, uint256 startTime, uint256 endTime);

    
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

    
    function createAdBrief(
        string calldata _description,
        uint256 _budget,
        uint256 _applicationDeadline,
        uint256 _promotionDuration,
        uint256 _maxInfluencers
    ) external onlyBusiness {
        require(_budget > 0, "Budget must be greater than 0");
        require(_applicationDeadline > block.timestamp, "Application deadline must be in the future");
        require(_promotionDuration > 0, "Promotion duration must be greater than 0");
        require(_maxInfluencers > 0, "Max influencers must be greater than 0");
        
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
            description: _description,
            budget: _budget,
            status: Status.OPEN,
            applicationDeadline: _applicationDeadline,
            promotionDuration: _promotionDuration,
            promotionStartTime: 0, 
            promotionEndTime: 0,   
            maxInfluencers: _maxInfluencers,
            selectedInfluencersCount: 0
        });
        
        // Add to business briefs
        businessBriefs[msg.sender].push(briefId);
        
        emit BriefCreated(briefId, msg.sender, _budget, _maxInfluencers);
    }
    
    function cancelAdBrief(bytes32 _briefId) external onlyBusiness briefExists(_briefId) {
        AdBrief storage brief = briefs[_briefId];
        require(brief.business == msg.sender, "Not the brief owner");
        require(brief.status == Status.OPEN, "Brief not in open status");
        
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
            
            emit PromotionStarted(_briefId, brief.promotionStartTime, brief.promotionEndTime);
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
                applications[_briefId][i].hasClaimed = true;
                
                // Calculate platform fee (platformFeePercentage is in tenths of a percent)
                uint256 platformFee = (equalShare * platformFeePercentage) / 1000;
                uint256 influencerAmount = equalShare - platformFee;
                
                // Transfer to influencer
                require(cUSD.transfer(applications[_briefId][i].influencer, influencerAmount), "Transfer failed");
                
                // Transfer platform fee
                require(cUSD.transfer(owner, platformFee), "Platform fee transfer failed");
                
                emit PaymentReleased(_briefId, applications[_briefId][i].influencer, influencerAmount);
            }
        }
    }

   
    function applyToBrief(bytes32 _briefId, string calldata _message) external onlyInfluencer briefExists(_briefId) {
        AdBrief storage brief = briefs[_briefId];
        require(brief.status == Status.OPEN, "Brief not open for applications");
        require(block.timestamp < brief.applicationDeadline, "Application deadline passed");
        
       
        for (uint256 i = 0; i < applications[_briefId].length; i++) {
            require(applications[_briefId][i].influencer != msg.sender, "Already applied");
        }
        
        
        InfluencerApplication memory newApplication = InfluencerApplication({
            influencer: msg.sender,
            message: _message,
            timestamp: block.timestamp,
            isSelected: false,
            hasClaimed: false,
            proofLink: ""
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

   
    function getAdBrief(bytes32 _briefId) external view returns (
        address business,
        string memory description,
        uint256 budget,
        Status status,
        uint256 applicationDeadline,
        uint256 promotionDuration,
        uint256 promotionStartTime,
        uint256 promotionEndTime,
        uint256 maxInfluencers,
        uint256 selectedInfluencersCount
    ) {
        AdBrief storage brief = briefs[_briefId];
        return (
            brief.business,
            brief.description,
            brief.budget,
            brief.status,
            brief.applicationDeadline,
            brief.promotionDuration,
            brief.promotionStartTime,
            brief.promotionEndTime,
            brief.maxInfluencers,
            brief.selectedInfluencersCount
        );
    }
    
    function getBusinessBriefs(address _business) external view returns (bytes32[] memory) {
        return businessBriefs[_business];
    }
    
    function getInfluencerApplications(address _influencer) external view returns (bytes32[] memory) {
        return influencerApplications[_influencer];
    }
    
    function getBriefApplications(bytes32 _briefId) external view returns (
        address[] memory influencers,
        string[] memory messages,
        uint256[] memory timestamps,
        bool[] memory isSelected,
        bool[] memory hasClaimed,
        string[] memory proofLinks
    ) {
        InfluencerApplication[] storage briefApps = applications[_briefId];
        uint256 count = briefApps.length;
        
        influencers = new address[](count);
        messages = new string[](count);
        timestamps = new uint256[](count);
        isSelected = new bool[](count);
        hasClaimed = new bool[](count);
        proofLinks = new string[](count);
        
        for (uint256 i = 0; i < count; i++) {
            influencers[i] = briefApps[i].influencer;
            messages[i] = briefApps[i].message;
            timestamps[i] = briefApps[i].timestamp;
            isSelected[i] = briefApps[i].isSelected;
            hasClaimed[i] = briefApps[i].hasClaimed;
            proofLinks[i] = briefApps[i].proofLink;
        }
        
        return (influencers, messages, timestamps, isSelected, hasClaimed, proofLinks);
    }
    
    
    function setPlatformFee(uint256 _newFeePercentage) external onlyOwner {
        require(_newFeePercentage <= 10, "Fee too high"); // Max 1%
        platformFeePercentage = _newFeePercentage;
    }
    
    function withdrawFees() external onlyOwner {
        uint256 balance = cUSD.balanceOf(address(this));
        require(balance > 0, "No fees to withdraw");
        require(cUSD.transfer(owner, balance), "Transfer failed");
    }
}