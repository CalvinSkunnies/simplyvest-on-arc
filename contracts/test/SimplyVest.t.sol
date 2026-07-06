// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {SimplyVest} from "../src/SimplyVest.sol";
import {ISimplyVest} from "../src/interfaces/ISimplyVest.sol";
import {MockERC20} from "./MockERC20.sol";

contract SimplyVestTest is Test {
    SimplyVest vest;
    MockERC20 token;

    address creator = address(0x1);
    address recipient = address(0x2);
    address other = address(0x4);

    uint256 constant AMOUNT = 1000 ether;
    uint256 constant START = 1000;
    uint256 constant CLIFF = 2000;
    uint256 constant END = 3000;

    function setUp() public {
        vest = new SimplyVest();
        token = new MockERC20();
        token.mint(creator, AMOUNT * 10);
        vm.prank(creator);
        token.approve(address(vest), AMOUNT * 10);
    }

    // ── Stream Creation ──

    function test_CreateStream() public {
        vm.warp(START - 1);
        vm.prank(creator);
        bytes32 id = vest.createStream(recipient, address(token), AMOUNT, START, CLIFF, END);

        ISimplyVest.Stream memory s = vest.getStream(id);
        assertEq(s.creator, creator);
        assertEq(s.recipient, recipient);
        assertEq(s.token, address(token));
        assertEq(s.amount, AMOUNT);
        assertEq(s.startTime, START);
        assertEq(s.cliffTime, CLIFF);
        assertEq(s.endTime, END);
        assertFalse(s.cancelled);
        assertEq(s.amountWithdrawn, 0);
        assertEq(token.balanceOf(address(vest)), AMOUNT);
    }

    function test_RevertWhen_ZeroAmount() public {
        vm.warp(START - 1);
        vm.prank(creator);
        vm.expectRevert(ISimplyVest.ZeroAmount.selector);
        vest.createStream(recipient, address(token), 0, START, CLIFF, END);
    }

    function test_RevertWhen_InvalidTimeRange() public {
        vm.warp(START - 1);
        vm.prank(creator);
        vm.expectRevert(ISimplyVest.InvalidTimeRange.selector);
        vest.createStream(recipient, address(token), AMOUNT, END, CLIFF, START);
    }

    function test_RevertWhen_InvalidCliff() public {
        vm.warp(START - 1);
        vm.prank(creator);
        vm.expectRevert(ISimplyVest.InvalidCliffTime.selector);
        vest.createStream(recipient, address(token), AMOUNT, START, END + 1, END);
    }

    function test_RevertWhen_DurationTooShort() public {
        vm.warp(START - 1);
        vm.prank(creator);
        vm.expectRevert(ISimplyVest.DurationTooShort.selector);
        vest.createStream(recipient, address(token), AMOUNT, START, 0, START + 30);
    }

    function test_RevertWhen_StartTimeInPast() public {
        vm.warp(START + 1);
        vm.prank(creator);
        vm.expectRevert(ISimplyVest.StartTimeInPast.selector);
        vest.createStream(recipient, address(token), AMOUNT, START, CLIFF, END);
    }

    function test_RevertWhen_ZeroRecipient() public {
        vm.warp(START - 1);
        vm.prank(creator);
        vm.expectRevert(ISimplyVest.InvalidRecipient.selector);
        vest.createStream(address(0), address(token), AMOUNT, START, CLIFF, END);
    }

    // ── Withdraw ──

    function test_Withdraw_AfterCliff() public {
        bytes32 id = _createDefaultStream();

        vm.warp(CLIFF + 1);
        uint256 claimable = vest.getClaimable(id);
        assertGt(claimable, 0);
        assertLt(claimable, AMOUNT);

        uint256 recipientBefore = token.balanceOf(recipient);
        vm.prank(recipient);
        vest.withdraw(id, claimable);

        assertEq(token.balanceOf(recipient), recipientBefore + claimable);
        ISimplyVest.Stream memory s = vest.getStream(id);
        assertEq(s.amountWithdrawn, claimable);
    }

    function test_Withdraw_Rejects_ZeroAmount() public {
        bytes32 id = _createDefaultStream();
        vm.warp(CLIFF + 1);
        vm.prank(recipient);
        vm.expectRevert(ISimplyVest.ZeroAmount.selector);
        vest.withdraw(id, 0);
    }

    function test_Withdraw_Rejects_BeforeCliff() public {
        bytes32 id = _createDefaultStream();
        vm.warp(CLIFF - 1);
        vm.prank(recipient);
        vm.expectRevert(ISimplyVest.CliffNotReached.selector);
        vest.withdraw(id, 1);
    }

    function test_Withdraw_Rejects_ExcessAmount() public {
        bytes32 id = _createDefaultStream();
        vm.warp(CLIFF + 1);
        uint256 claimable = vest.getClaimable(id);
        vm.prank(recipient);
        vm.expectRevert(ISimplyVest.ExceedsClaimable.selector);
        vest.withdraw(id, claimable + 1);
    }

    function test_Withdraw_FullyVested_Completes() public {
        bytes32 id = _createDefaultStream();
        vm.warp(END + 1);
        uint256 claimable = vest.getClaimable(id);
        assertEq(claimable, AMOUNT);

        vm.prank(recipient);
        vest.withdraw(id, AMOUNT);

        ISimplyVest.Stream memory s = vest.getStream(id);
        assertEq(s.amountWithdrawn, AMOUNT);
        assertEq(token.balanceOf(recipient), AMOUNT);
        assertEq(token.balanceOf(address(vest)), 0);
    }

    // ── Cancel ──

    function test_Cancel_SplitsCorrectly() public {
        bytes32 id = _createDefaultStream();
        vm.warp(START + (END - START) / 2);
        uint256 expectedVested = AMOUNT * (uint256(block.timestamp) - START) / (END - START);

        uint256 balanceBefore_recipient = token.balanceOf(recipient);
        uint256 balanceBefore_creator = token.balanceOf(creator);

        vm.prank(creator);
        vest.cancel(id);

        uint256 receivedByRecipient = token.balanceOf(recipient) - balanceBefore_recipient;
        uint256 returnedToCreator = token.balanceOf(creator) - balanceBefore_creator;

        assertEq(receivedByRecipient, expectedVested);
        assertEq(returnedToCreator, AMOUNT - expectedVested);
    }

    function test_RevertWhen_NonCreatorCancels() public {
        bytes32 id = _createDefaultStream();
        vm.prank(other);
        vm.expectRevert(ISimplyVest.Unauthorized.selector);
        vest.cancel(id);
    }

    function test_RevertWhen_CancelAfterEnd() public {
        bytes32 id = _createDefaultStream();
        vm.warp(END + 1);
        vm.prank(creator);
        vm.expectRevert(ISimplyVest.StreamExpired.selector);
        vest.cancel(id);
    }

    function test_RevertWhen_CancelAfterFullWithdraw() public {
        bytes32 id = _createDefaultStream();
        vm.warp(END + 1);
        vm.prank(recipient);
        vest.withdraw(id, AMOUNT);

        vm.prank(creator);
        vm.expectRevert(ISimplyVest.StreamExpired.selector);
        vest.cancel(id);
    }

    // ── Edge Cases ──

    function test_SelfVesting() public {
        token.mint(recipient, AMOUNT);
        vm.prank(recipient);
        token.approve(address(vest), AMOUNT);

        vm.warp(START - 1);
        vm.prank(recipient);
        bytes32 id = vest.createStream(recipient, address(token), AMOUNT, START, CLIFF, END);

        vm.warp(END + 1);
        vm.prank(recipient);
        vest.withdraw(id, AMOUNT);

        assertEq(token.balanceOf(recipient), AMOUNT);
    }

    function test_MultipleStreams_SamePair() public {
        vm.warp(START - 1);
        vm.prank(creator);
        bytes32 id1 = vest.createStream(recipient, address(token), AMOUNT, START, CLIFF, END);
        vm.prank(creator);
        bytes32 id2 = vest.createStream(recipient, address(token), AMOUNT, START + 10, CLIFF + 10, END + 10);
        assertTrue(id1 != id2);
        assertEq(vest.getStreamCount(), 2);
    }

    function test_NoClaimable_WhenCancelled() public {
        bytes32 id = _createDefaultStream();
        vm.prank(creator);
        vest.cancel(id);
        assertEq(vest.getClaimable(id), 0);
    }

    function test_ClaimableZero_BeforeCliff() public {
        bytes32 id = _createDefaultStream();
        vm.warp(START + 1);
        assertEq(vest.getClaimable(id), 0);
    }

    function test_VestingMath_Exact() public {
        vm.warp(START - 1);
        vm.prank(creator);
        bytes32 id = vest.createStream(recipient, address(token), 1000, START, 0, START + 100);
        vm.warp(START + 50);
        assertEq(vest.getClaimable(id), 500);
        vm.warp(START + 100);
        assertEq(vest.getClaimable(id), 1000);
    }

    // ── Helpers ──

    function _createDefaultStream() internal returns (bytes32) {
        vm.warp(START - 1);
        vm.prank(creator);
        return vest.createStream(recipient, address(token), AMOUNT, START, CLIFF, END);
    }
}
