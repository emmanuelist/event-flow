"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import config from "@/lib/config/client";
import type { ChainhookEvent } from "@/lib/types";

interface ChainhookContextType {
  events: ChainhookEvent[];
  connected: boolean;
  error: string | null;
  subscribeToWorkflow: (workflowId: number) => void;
  unsubscribeFromWorkflow: (workflowId: number) => void;
}

const ChainhookContext = createContext<ChainhookContextType | undefined>(undefined);

export function ChainhookProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<ChainhookEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subscribedWorkflows, setSubscribedWorkflows] = useState<Set<number>>(new Set());

  useEffect(() => {
    // Initialize connection to chainhooks
    const initChainhooks = async () => {
      try {
        // In a real implementation, you would connect to your chainhooks server
        // For now, we'll simulate the connection
        setConnected(true);
        console.log("Connected to Chainhooks");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to connect to Chainhooks");
        setConnected(false);
      }
    };

    initChainhooks();

    // Simulate receiving events (in production, this would be from WebSocket or SSE)
    const eventSimulator = setInterval(() => {
      if (subscribedWorkflows.size > 0 && Math.random() > 0.7) {
        const workflowId = Array.from(subscribedWorkflows)[
          Math.floor(Math.random() * subscribedWorkflows.size)
        ];
        
        const mockEvent: ChainhookEvent = {
          event_id: `${Date.now()}-${Math.random()}`,
          contract_identifier: `${config.contracts.address}.${config.contracts.eventProcessor}`,
          tx_id: `0x${Math.random().toString(16).slice(2)}`,
          block_height: Math.floor(Math.random() * 1000000),
          event_type: "print",
          data: {
            workflow_id: workflowId,
            event_type: ["transaction", "contract-call", "transfer"][Math.floor(Math.random() * 3)],
            action: "processed",
          },
        };

        setEvents((prev) => [mockEvent, ...prev].slice(0, 100)); // Keep last 100 events
      }
    }, 5000);

    return () => {
      clearInterval(eventSimulator);
    };
  }, [subscribedWorkflows]);

  const subscribeToWorkflow = (workflowId: number) => {
    setSubscribedWorkflows((prev) => new Set(prev).add(workflowId));
    console.log(`Subscribed to workflow ${workflowId}`);
  };

  const unsubscribeFromWorkflow = (workflowId: number) => {
    setSubscribedWorkflows((prev) => {
      const next = new Set(prev);
      next.delete(workflowId);
      return next;
    });
    console.log(`Unsubscribed from workflow ${workflowId}`);
  };

  return (
    <ChainhookContext.Provider
      value={{
        events,
        connected,
        error,
        subscribeToWorkflow,
        unsubscribeFromWorkflow,
      }}
    >
      {children}
    </ChainhookContext.Provider>
  );
}

export function useChainhooks() {
  const context = useContext(ChainhookContext);
  if (context === undefined) {
    throw new Error("useChainhooks must be used within a ChainhookProvider");
  }
  return context;
}
