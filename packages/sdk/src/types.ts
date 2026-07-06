export enum StreamStatus {
  Active = 0,
  Completed = 1,
  Cancelled = 2,
}

export interface Stream {
  creator: `0x${string}`;
  recipient: `0x${string}`;
  token: `0x${string}`;
  amount: bigint;
  amountWithdrawn: bigint;
  startTime: bigint;
  cliffTime: bigint;
  endTime: bigint;
  cancelled: boolean;
}

export interface MilestoneStream {
  creator: `0x${string}`;
  recipient: `0x${string}`;
  token: `0x${string}`;
  amount: bigint;
  amountWithdrawn: bigint;
  milestoneAuthority: `0x${string}`;
  milestoneReached: boolean;
  cancelled: boolean;
}
