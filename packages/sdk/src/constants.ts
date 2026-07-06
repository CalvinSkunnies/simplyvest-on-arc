export const ARC_TESTNET = {
  chainId: 5042002,
  name: "Arc Testnet",
  rpcUrl: "https://rpc.testnet.arc.network",
  explorerUrl: "https://testnet.arcscan.app",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
  faucetUrl: "https://faucet.circle.com",
} as const;

export const SIMPLY_VEST_ABI = [
  // Stream functions
  "function createStream(address recipient, address token, uint256 amount, uint256 startTime, uint256 cliffTime, uint256 endTime) returns (bytes32 streamId)",
  "function withdraw(bytes32 streamId, uint256 amount)",
  "function cancel(bytes32 streamId)",

  // Milestone functions
  "function createMilestoneStream(address recipient, address token, uint256 amount, address milestoneAuthority) returns (bytes32 streamId)",
  "function triggerMilestone(bytes32 streamId)",
  "function withdrawMilestone(bytes32 streamId)",
  "function cancelMilestone(bytes32 streamId)",

  // Views
  "function getClaimable(bytes32 streamId) view returns (uint256)",
  "function getStatus(bytes32 streamId) view returns (uint8)",
  "function getStream(bytes32 streamId) view returns (tuple(address creator, address recipient, address token, uint256 amount, uint256 amountWithdrawn, uint256 startTime, uint256 cliffTime, uint256 endTime, bool cancelled))",
  "function getMilestoneStream(bytes32 streamId) view returns (tuple(address creator, address recipient, address token, uint256 amount, uint256 amountWithdrawn, address milestoneAuthority, bool milestoneReached, bool cancelled))",
  "function getMilestoneClaimable(bytes32 streamId) view returns (uint256)",
  "function getStreamCount() view returns (uint256)",
  "function getMilestoneStreamCount() view returns (uint256)",
  "function creatorNonces(address creator) view returns (uint256)",
  "function streamIds(uint256 index) view returns (bytes32)",
  "function milestoneStreamIds(uint256 index) view returns (bytes32)",

  // Events
  "event StreamCreated(bytes32 indexed streamId, address indexed creator, address indexed recipient, address token, uint256 amount, uint256 startTime, uint256 cliffTime, uint256 endTime)",
  "event TokensClaimed(bytes32 indexed streamId, address indexed recipient, uint256 amount, uint256 claimed, uint256 totalClaimed)",
  "event StreamCompleted(bytes32 indexed streamId, address indexed recipient, uint256 totalAmount)",
  "event StreamCancelled(bytes32 indexed streamId, address indexed creator, address indexed recipient, uint256 vestedToRecipient, uint256 returnedToCreator)",
  "event MilestoneStreamCreated(bytes32 indexed streamId, address indexed creator, address indexed recipient, address token, uint256 amount, address milestoneAuthority)",
  "event MilestoneTriggered(bytes32 indexed streamId, address indexed milestoneAuthority)",
  "event MilestoneCompleted(bytes32 indexed streamId, address indexed recipient, uint256 amount)",
  "event MilestoneCancelled(bytes32 indexed streamId, address indexed creator, address indexed recipient, uint256 returnedToCreator)",
] as const;
