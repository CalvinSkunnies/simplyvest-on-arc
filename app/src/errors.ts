export function formatError(e: unknown): string {
  const msg = (e as Error)?.message ?? "";
  const code = (e as { code?: number })?.code;

  if (code === 4001 || msg.includes("rejected") || msg.includes("denied")) {
    return "Request cancelled";
  }
  if (msg.includes("insufficient funds")) {
    return "Insufficient balance";
  }
  if (msg.includes("execution reverted")) {
    return "Transaction reverted";
  }
  if (msg.includes("already processing")) {
    return "Check your wallet for a pending request";
  }
  if (msg.includes("chain")) {
    return "Wrong network — switch to Arc Testnet in your wallet";
  }
  if (msg.includes("nonce")) {
    return "Nonce error — try resetting your wallet activity";
  }

  const clean = msg
    .replace(/^Error: /, "")
    .replace(/Details:.*\.?/, "")
    .replace(/Version:.*$/, "")
    .replace(/Request of kind.*rejected\.?/i, "")
    .trim();

  return clean || "Something went wrong";
}
