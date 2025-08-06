// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

import {LibAdsBazaar} from "../libraries/LibAdsBazaar.sol";
import {LibMultiCurrencyAdsBazaar} from "../libraries/LibMultiCurrencyAdsBazaar.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract SparkCampaignFacet is ReentrancyGuard {
    using LibAdsBazaar for LibAdsBazaar.AdsBazaarStorage;
    using LibMultiCurrencyAdsBazaar for LibMultiCurrencyAdsBazaar.MultiCurrencyStorage;

    // Default constants - these will be configurable
    uint256 private constant DEFAULT_MIN_SPARK_DEPOSIT = 2 ether;
    uint256 private constant DEFAULT_MAX_MULTIPLIER = 10;
    uint256 private constant DEFAULT_MIN_DURATION = 1 hours;
    uint256 private constant DEFAULT_MAX_DURATION = 7 days;

    modifier onlyRegistered() {
        LibAdsBazaar.AdsBazaarStorage storage ds = LibAdsBazaar.adsBazaarStorage();
        require(ds.users[msg.sender].isRegistered, "User not registered");
        _;
    }

    modifier sparkExists(bytes32 _sparkId) {
        LibAdsBazaar.AdsBazaarStorage storage ds = LibAdsBazaar.adsBazaarStorage();
        require(ds.sparkCampaigns[_sparkId].creator != address(0), "Spark campaign does not exist");
        _;
    }

    /**
     * @dev Create a new Spark Campaign
     * @param _castUrl Farcaster cast URL to promote
     * @param _tokenAddress Token address for payments (must be whitelisted)
     * @param _multiplier Reward multiplier (1-10x)
     * @param _durationHours Duration in hours (1-168 hours max)
     * @param _maxParticipants Maximum participants (0 = unlimited)
     */
    function createSparkCampaign(
        string memory _castUrl,
        address _tokenAddress,
        uint256 _multiplier,
        uint256 _durationHours,
        uint256 _maxParticipants
    ) external payable onlyRegistered nonReentrant {
        LibAdsBazaar.AdsBazaarStorage storage ds = LibAdsBazaar.adsBazaarStorage();
        LibMultiCurrencyAdsBazaar.MultiCurrencyStorage storage mcs = LibMultiCurrencyAdsBazaar.multiCurrencyStorage();
        
        // Get configuration values (use defaults if not set)
        uint256 minDeposit = ds.minSparkDeposit == 0 ? DEFAULT_MIN_SPARK_DEPOSIT : ds.minSparkDeposit;
        uint256 maxMultiplier = ds.maxMultiplier == 0 ? DEFAULT_MAX_MULTIPLIER : ds.maxMultiplier;
        uint256 minDuration = ds.minSparkDuration == 0 ? DEFAULT_MIN_DURATION : ds.minSparkDuration;
        uint256 maxDuration = ds.maxSparkDuration == 0 ? DEFAULT_MAX_DURATION : ds.maxSparkDuration;
        
        // Validation
        require(bytes(_castUrl).length > 0, "Cast URL cannot be empty");
        require(_multiplier >= 1 && _multiplier <= maxMultiplier, "Invalid multiplier");
        require(_durationHours >= minDuration / 1 hours && _durationHours <= maxDuration / 1 hours, "Invalid duration");
        require(mcs.supportedTokens[_tokenAddress], "Token not supported");
        
        // Check minimum deposit
        uint256 depositAmount;
        if (_tokenAddress == address(0)) {
            // Native token (CELO)
            depositAmount = msg.value;
            require(depositAmount >= minDeposit, "Insufficient deposit");
        } else {
            // ERC20 token
            require(msg.value == 0, "No native token should be sent with ERC20");
            depositAmount = minDeposit; // Use configurable minimum
            IERC20(_tokenAddress).transferFrom(msg.sender, address(this), depositAmount);
        }

        // Generate unique spark ID
        bytes32 sparkId = keccak256(abi.encodePacked(
            msg.sender,
            _castUrl,
            _tokenAddress,
            block.timestamp,
            ds.sparkCounter++
        ));

        // Calculate base reward
        uint256 baseReward = depositAmount / (_maxParticipants == 0 ? 10 : _maxParticipants); // Default to 10 participants if unlimited
        if (_maxParticipants > 0) {
            baseReward = depositAmount / _maxParticipants;
        }

        // Create spark campaign
        LibAdsBazaar.SparkCampaign memory newSpark = LibAdsBazaar.SparkCampaign({
            sparkId: sparkId,
            creator: msg.sender,
            castUrl: _castUrl,
            tokenAddress: _tokenAddress,
            totalBudget: depositAmount,
            remainingBudget: depositAmount,
            baseReward: baseReward,
            multiplier: _multiplier,
            maxParticipants: _maxParticipants,
            createdAt: block.timestamp,
            expiresAt: block.timestamp + (_durationHours * 1 hours),
            status: LibAdsBazaar.SparkStatus.ACTIVE,
            participantCount: 0,
            verifiedCount: 0,
            totalRewardsPaid: 0
        });

        // Store spark campaign
        ds.sparkCampaigns[sparkId] = newSpark;
        ds.userCreatedSparks[msg.sender].push(sparkId);
        ds.activeSparks.push(sparkId);

        // Update multi-currency tracking
        mcs.totalEscrowByToken[_tokenAddress] += depositAmount;

        emit LibAdsBazaar.SparkCampaignCreated(sparkId, msg.sender, _castUrl, _tokenAddress, depositAmount, _multiplier);
    }

    /**
     * @dev Verify and claim reward for Spark Campaign participation
     * This function calls Neynar API to verify if user recasted the original cast
     * @param _sparkId Spark campaign ID
     */
    function verifyAndClaimSpark(
        bytes32 _sparkId
    ) external onlyRegistered sparkExists(_sparkId) {
        LibAdsBazaar.AdsBazaarStorage storage ds = LibAdsBazaar.adsBazaarStorage();
        LibAdsBazaar.SparkCampaign storage spark = ds.sparkCampaigns[_sparkId];
        
        // Validation
        require(spark.status == LibAdsBazaar.SparkStatus.ACTIVE, "Spark campaign not active");
        require(block.timestamp < spark.expiresAt, "Spark campaign has expired");
        require(ds.sparkParticipations[_sparkId][msg.sender].participant == address(0), "Already participated");
        
        // Check max participants limit
        if (spark.maxParticipants > 0) {
            require(spark.participantCount < spark.maxParticipants, "Max participants reached");
        }

        // Create participation record (verification will be done via Neynar API call)
        LibAdsBazaar.SparkParticipation memory participation = LibAdsBazaar.SparkParticipation({
            participant: msg.sender,
            sparkId: _sparkId,
            recastUrl: "", // Not needed - Neynar API will check directly
            timestamp: block.timestamp,
            verified: false, // Will be updated after Neynar verification
            rewarded: false,
            rewardAmount: 0,
            verificationScore: 0
        });

        // Store participation
        ds.sparkParticipations[_sparkId][msg.sender] = participation;
        ds.userParticipatedSparks[msg.sender].push(_sparkId);
        
        // Update counters
        spark.participantCount++;

        // TODO: Backend service will call Neynar API to verify recast and call verifyParticipation()
        // For now, emit event for backend to process
        emit LibAdsBazaar.SparkParticipationSubmitted(_sparkId, msg.sender, "");
    }

    /**
     * @dev Verify participation (only creator can verify)
     * @param _sparkId Spark campaign ID
     * @param _participant Participant address
     * @param _isValid Whether the participation is valid
     */
    function verifyParticipation(
        bytes32 _sparkId,
        address _participant,
        bool _isValid
    ) external sparkExists(_sparkId) {
        LibAdsBazaar.AdsBazaarStorage storage ds = LibAdsBazaar.adsBazaarStorage();
        LibAdsBazaar.SparkCampaign storage spark = ds.sparkCampaigns[_sparkId];
        LibAdsBazaar.SparkParticipation storage participation = ds.sparkParticipations[_sparkId][_participant];
        
        // Only creator can verify
        require(msg.sender == spark.creator, "Only creator can verify");
        require(participation.participant != address(0), "Participation not found");
        require(!participation.verified, "Already verified");
        require(!participation.rewarded, "Already rewarded");

        participation.verified = true;
        participation.verificationScore = _isValid ? 100 : 0;

        if (_isValid) {
            spark.verifiedCount++;
            _rewardParticipant(_sparkId, _participant);
        }

        emit LibAdsBazaar.SparkParticipationVerified(_sparkId, _participant, _isValid);
    }

    /**
     * @dev Batch verify multiple participations
     * @param _sparkId Spark campaign ID
     * @param _participants Array of participant addresses
     * @param _validations Array of validation results
     */
    function batchVerifyParticipations(
        bytes32 _sparkId,
        address[] memory _participants,
        bool[] memory _validations
    ) external sparkExists(_sparkId) {
        require(_participants.length == _validations.length, "Arrays length mismatch");
        require(_participants.length <= 50, "Too many participants"); // Gas limit protection
        
        LibAdsBazaar.AdsBazaarStorage storage ds = LibAdsBazaar.adsBazaarStorage();
        LibAdsBazaar.SparkCampaign storage spark = ds.sparkCampaigns[_sparkId];
        
        // Only creator can verify
        require(msg.sender == spark.creator, "Only creator can verify");

        for (uint256 i = 0; i < _participants.length; i++) {
            LibAdsBazaar.SparkParticipation storage participation = ds.sparkParticipations[_sparkId][_participants[i]];
            
            if (participation.participant != address(0) && !participation.verified && !participation.rewarded) {
                participation.verified = true;
                participation.verificationScore = _validations[i] ? 100 : 0;

                if (_validations[i]) {
                    spark.verifiedCount++;
                    _rewardParticipant(_sparkId, _participants[i]);
                }

                emit LibAdsBazaar.SparkParticipationVerified(_sparkId, _participants[i], _validations[i]);
            }
        }
    }

    /**
     * @dev Internal function to reward participant
     */
    function _rewardParticipant(bytes32 _sparkId, address _participant) internal {
        LibAdsBazaar.AdsBazaarStorage storage ds = LibAdsBazaar.adsBazaarStorage();
        LibMultiCurrencyAdsBazaar.MultiCurrencyStorage storage mcs = LibMultiCurrencyAdsBazaar.multiCurrencyStorage();
        
        LibAdsBazaar.SparkCampaign storage spark = ds.sparkCampaigns[_sparkId];
        LibAdsBazaar.SparkParticipation storage participation = ds.sparkParticipations[_sparkId][_participant];
        
        // Calculate reward with multiplier
        uint256 baseReward = spark.baseReward;
        uint256 rewardAmount = baseReward * spark.multiplier;
        
        // Apply reputation bonus (higher reputation = higher rewards)
        LibAdsBazaar.UserStatus participantStatus = ds.users[_participant].status;
        if (participantStatus == LibAdsBazaar.UserStatus.SUPERSTAR) {
            rewardAmount = rewardAmount * 150 / 100; // 50% bonus
        } else if (participantStatus == LibAdsBazaar.UserStatus.ELITE) {
            rewardAmount = rewardAmount * 125 / 100; // 25% bonus
        } else if (participantStatus == LibAdsBazaar.UserStatus.POPULAR) {
            rewardAmount = rewardAmount * 110 / 100; // 10% bonus
        }
        
        // Ensure we don't exceed remaining budget
        if (rewardAmount > spark.remainingBudget) {
            rewardAmount = spark.remainingBudget;
        }
        
        if (rewardAmount > 0) {
            // Update participation record
            participation.rewarded = true;
            participation.rewardAmount = rewardAmount;
            
            // Update spark campaign
            spark.remainingBudget -= rewardAmount;
            spark.totalRewardsPaid += rewardAmount;
            
            // Transfer reward
            if (spark.tokenAddress == address(0)) {
                // Native token
                payable(_participant).transfer(rewardAmount);
            } else {
                // ERC20 token
                IERC20(spark.tokenAddress).transfer(_participant, rewardAmount);
            }
            
            // Update multi-currency tracking
            mcs.totalEscrowByToken[spark.tokenAddress] -= rewardAmount;
            
            emit LibAdsBazaar.SparkRewardClaimed(_sparkId, _participant, rewardAmount);
            
            // Check if spark is completed (budget exhausted)
            if (spark.remainingBudget == 0) {
                _completeSpark(_sparkId);
            }
        }
    }

    /**
     * @dev Complete spark campaign
     */
    function _completeSpark(bytes32 _sparkId) internal {
        LibAdsBazaar.AdsBazaarStorage storage ds = LibAdsBazaar.adsBazaarStorage();
        LibAdsBazaar.SparkCampaign storage spark = ds.sparkCampaigns[_sparkId];
        
        spark.status = LibAdsBazaar.SparkStatus.COMPLETED;
        
        // Remove from active sparks
        _removeFromActiveSparks(_sparkId);
        
        emit LibAdsBazaar.SparkCampaignCompleted(_sparkId, spark.participantCount, spark.totalRewardsPaid);
    }

    /**
     * @dev Cancel spark campaign (only creator, only if no verified participants)
     * @param _sparkId Spark campaign ID
     */
    function cancelSparkCampaign(bytes32 _sparkId) external sparkExists(_sparkId) nonReentrant {
        LibAdsBazaar.AdsBazaarStorage storage ds = LibAdsBazaar.adsBazaarStorage();
        LibMultiCurrencyAdsBazaar.MultiCurrencyStorage storage mcs = LibMultiCurrencyAdsBazaar.multiCurrencyStorage();
        
        LibAdsBazaar.SparkCampaign storage spark = ds.sparkCampaigns[_sparkId];
        
        require(msg.sender == spark.creator, "Only creator can cancel");
        require(spark.status == LibAdsBazaar.SparkStatus.ACTIVE, "Spark not active");
        require(spark.verifiedCount == 0, "Cannot cancel: verified participants exist");
        
        spark.status = LibAdsBazaar.SparkStatus.CANCELLED;
        
        // Refund remaining budget
        uint256 refundAmount = spark.remainingBudget;
        spark.remainingBudget = 0;
        
        if (refundAmount > 0) {
            if (spark.tokenAddress == address(0)) {
                payable(spark.creator).transfer(refundAmount);
            } else {
                IERC20(spark.tokenAddress).transfer(spark.creator, refundAmount);
            }
            
            mcs.totalEscrowByToken[spark.tokenAddress] -= refundAmount;
        }
        
        // Remove from active sparks
        _removeFromActiveSparks(_sparkId);
        
        emit LibAdsBazaar.SparkCampaignCancelled(_sparkId, refundAmount);
    }

    /**
     * @dev Expire spark campaign (anyone can call after expiration)
     * @param _sparkId Spark campaign ID
     */
    function expireSparkCampaign(bytes32 _sparkId) external sparkExists(_sparkId) {
        LibAdsBazaar.AdsBazaarStorage storage ds = LibAdsBazaar.adsBazaarStorage();
        LibMultiCurrencyAdsBazaar.MultiCurrencyStorage storage mcs = LibMultiCurrencyAdsBazaar.multiCurrencyStorage();
        
        LibAdsBazaar.SparkCampaign storage spark = ds.sparkCampaigns[_sparkId];
        
        require(spark.status == LibAdsBazaar.SparkStatus.ACTIVE, "Spark not active");
        require(block.timestamp >= spark.expiresAt, "Spark not yet expired");
        
        spark.status = LibAdsBazaar.SparkStatus.COMPLETED;
        
        // Refund remaining budget to creator
        uint256 refundAmount = spark.remainingBudget;
        spark.remainingBudget = 0;
        
        if (refundAmount > 0) {
            if (spark.tokenAddress == address(0)) {
                payable(spark.creator).transfer(refundAmount);
            } else {
                IERC20(spark.tokenAddress).transfer(spark.creator, refundAmount);
            }
            
            mcs.totalEscrowByToken[spark.tokenAddress] -= refundAmount;
        }
        
        // Remove from active sparks
        _removeFromActiveSparks(_sparkId);
        
        emit LibAdsBazaar.SparkCampaignCompleted(_sparkId, spark.participantCount, spark.totalRewardsPaid);
    }

    /**
     * @dev Remove spark from active sparks array
     */
    function _removeFromActiveSparks(bytes32 _sparkId) internal {
        LibAdsBazaar.AdsBazaarStorage storage ds = LibAdsBazaar.adsBazaarStorage();
        
        for (uint256 i = 0; i < ds.activeSparks.length; i++) {
            if (ds.activeSparks[i] == _sparkId) {
                ds.activeSparks[i] = ds.activeSparks[ds.activeSparks.length - 1];
                ds.activeSparks.pop();
                break;
            }
        }
    }

    // View functions
    
    /**
     * @dev Get spark campaign details
     */
    function getSparkCampaign(bytes32 _sparkId) external view returns (LibAdsBazaar.SparkCampaign memory) {
        LibAdsBazaar.AdsBazaarStorage storage ds = LibAdsBazaar.adsBazaarStorage();
        return ds.sparkCampaigns[_sparkId];
    }

    /**
     * @dev Get active spark campaigns
     */
    function getActiveSparks(uint256 _offset, uint256 _limit) external view returns (bytes32[] memory) {
        LibAdsBazaar.AdsBazaarStorage storage ds = LibAdsBazaar.adsBazaarStorage();
        
        uint256 total = ds.activeSparks.length;
        if (_offset >= total) {
            return new bytes32[](0);
        }
        
        uint256 end = _offset + _limit;
        if (end > total) {
            end = total;
        }
        
        bytes32[] memory result = new bytes32[](end - _offset);
        for (uint256 i = _offset; i < end; i++) {
            result[i - _offset] = ds.activeSparks[i];
        }
        
        return result;
    }

    /**
     * @dev Get user's created sparks
     */
    function getUserCreatedSparks(address _user) external view returns (bytes32[] memory) {
        LibAdsBazaar.AdsBazaarStorage storage ds = LibAdsBazaar.adsBazaarStorage();
        return ds.userCreatedSparks[_user];
    }

    /**
     * @dev Get user's participated sparks
     */
    function getUserParticipatedSparks(address _user) external view returns (bytes32[] memory) {
        LibAdsBazaar.AdsBazaarStorage storage ds = LibAdsBazaar.adsBazaarStorage();
        return ds.userParticipatedSparks[_user];
    }

    /**
     * @dev Get participation details
     */
    function getSparkParticipation(bytes32 _sparkId, address _participant) external view returns (LibAdsBazaar.SparkParticipation memory) {
        LibAdsBazaar.AdsBazaarStorage storage ds = LibAdsBazaar.adsBazaarStorage();
        return ds.sparkParticipations[_sparkId][_participant];
    }

    /**
     * @dev Get spark campaigns by multiplier (trending)
     */
    function getSparksByMultiplier(uint256 _minMultiplier) external view returns (bytes32[] memory) {
        LibAdsBazaar.AdsBazaarStorage storage ds = LibAdsBazaar.adsBazaarStorage();
        
        bytes32[] memory activeSparks = ds.activeSparks;
        bytes32[] memory results = new bytes32[](activeSparks.length);
        uint256 count = 0;
        
        for (uint256 i = 0; i < activeSparks.length; i++) {
            if (ds.sparkCampaigns[activeSparks[i]].multiplier >= _minMultiplier) {
                results[count] = activeSparks[i];
                count++;
            }
        }
        
        // Resize array to actual count
        bytes32[] memory filteredResults = new bytes32[](count);
        for (uint256 i = 0; i < count; i++) {
            filteredResults[i] = results[i];
        }
        
        return filteredResults;
    }

    /**
     * @dev Check if user has participated in spark
     */
    function hasParticipated(bytes32 _sparkId, address _user) external view returns (bool) {
        LibAdsBazaar.AdsBazaarStorage storage ds = LibAdsBazaar.adsBazaarStorage();
        return ds.sparkParticipations[_sparkId][_user].participant != address(0);
    }

    /**
     * @dev Get estimated earnings for a spark campaign
     */
    function getEstimatedEarnings(bytes32 _sparkId, address _participant) external view returns (uint256) {
        LibAdsBazaar.AdsBazaarStorage storage ds = LibAdsBazaar.adsBazaarStorage();
        LibAdsBazaar.SparkCampaign memory spark = ds.sparkCampaigns[_sparkId];
        
        if (spark.creator == address(0)) return 0;
        
        uint256 baseReward = spark.baseReward * spark.multiplier;
        
        // Apply reputation bonus
        LibAdsBazaar.UserStatus participantStatus = ds.users[_participant].status;
        if (participantStatus == LibAdsBazaar.UserStatus.SUPERSTAR) {
            baseReward = baseReward * 150 / 100;
        } else if (participantStatus == LibAdsBazaar.UserStatus.ELITE) {
            baseReward = baseReward * 125 / 100;
        } else if (participantStatus == LibAdsBazaar.UserStatus.POPULAR) {
            baseReward = baseReward * 110 / 100;
        }
        
        return baseReward;
    }

    // Configuration functions (only owner)
    
    /**
     * @dev Set Spark Campaign configuration
     * @param _minDeposit Minimum deposit to create spark
     * @param _maxMultiplier Maximum multiplier allowed
     * @param _minDuration Minimum spark duration in seconds
     * @param _maxDuration Maximum spark duration in seconds
     */
    function setSparkConfiguration(
        uint256 _minDeposit,
        uint256 _maxMultiplier,
        uint256 _minDuration,
        uint256 _maxDuration
    ) external {
        LibAdsBazaar.enforceOwner();
        LibAdsBazaar.AdsBazaarStorage storage ds = LibAdsBazaar.adsBazaarStorage();
        
        require(_minDeposit > 0, "Min deposit must be greater than 0");
        require(_maxMultiplier >= 1 && _maxMultiplier <= 100, "Invalid max multiplier");
        require(_minDuration >= 1 minutes, "Min duration too short");
        require(_maxDuration >= _minDuration && _maxDuration <= 30 days, "Invalid max duration");
        
        ds.minSparkDeposit = _minDeposit;
        ds.maxMultiplier = _maxMultiplier;
        ds.minSparkDuration = _minDuration;
        ds.maxSparkDuration = _maxDuration;
        
        emit LibAdsBazaar.SparkConfigurationUpdated(_minDeposit, _maxMultiplier, 0, _minDuration, _maxDuration);
    }

    /**
     * @dev Get current Spark Campaign configuration
     */
    function getSparkConfiguration() external view returns (
        uint256 minDeposit,
        uint256 maxMultiplier,
        uint256 minDuration,
        uint256 maxDuration
    ) {
        LibAdsBazaar.AdsBazaarStorage storage ds = LibAdsBazaar.adsBazaarStorage();
        
        return (
            ds.minSparkDeposit == 0 ? DEFAULT_MIN_SPARK_DEPOSIT : ds.minSparkDeposit,
            ds.maxMultiplier == 0 ? DEFAULT_MAX_MULTIPLIER : ds.maxMultiplier,
            ds.minSparkDuration == 0 ? DEFAULT_MIN_DURATION : ds.minSparkDuration,
            ds.maxSparkDuration == 0 ? DEFAULT_MAX_DURATION : ds.maxSparkDuration
        );
    }

    /**
     * @dev Initialize Spark Campaign configuration with defaults
     */
    function initializeSparkConfiguration() external {
        LibAdsBazaar.enforceOwner();
        LibAdsBazaar.AdsBazaarStorage storage ds = LibAdsBazaar.adsBazaarStorage();
        
        // Only initialize if not already set
        if (ds.minSparkDeposit == 0) {
            ds.minSparkDeposit = DEFAULT_MIN_SPARK_DEPOSIT;
            ds.maxMultiplier = DEFAULT_MAX_MULTIPLIER;
            ds.minSparkDuration = DEFAULT_MIN_DURATION;
            ds.maxSparkDuration = DEFAULT_MAX_DURATION;
            
            emit LibAdsBazaar.SparkConfigurationUpdated(
                DEFAULT_MIN_SPARK_DEPOSIT,
                DEFAULT_MAX_MULTIPLIER,
                0,
                DEFAULT_MIN_DURATION,
                DEFAULT_MAX_DURATION
            );
        }
    }
}