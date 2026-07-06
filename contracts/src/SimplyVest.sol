// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ISimplyVest} from "./interfaces/ISimplyVest.sol";

contract SimplyVest is ISimplyVest {
    using SafeERC20 for IERC20;

    uint256 public constant MIN_DURATION = 60;

    mapping(bytes32 => Stream) public streams;
    mapping(bytes32 => MilestoneStream) public milestoneStreams;
    mapping(address => uint256) public creatorNonces;
    bytes32[] public streamIds;
    bytes32[] public milestoneStreamIds;

    constructor() {}

    // ──────────────────────────────────────────────
    //  Time-based Vesting Streams
    // ──────────────────────────────────────────────

    function createStream(
        address recipient,
        address token,
        uint256 amount,
        uint256 startTime,
        uint256 cliffTime,
        uint256 endTime
    ) external returns (bytes32 streamId) {
        if (amount == 0) revert ZeroAmount();
        if (recipient == address(0)) revert InvalidRecipient();
        if (startTime >= endTime) revert InvalidTimeRange();
        if (cliffTime != 0 && (cliffTime < startTime || cliffTime > endTime)) revert InvalidCliffTime();
        if (endTime - startTime < MIN_DURATION) revert DurationTooShort();
        if (startTime <= block.timestamp) revert StartTimeInPast();

        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);

        uint256 nonce = creatorNonces[msg.sender]++;
        streamId = keccak256(abi.encodePacked(msg.sender, recipient, token, nonce));

        streams[streamId] = Stream({
            creator: msg.sender,
            recipient: recipient,
            token: token,
            amount: amount,
            amountWithdrawn: 0,
            startTime: startTime,
            cliffTime: cliffTime,
            endTime: endTime,
            cancelled: false
        });

        streamIds.push(streamId);

        emit StreamCreated(streamId, msg.sender, recipient, token, amount, startTime, cliffTime, endTime);
    }

    function withdraw(bytes32 streamId, uint256 amount) external {
        Stream storage stream = streams[streamId];

        if (stream.cancelled) revert AlreadyCancelled();
        if (block.timestamp < stream.cliffTime) revert CliffNotReached();
        if (amount == 0) revert ZeroAmount();

        uint256 claimable = getClaimable(streamId);
        if (claimable == 0) revert NothingToWithdraw();
        if (amount > claimable) revert ExceedsClaimable();

        stream.amountWithdrawn += amount;

        IERC20(stream.token).safeTransfer(msg.sender, amount);

        emit TokensClaimed(streamId, msg.sender, stream.amount, amount, stream.amountWithdrawn);

        if (stream.amountWithdrawn == stream.amount) {
            emit StreamCompleted(streamId, stream.recipient, stream.amount);
        }
    }

    function cancel(bytes32 streamId) external {
        Stream storage stream = streams[streamId];

        if (msg.sender != stream.creator) revert Unauthorized();
        if (stream.cancelled) revert AlreadyCancelled();
        if (block.timestamp >= stream.endTime) revert StreamExpired();

        uint256 vested = _computeVested(stream);
        uint256 recipientShare = vested - stream.amountWithdrawn;
        uint256 creatorShare = stream.amount - vested;

        stream.cancelled = true;
        stream.amountWithdrawn = stream.amount;

        if (recipientShare > 0) {
            IERC20(stream.token).safeTransfer(stream.recipient, recipientShare);
        }
        if (creatorShare > 0) {
            IERC20(stream.token).safeTransfer(stream.creator, creatorShare);
        }

        emit StreamCancelled(streamId, stream.creator, stream.recipient, recipientShare, creatorShare);
    }

    // ──────────────────────────────────────────────
    //  Milestone-gated Vesting Streams
    // ──────────────────────────────────────────────

    function createMilestoneStream(address recipient, address token, uint256 amount, address milestoneAuthority)
        external
        returns (bytes32 streamId)
    {
        if (amount == 0) revert ZeroAmount();
        if (recipient == address(0)) revert InvalidRecipient();
        if (milestoneAuthority == address(0)) revert InvalidMilestoneAuthority();

        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);

        uint256 nonce = creatorNonces[msg.sender]++;
        streamId = keccak256(abi.encodePacked("milestone", msg.sender, recipient, token, nonce));

        milestoneStreams[streamId] = MilestoneStream({
            creator: msg.sender,
            recipient: recipient,
            token: token,
            amount: amount,
            amountWithdrawn: 0,
            milestoneAuthority: milestoneAuthority,
            milestoneReached: false,
            cancelled: false
        });

        milestoneStreamIds.push(streamId);

        emit MilestoneStreamCreated(streamId, msg.sender, recipient, token, amount, milestoneAuthority);
    }

    function triggerMilestone(bytes32 streamId) external {
        MilestoneStream storage ms = milestoneStreams[streamId];

        if (msg.sender != ms.milestoneAuthority) revert Unauthorized();
        if (ms.cancelled) revert AlreadyCancelled();
        if (ms.milestoneReached) revert AlreadyTriggered();

        ms.milestoneReached = true;

        emit MilestoneTriggered(streamId, msg.sender);
    }

    function withdrawMilestone(bytes32 streamId) external {
        MilestoneStream storage ms = milestoneStreams[streamId];

        if (msg.sender != ms.recipient) revert Unauthorized();
        if (ms.cancelled) revert AlreadyCancelled();
        if (!ms.milestoneReached) revert NothingToWithdraw();
        if (ms.amountWithdrawn > 0) revert AlreadyWithdrawn();

        ms.amountWithdrawn = ms.amount;

        IERC20(ms.token).safeTransfer(ms.recipient, ms.amount);

        emit MilestoneCompleted(streamId, ms.recipient, ms.amount);
    }

    function cancelMilestone(bytes32 streamId) external {
        MilestoneStream storage ms = milestoneStreams[streamId];

        if (msg.sender != ms.creator) revert Unauthorized();
        if (ms.cancelled) revert AlreadyCancelled();
        if (ms.milestoneReached) revert FullyVested();

        uint256 returnAmount = ms.amount - ms.amountWithdrawn;
        ms.cancelled = true;

        if (returnAmount > 0) {
            IERC20(ms.token).safeTransfer(ms.creator, returnAmount);
        }

        emit MilestoneCancelled(streamId, ms.creator, ms.recipient, returnAmount);
    }

    // ──────────────────────────────────────────────
    //  View Functions
    // ──────────────────────────────────────────────

    function getClaimable(bytes32 streamId) public view returns (uint256) {
        Stream storage stream = streams[streamId];
        if (stream.cancelled) return 0;

        uint256 vested = _computeVested(stream);
        if (vested <= stream.amountWithdrawn) return 0;
        return vested - stream.amountWithdrawn;
    }

    function getStatus(bytes32 streamId) external view returns (uint8) {
        Stream storage stream = streams[streamId];
        if (stream.cancelled) return 2;
        if (stream.amountWithdrawn == stream.amount) return 1;
        if (block.timestamp >= stream.endTime && stream.amountWithdrawn < stream.amount) {
            uint256 claimed = stream.amountWithdrawn;
            if (claimed > 0) return 1;
            return 1;
        }
        return 0;
    }

    function getStream(bytes32 streamId) external view returns (Stream memory) {
        return streams[streamId];
    }

    function getMilestoneStream(bytes32 streamId) external view returns (MilestoneStream memory) {
        return milestoneStreams[streamId];
    }

    function getMilestoneClaimable(bytes32 streamId) external view returns (uint256) {
        MilestoneStream storage ms = milestoneStreams[streamId];
        if (ms.cancelled) return 0;
        if (!ms.milestoneReached) return 0;
        return ms.amount - ms.amountWithdrawn;
    }

    function getStreamCount() external view returns (uint256) {
        return streamIds.length;
    }

    function getMilestoneStreamCount() external view returns (uint256) {
        return milestoneStreamIds.length;
    }

    // ──────────────────────────────────────────────
    //  Internal
    // ──────────────────────────────────────────────

    function _computeVested(Stream storage stream) internal view returns (uint256) {
        if (block.timestamp < stream.cliffTime) return 0;
        if (block.timestamp >= stream.endTime) return stream.amount;

        uint256 elapsed = block.timestamp - stream.startTime;
        uint256 duration = stream.endTime - stream.startTime;
        uint256 vested = stream.amount * elapsed / duration;
        return vested > stream.amount ? stream.amount : vested;
    }
}
