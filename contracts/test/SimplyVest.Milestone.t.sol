// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {SimplyVest} from "../src/SimplyVest.sol";
import {ISimplyVest} from "../src/interfaces/ISimplyVest.sol";
import {MockERC20} from "./MockERC20.sol";

contract SimplyVestMilestoneTest is Test {
    SimplyVest vest;
    MockERC20 token;

    address creator = address(0x1);
    address recipient = address(0x2);
    address milestoneAuth = address(0x3);
    address other = address(0x100);

    uint256 constant AMOUNT = 1000 ether;

    function setUp() public {
        vest = new SimplyVest();
        token = new MockERC20();
        token.mint(creator, AMOUNT * 10);
        vm.prank(creator);
        token.approve(address(vest), AMOUNT * 10);
    }

    // ── Milestone Stream Creation ──

    function test_CreateMilestoneStream() public {
        bytes32 id = _createDefaultMilestone();

        ISimplyVest.MilestoneStream memory ms = vest.getMilestoneStream(id);
        assertEq(ms.creator, creator);
        assertEq(ms.recipient, recipient);
        assertEq(ms.token, address(token));
        assertEq(ms.amount, AMOUNT);
        assertEq(ms.milestoneAuthority, milestoneAuth);
        assertFalse(ms.milestoneReached);
        assertFalse(ms.cancelled);
        assertEq(ms.amountWithdrawn, 0);
        assertEq(token.balanceOf(address(vest)), AMOUNT);
    }

    function test_RevertWhen_ZeroAmountMilestone() public {
        vm.expectRevert(ISimplyVest.ZeroAmount.selector);
        vest.createMilestoneStream(recipient, address(token), 0, milestoneAuth);
    }

    function test_RevertWhen_ZeroRecipientMilestone() public {
        vm.expectRevert(ISimplyVest.InvalidRecipient.selector);
        vest.createMilestoneStream(address(0), address(token), AMOUNT, milestoneAuth);
    }

    function test_RevertWhen_ZeroMilestoneAuthority() public {
        vm.expectRevert(ISimplyVest.InvalidMilestoneAuthority.selector);
        vest.createMilestoneStream(recipient, address(token), AMOUNT, address(0));
    }

    // ── Trigger Milestone ──

    function test_TriggerMilestone() public {
        bytes32 id = _createDefaultMilestone();

        vm.prank(milestoneAuth);
        vest.triggerMilestone(id);

        ISimplyVest.MilestoneStream memory ms = vest.getMilestoneStream(id);
        assertTrue(ms.milestoneReached);
    }

    function test_RevertWhen_NonAuthorityTriggers() public {
        bytes32 id = _createDefaultMilestone();
        vm.prank(other);
        vm.expectRevert(ISimplyVest.Unauthorized.selector);
        vest.triggerMilestone(id);
    }

    function test_RevertWhen_AlreadyTriggered() public {
        bytes32 id = _createDefaultMilestone();
        vm.prank(milestoneAuth);
        vest.triggerMilestone(id);
        vm.prank(milestoneAuth);
        vm.expectRevert(ISimplyVest.AlreadyTriggered.selector);
        vest.triggerMilestone(id);
    }

    function test_RevertWhen_TriggerCancelled() public {
        bytes32 id = _createDefaultMilestone();
        vm.prank(creator);
        vest.cancelMilestone(id);
        vm.prank(milestoneAuth);
        vm.expectRevert(ISimplyVest.AlreadyCancelled.selector);
        vest.triggerMilestone(id);
    }

    // ── Withdraw Milestone ──

    function test_WithdrawMilestone() public {
        bytes32 id = _createDefaultMilestone();

        vm.prank(milestoneAuth);
        vest.triggerMilestone(id);

        uint256 recvBefore = token.balanceOf(recipient);
        vm.prank(recipient);
        vest.withdrawMilestone(id);

        assertEq(token.balanceOf(recipient), recvBefore + AMOUNT);
        assertEq(token.balanceOf(address(vest)), 0);

        ISimplyVest.MilestoneStream memory ms = vest.getMilestoneStream(id);
        assertEq(ms.amountWithdrawn, AMOUNT);
    }

    function test_RevertWhen_WithdrawBeforeTrigger() public {
        bytes32 id = _createDefaultMilestone();
        vm.prank(recipient);
        vm.expectRevert(ISimplyVest.NothingToWithdraw.selector);
        vest.withdrawMilestone(id);
    }

    function test_RevertWhen_WithdrawTwice() public {
        bytes32 id = _createDefaultMilestone();
        vm.prank(milestoneAuth);
        vest.triggerMilestone(id);
        vm.prank(recipient);
        vest.withdrawMilestone(id);
        vm.prank(recipient);
        vm.expectRevert(ISimplyVest.AlreadyWithdrawn.selector);
        vest.withdrawMilestone(id);
    }

    function test_RevertWhen_NonRecipientWithdraws() public {
        bytes32 id = _createDefaultMilestone();
        vm.prank(milestoneAuth);
        vest.triggerMilestone(id);
        vm.prank(other);
        vm.expectRevert(ISimplyVest.Unauthorized.selector);
        vest.withdrawMilestone(id);
    }

    // ── Cancel Milestone ──

    function test_CancelMilestone() public {
        bytes32 id = _createDefaultMilestone();

        uint256 creatorBefore = token.balanceOf(creator);
        vm.prank(creator);
        vest.cancelMilestone(id);

        assertEq(token.balanceOf(creator), creatorBefore + AMOUNT);
        assertEq(token.balanceOf(address(vest)), 0);

        ISimplyVest.MilestoneStream memory ms = vest.getMilestoneStream(id);
        assertTrue(ms.cancelled);
    }

    function test_RevertWhen_NonCreatorCancelsMilestone() public {
        bytes32 id = _createDefaultMilestone();
        vm.prank(other);
        vm.expectRevert(ISimplyVest.Unauthorized.selector);
        vest.cancelMilestone(id);
    }

    function test_RevertWhen_CancelAfterTrigger() public {
        bytes32 id = _createDefaultMilestone();
        vm.prank(milestoneAuth);
        vest.triggerMilestone(id);
        vm.prank(creator);
        vm.expectRevert(ISimplyVest.FullyVested.selector);
        vest.cancelMilestone(id);
    }

    function test_RevertWhen_CancelCancelled() public {
        bytes32 id = _createDefaultMilestone();
        vm.prank(creator);
        vest.cancelMilestone(id);
        vm.prank(creator);
        vm.expectRevert(ISimplyVest.AlreadyCancelled.selector);
        vest.cancelMilestone(id);
    }

    // ── View Helpers ──

    function test_MilestoneClaimable_AfterTrigger() public {
        bytes32 id = _createDefaultMilestone();
        assertEq(vest.getMilestoneClaimable(id), 0);
        vm.prank(milestoneAuth);
        vest.triggerMilestone(id);
        assertEq(vest.getMilestoneClaimable(id), AMOUNT);
        vm.prank(recipient);
        vest.withdrawMilestone(id);
        assertEq(vest.getMilestoneClaimable(id), 0);
    }

    // ── Helpers ──

    function _createDefaultMilestone() internal returns (bytes32) {
        vm.prank(creator);
        return vest.createMilestoneStream(recipient, address(token), AMOUNT, milestoneAuth);
    }
}
