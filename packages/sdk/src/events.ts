export interface StreamCreatedEvent {
  streamId: `0x${string}`;
  creator: `0x${string}`;
  recipient: `0x${string}`;
  token: `0x${string}`;
  amount: bigint;
  startTime: bigint;
  cliffTime: bigint;
  endTime: bigint;
}

export interface TokensClaimedEvent {
  streamId: `0x${string}`;
  recipient: `0x${string}`;
  amount: bigint; // total stream amount
  claimed: bigint; // this claim amount
  totalClaimed: bigint; // running total claimed
}

export interface StreamCompletedEvent {
  streamId: `0x${string}`;
  recipient: `0x${string}`;
  totalAmount: bigint;
}

export interface StreamCancelledEvent {
  streamId: `0x${string}`;
  creator: `0x${string}`;
  recipient: `0x${string}`;
  vestedToRecipient: bigint;
  returnedToCreator: bigint;
}

export interface MilestoneStreamCreatedEvent {
  streamId: `0x${string}`;
  creator: `0x${string}`;
  recipient: `0x${string}`;
  token: `0x${string}`;
  amount: bigint;
  milestoneAuthority: `0x${string}`;
}

export interface MilestoneTriggeredEvent {
  streamId: `0x${string}`;
  milestoneAuthority: `0x${string}`;
}

export interface MilestoneCompletedEvent {
  streamId: `0x${string}`;
  recipient: `0x${string}`;
  amount: bigint;
}

export interface MilestoneCancelledEvent {
  streamId: `0x${string}`;
  creator: `0x${string}`;
  recipient: `0x${string}`;
  returnedToCreator: bigint;
}
