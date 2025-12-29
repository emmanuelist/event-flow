import z from "zod";

export const envSchema = z.object({
  NEXT_PUBLIC_APP_NAME: z.string().default("EventFlow"),
  NEXT_PUBLIC_STACKS_NETWORK: z.enum(["mainnet", "testnet", "devnet"]).default("mainnet"),
  NEXT_PUBLIC_CONTRACT_ADDRESS: z.string().default("SPVQ61FEWR6M4HVAT3BNE07D4BNW6A1C2ACCNQ6F"),
  NEXT_PUBLIC_WORKFLOW_REGISTRY: z.string().default("workflow-registry"),
  NEXT_PUBLIC_EVENT_PROCESSOR: z.string().default("event-processor"),
  NEXT_PUBLIC_SUBSCRIPTION_MANAGER: z.string().default("subscription-manager"),
});

export type AppConfig = {
  appName: string;
  stacksNetwork: "mainnet" | "testnet" | "devnet";
  contracts: {
    address: string;
    workflowRegistry: string;
    eventProcessor: string;
    subscriptionManager: string;
  };
};

export const unparsedEnv = {
  appName: process.env.NEXT_PUBLIC_APP_NAME,
  stacksNetwork: process.env.NEXT_PUBLIC_STACKS_NETWORK,
  contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
  workflowRegistry: process.env.NEXT_PUBLIC_WORKFLOW_REGISTRY,
  eventProcessor: process.env.NEXT_PUBLIC_EVENT_PROCESSOR,
  subscriptionManager: process.env.NEXT_PUBLIC_SUBSCRIPTION_MANAGER,
};

const parsed = envSchema.safeParse(unparsedEnv);

if (!parsed.success) {
  let message = "Invalid environment variables:";
  for (const issue of parsed.error.issues) {
    message += `\n${issue.path.join(".")}: ${issue.message}`;
  }
  throw new Error(message);
}

const config: AppConfig = {
  appName: parsed.data.NEXT_PUBLIC_APP_NAME,
  stacksNetwork: parsed.data.NEXT_PUBLIC_STACKS_NETWORK,
  contracts: {
    address: parsed.data.NEXT_PUBLIC_CONTRACT_ADDRESS,
    workflowRegistry: parsed.data.NEXT_PUBLIC_WORKFLOW_REGISTRY,
    eventProcessor: parsed.data.NEXT_PUBLIC_EVENT_PROCESSOR,
    subscriptionManager: parsed.data.NEXT_PUBLIC_SUBSCRIPTION_MANAGER,
  },
};

export default config;
