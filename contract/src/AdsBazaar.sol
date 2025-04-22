// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;
import "openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-contracts/contracts/access/Ownable.sol";

import "./Library/Event.sol";
import "./Library/Error.sol";

contract AdsBazaar {
    address public owner;
    IERC20 public usdcToken;

    constructor(address _usdcToken) {
        usdcToken = IERC20(_usdcToken);
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
        address owner;
        string description;
        uint256 budget;
        Status status;
        uint256 deadline;
        address influencer;
    }

    // comment structs
    struct Comment {
        address influencer;
        string comment;
        uint256 timestamp;
        bool isSelected;
    }

    mapping(bytes32 => Comment[]) public briefComments;
    mapping(bytes32 => AdBrief) public briefs;

    // creating Ads
    function createAds(
        string memory _description,
        uint256 _budget,
        uint _deadline
    ) external payable {
        require(msg.sender != address(0), Error.InvalidAddress());
        require(_budget >= msg.value, Error.InsufficientAmount());
        require(_deadline > block.timestamp, "Invalid deadline");
        require(
            usdcToken.transferFrom(msg.sender, address(this), _budget),
            "USDC transfer failed"
        );

        bytes32 briefId = keccak256(
            abi.encodePacked(
                msg.sender,
                _description,
                _budget,
                _deadline,
                block.timestamp
            )
        );

        briefs[briefId] = AdBrief({
            briefId: briefId,
            owner: msg.sender,
            description: _description,
            budget: _budget,
            status: Status.OPEN,
            deadline: _deadline,
            influencer: address(0)
        });

        emit Event.BriefCreated(briefId, msg.sender);
    }

    function cancelAds(bytes32 _briefId) external {
        AdBrief storage brief = briefs[_briefId];
        require(brief.owner == msg.sender, Error.NotOwner());
        require(brief.status == Status.OPEN, "Not Open");
        require(brief.influencer == address(0), Error.AllReadyAssigned());

        brief.status = Status.CANCELLED;
        require(usdcToken.transfer(brief.owner, brief.budget), "Refund failed");

        emit Event.BriefCanceled();
    }

    function getAdsDetails(
        bytes32 briefId
    ) external view returns (AdBrief memory) {
        return briefs[briefId];
    }

    // creators registering for ads

    function commentOnAds(bytes32 _briefId, string memory _message) external {
        AdBrief storage brief = briefs[_briefId];

        require(brief.status == Status.OPEN, "Not Open");

        Comment memory newComment = Comment({
            influencer: msg.sender,
            comment: _message,
            timestamp: block.timestamp,
            isSelected: false
        });
        briefComments[_briefId].push(newComment);

        emit Event.AdCommentAdded(_briefId, msg.sender, _message);
    }

    function selectInfluencer(
        bytes32 _briefId,
        uint256 _commentIndex
    ) external {
        AdBrief storage brief = briefs[_briefId];
        require(brief.owner == msg.sender, "Not the ad owner");
        require(brief.status == Status.OPEN, "Ad not open");
        require(
            _commentIndex < briefComments[_briefId].length,
            "Invalid comment index"
        );

        address selectedInfluencer = briefComments[_briefId][_commentIndex].influencer;
        require(
            selectedInfluencer != address(0),
            "No influencer found for this comment"
        );
        brief.influencer = selectedInfluencer;
        brief.status = Status.ASSIGNED;
        briefComments[_briefId][_commentIndex].isSelected = true;
        emit Event.InfluencerSelected(_briefId, selectedInfluencer);
    }
}
