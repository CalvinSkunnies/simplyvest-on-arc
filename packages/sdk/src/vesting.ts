import { type Stream, StreamStatus } from "./types";

export function getStreamStatus(
  stream: Stream,
  clockTime: bigint
): StreamStatus {
  if (stream.cancelled) return StreamStatus.Cancelled;
  if (stream.amountWithdrawn >= stream.amount) return StreamStatus.Completed;
  return StreamStatus.Active;
}

export function getClaimableAmount(
  stream: Stream,
  clockTime: bigint
): bigint {
  if (stream.cancelled) return 0n;

  const vested = computeVested(stream, clockTime);
  if (vested <= stream.amountWithdrawn) return 0n;
  return vested - stream.amountWithdrawn;
}

export function computeVested(
  stream: Stream,
  clockTime: bigint
): bigint {
  if (clockTime < stream.cliffTime) return 0n;
  if (clockTime >= stream.endTime) return stream.amount;

  const elapsed = clockTime - stream.startTime;
  const duration = stream.endTime - stream.startTime;
  const vested = (stream.amount * elapsed) / duration;
  return vested > stream.amount ? stream.amount : vested;
}

export function getVestedPercent(
  stream: Stream,
  clockTime: bigint
): number {
  const vested = computeVested(stream, clockTime);
  if (stream.amount === 0n) return 0;
  return Number((vested * 100n) / stream.amount);
}
