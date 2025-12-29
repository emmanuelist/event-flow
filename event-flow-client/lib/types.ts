export interface Workflow {
  id: number;
  owner: string;
  name: string;
  description: string;
  category: string;
  active: boolean;
  createdAt: number;
  eventCount: number;
  isPremium: boolean;
  isPublic: boolean;
}

export interface Event {
  id: string;
  workflowId: number;
  eventType: string;
  eventData: string;
  timestamp: number;
  processedBy: string;
  status: "pending" | "processing" | "completed" | "failed";
}

export interface Action {
  id: number;
  workflowId: number;
  actionType: string;
  actionData: string;
  createdAt: number;
}

export interface Subscription {
  user: string;
  tier: number;
  active: boolean;
  startBlock: number;
  endBlock: number;
  credits: number;
  eventsProcessed: number;
}

export interface SubscriptionTier {
  id: number;
  name: string;
  price: number;
  eventsPerMonth: number;
  features: string[];
}

export const SUBSCRIPTION_TIERS: SubscriptionTier[] = [
  {
    id: 1,
    name: "Starter",
    price: 20,
    eventsPerMonth: 1000,
    features: [
      "1,000 events/month",
      "Basic workflows",
      "Email notifications",
      "Community support",
    ],
  },
  {
    id: 2,
    name: "Pro",
    price: 50,
    eventsPerMonth: 5000,
    features: [
      "5,000 events/month",
      "Premium workflows",
      "Advanced actions",
      "Priority support",
      "API access",
    ],
  },
  {
    id: 3,
    name: "Enterprise",
    price: 100,
    eventsPerMonth: 20000,
    features: [
      "20,000 events/month",
      "Unlimited workflows",
      "Custom actions",
      "24/7 support",
      "Dedicated account manager",
      "SLA guarantee",
    ],
  },
];

export interface ChainhookEvent {
  event_id: string;
  contract_identifier: string;
  tx_id: string;
  block_height: number;
  event_type: string;
  data: {
    workflow_id?: number;
    event_type?: string;
    user?: string;
    action?: string;
  };
}

export interface WorkflowStats {
  totalWorkflows: number;
  activeWorkflows: number;
  totalEvents: number;
  eventsToday: number;
  averageEventsPerWorkflow: number;
}

export interface UserStats {
  totalWorkflows: number;
  activeWorkflows: number;
  eventsProcessed: number;
  creditsRemaining: number;
  subscriptionTier: number;
  subscriptionActive: boolean;
}
