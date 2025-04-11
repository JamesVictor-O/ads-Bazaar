// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;
import "openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-contracts/contracts/access/Ownable.sol";
import "./Library/Error.sol";
import "./Library/Event.sol";
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

    mapping(bytes32 => AdBrief) public briefs;

    function createBrief(
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

    function cancelBrief(bytes32 _briefId) external {
        Brief storage brief = briefs[briefId];
        require(msg.sender == brief.owner == msg.sender, Error.NotOwner());
        require(brief.status == Status.OPEN, "Not Open");
        require(brief.influencer == address(0), Error.AllReadyAssigned());

        brief.status = Status.CANCELLED;
        require(usdcToken.transfer(brief.owner, brief.budget), "Refund failed");
        
       emit Event.BriefCanceled();
    }

}
