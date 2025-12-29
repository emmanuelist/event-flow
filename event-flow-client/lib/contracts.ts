import {
  makeContractCall,
  broadcastTransaction,
  AnchorMode,
  PostConditionMode,
  stringUtf8CV,
  uintCV,
  principalCV,
  bufferCV,
  listCV,
  tupleCV,
  trueCV,
  falseCV,
} from "@stacks/transactions";
import { STACKS_MAINNET, STACKS_TESTNET } from "@stacks/network";
import config from "@/lib/config/client";

// Network configuration
export const getNetwork = () => {
  return config.stacksNetwork === "mainnet"
    ? STACKS_MAINNET
    : STACKS_TESTNET;
};

// Contract identifiers
export const CONTRACTS = {
  workflowRegistry: `${config.contracts.address}.${config.contracts.workflowRegistry}`,
  eventProcessor: `${config.contracts.address}.${config.contracts.eventProcessor}`,
  subscriptionManager: `${config.contracts.address}.${config.contracts.subscriptionManager}`,
};

// Workflow Registry Functions
export async function registerWorkflow(
  name: string,
  description: string,
  category: string,
  senderAddress: string
) {
  const network = getNetwork();

  const txOptions = {
    contractAddress: config.contracts.address,
    contractName: config.contracts.workflowRegistry,
    functionName: "register-workflow",
    functionArgs: [
      stringUtf8CV(name),
      stringUtf8CV(description),
      stringUtf8CV(category),
    ],
    senderKey: senderAddress,
    validateWithAbi: true,
    network,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Deny,
    fee: 10000,
  };

  return txOptions;
}

export async function updateWorkflow(
  workflowId: number,
  name: string,
  description: string,
  category: string,
  senderAddress: string
) {
  const network = getNetwork();

  const txOptions = {
    contractAddress: config.contracts.address,
    contractName: config.contracts.workflowRegistry,
    functionName: "update-workflow",
    functionArgs: [
      uintCV(workflowId),
      stringUtf8CV(name),
      stringUtf8CV(description),
      stringUtf8CV(category),
    ],
    senderKey: senderAddress,
    validateWithAbi: true,
    network,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Deny,
    fee: 10000,
  };

  return txOptions;
}

export async function toggleWorkflowStatus(
  workflowId: number,
  senderAddress: string
) {
  const network = getNetwork();

  const txOptions = {
    contractAddress: config.contracts.address,
    contractName: config.contracts.workflowRegistry,
    functionName: "toggle-workflow-status",
    functionArgs: [uintCV(workflowId)],
    senderKey: senderAddress,
    validateWithAbi: true,
    network,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Deny,
    fee: 10000,
  };

  return txOptions;
}

export async function unlockPremium(
  workflowId: number,
  senderAddress: string
) {
  const network = getNetwork();

  const txOptions = {
    contractAddress: config.contracts.address,
    contractName: config.contracts.workflowRegistry,
    functionName: "unlock-premium",
    functionArgs: [uintCV(workflowId)],
    senderKey: senderAddress,
    validateWithAbi: true,
    network,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Deny,
    fee: 10000,
  };

  return txOptions;
}

// Event Processor Functions
export async function processEvent(
  workflowId: number,
  eventType: string,
  eventData: string,
  senderAddress: string
) {
  const network = getNetwork();

  const txOptions = {
    contractAddress: config.contracts.address,
    contractName: config.contracts.eventProcessor,
    functionName: "process-event",
    functionArgs: [
      uintCV(workflowId),
      stringUtf8CV(eventType),
      bufferCV(Buffer.from(eventData, "utf-8")),
    ],
    senderKey: senderAddress,
    validateWithAbi: true,
    network,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Deny,
    fee: 10000,
  };

  return txOptions;
}

export async function addAction(
  workflowId: number,
  actionType: string,
  actionData: string,
  senderAddress: string
) {
  const network = getNetwork();

  const txOptions = {
    contractAddress: config.contracts.address,
    contractName: config.contracts.eventProcessor,
    functionName: "add-action",
    functionArgs: [
      uintCV(workflowId),
      stringUtf8CV(actionType),
      bufferCV(Buffer.from(actionData, "utf-8")),
    ],
    senderKey: senderAddress,
    validateWithAbi: true,
    network,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Deny,
    fee: 10000,
  };

  return txOptions;
}

// Subscription Manager Functions
export async function subscribe(
  tier: number,
  senderAddress: string
) {
  const network = getNetwork();

  const txOptions = {
    contractAddress: config.contracts.address,
    contractName: config.contracts.subscriptionManager,
    functionName: "subscribe",
    functionArgs: [uintCV(tier)],
    senderKey: senderAddress,
    validateWithAbi: true,
    network,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Deny,
    fee: 10000,
  };

  return txOptions;
}

export async function purchaseCredits(
  amount: number,
  senderAddress: string
) {
  const network = getNetwork();

  const txOptions = {
    contractAddress: config.contracts.address,
    contractName: config.contracts.subscriptionManager,
    functionName: "purchase-credits",
    functionArgs: [uintCV(amount)],
    senderKey: senderAddress,
    validateWithAbi: true,
    network,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Deny,
    fee: 10000,
  };

  return txOptions;
}

// Read-only functions
export async function getWorkflow(workflowId: number) {
  const network = getNetwork();
  
  return {
    contractAddress: config.contracts.address,
    contractName: config.contracts.workflowRegistry,
    functionName: "get-workflow",
    functionArgs: [uintCV(workflowId)],
    network,
  };
}

export async function getSubscription(userAddress: string) {
  const network = getNetwork();
  
  return {
    contractAddress: config.contracts.address,
    contractName: config.contracts.subscriptionManager,
    functionName: "get-subscription",
    functionArgs: [principalCV(userAddress)],
    network,
  };
}

export async function getEventCount(workflowId: number) {
  const network = getNetwork();
  
  return {
    contractAddress: config.contracts.address,
    contractName: config.contracts.eventProcessor,
    functionName: "get-event-count",
    functionArgs: [uintCV(workflowId)],
    network,
  };
}
