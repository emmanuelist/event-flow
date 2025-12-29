import { describe, expect, it, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;
const wallet3 = accounts.get("wallet_3")!;

describe("EventFlow Event Processor Tests", () => {
  beforeEach(() => {
    simnet.setEpoch("3.0");
  });

  describe("Event Processing", () => {
    it("should successfully process a single event", () => {
      const workflowId = 1;
      const eventPayload = Buffer.from("test-event-payload");
      const txHash = Buffer.alloc(32, 1);
      const eventType = "nft-transfer";

      const response = simnet.callPublicFn(
        "event-processor",
        "process-event",
        [
          Cl.uint(workflowId),
          Cl.buffer(eventPayload),
          Cl.buffer(txHash),
          Cl.stringUtf8(eventType),
          Cl.bool(false)
        ],
        wallet1
      );

      expect(response.result).toBeOk(Cl.uint(1));

      // Verify global stats updated
      const stats = simnet.callReadOnlyFn(
        "event-processor",
        "get-global-stats",
        [],
        wallet1
      );

      const statsData = stats.result.value?.value;
      expect(statsData["total-processed"]).toBe(Cl.uint(1));
      expect(statsData["total-events"]).toBe(Cl.uint(1));
    });

    it("should process priority event with additional fee", () => {
      const workflowId = 1;
      const eventPayload = Buffer.from("priority-event");
      const txHash = Buffer.alloc(32, 2);
      const eventType = "priority-transfer";

      const response = simnet.callPublicFn(
        "event-processor",
        "process-event",
        [
          Cl.uint(workflowId),
          Cl.buffer(eventPayload),
          Cl.buffer(txHash),
          Cl.stringUtf8(eventType),
          Cl.bool(true) // Priority processing
        ],
        wallet1
      );

      expect(response.result).toBeOk(Cl.uint(1));
    });

    it("should prevent duplicate event processing", () => {
      const workflowId = 1;
      const eventPayload = Buffer.from("duplicate-test");
      const txHash = Buffer.alloc(32, 3);
      const eventType = "test-event";

      // Process first time
      const response1 = simnet.callPublicFn(
        "event-processor",
        "process-event",
        [
          Cl.uint(workflowId),
          Cl.buffer(eventPayload),
          Cl.buffer(txHash),
          Cl.stringUtf8(eventType),
          Cl.bool(false)
        ],
        wallet1
      );

      expect(response1.result).toBeOk(Cl.uint(1));

      // Try to process same event again
      const response2 = simnet.callPublicFn(
        "event-processor",
        "process-event",
        [
          Cl.uint(workflowId),
          Cl.buffer(eventPayload),
          Cl.buffer(txHash),
          Cl.stringUtf8(eventType),
          Cl.bool(false)
        ],
        wallet1
      );

      expect(response2.result).toBeErr(Cl.uint(207)); // err-duplicate-event
    });

    it("should retrieve processed event details", () => {
      const workflowId = 1;
      const eventPayload = Buffer.from("test-event");
      const txHash = Buffer.alloc(32, 4);
      const eventType = "test-type";

      // Process event
      simnet.callPublicFn(
        "event-processor",
        "process-event",
        [
          Cl.uint(workflowId),
          Cl.buffer(eventPayload),
          Cl.buffer(txHash),
          Cl.stringUtf8(eventType),
          Cl.bool(false)
        ],
        wallet1
      );

      // Calculate event hash (sha256 of payload)
      const crypto = require("crypto");
      const eventHash = crypto.createHash("sha256").update(eventPayload).digest();

      const eventDetails = simnet.callReadOnlyFn(
        "event-processor",
        "get-event",
        [Cl.buffer(eventHash)],
        wallet1
      );

      expect(eventDetails.result).toBeOk(
        Cl.some(
          Cl.tuple({
            "workflow-id": Cl.uint(workflowId),
            "processed-at": Cl.uint(expect.any(Number)),
            "block-height": Cl.uint(expect.any(Number)),
            "tx-hash": Cl.buffer(txHash),
            "event-type": Cl.stringUtf8(eventType),
            success: Cl.bool(true)
          })
        )
      );
    });
  });

  describe("Batch Event Processing", () => {
    it("should successfully process batch of events", () => {
      const workflowId = 1;
      const events = [];

      for (let i = 0; i < 5; i++) {
        events.push(
          Cl.tuple({
            payload: Cl.buffer(Buffer.from(`event-${i}`)),
            "tx-hash": Cl.buffer(Buffer.alloc(32, i)),
            "event-type": Cl.stringUtf8("batch-event")
          })
        );
      }

      const response = simnet.callPublicFn(
        "event-processor",
        "batch-process-events",
        [Cl.uint(workflowId), Cl.list(events)],
        wallet1
      );

      expect(response.result).toBeOk(Cl.uint(5));

      // Verify all events were processed
      const stats = simnet.callReadOnlyFn(
        "event-processor",
        "get-global-stats",
        [],
        wallet1
      );

      const statsData = stats.result.value?.value;
      expect(statsData["total-processed"]).toBe(Cl.uint(5));
    });

    it("should fail with batch size exceeding limit", () => {
      const workflowId = 1;
      const events = [];

      // Try to process 51 events (max is 50)
      for (let i = 0; i < 51; i++) {
        events.push(
          Cl.tuple({
            payload: Cl.buffer(Buffer.from(`event-${i}`)),
            "tx-hash": Cl.buffer(Buffer.alloc(32, i)),
            "event-type": Cl.stringUtf8("batch-event")
          })
        );
      }

      const response = simnet.callPublicFn(
        "event-processor",
        "batch-process-events",
        [Cl.uint(workflowId), Cl.list(events)],
        wallet1
      );

      expect(response.result).toBeErr(Cl.uint(209)); // err-batch-too-large
    });

    it("should skip duplicate events in batch", () => {
      const workflowId = 1;
      const duplicatePayload = Buffer.from("duplicate");

      // Process single event first
      simnet.callPublicFn(
        "event-processor",
        "process-event",
        [
          Cl.uint(workflowId),
          Cl.buffer(duplicatePayload),
          Cl.buffer(Buffer.alloc(32, 1)),
          Cl.stringUtf8("test"),
          Cl.bool(false)
        ],
        wallet1
      );

      // Try to process in batch (should skip duplicate)
      const events = [
        Cl.tuple({
          payload: Cl.buffer(duplicatePayload),
          "tx-hash": Cl.buffer(Buffer.alloc(32, 1)),
          "event-type": Cl.stringUtf8("test")
        }),
        Cl.tuple({
          payload: Cl.buffer(Buffer.from("new-event")),
          "tx-hash": Cl.buffer(Buffer.alloc(32, 2)),
          "event-type": Cl.stringUtf8("test")
        })
      ];

      const response = simnet.callPublicFn(
        "event-processor",
        "batch-process-events",
        [Cl.uint(workflowId), Cl.list(events)],
        wallet1
      );

      expect(response.result).toBeOk(Cl.uint(2));
    });
  });

  describe("Workflow Statistics", () => {
    beforeEach(() => {
      // Process some events
      for (let i = 0; i < 3; i++) {
        simnet.callPublicFn(
          "event-processor",
          "process-event",
          [
            Cl.uint(1),
            Cl.buffer(Buffer.from(`event-${i}`)),
            Cl.buffer(Buffer.alloc(32, i)),
            Cl.stringUtf8("test"),
            Cl.bool(false)
          ],
          wallet1
        );
      }
    });

    it("should track workflow processing statistics", () => {
      const stats = simnet.callReadOnlyFn(
        "event-processor",
        "get-processing-stats",
        [Cl.uint(1)],
        wallet1
      );

      const statsData = stats.result.value?.value;
      expect(statsData["total-events"]).toBe(Cl.uint(3));
      expect(statsData["success-count"]).toBe(Cl.uint(3));
      expect(statsData["fail-count"]).toBe(Cl.uint(0));
    });

    it("should get event count for workflow", () => {
      const count = simnet.callReadOnlyFn(
        "event-processor",
        "get-event-count",
        [Cl.uint(1)],
        wallet1
      );

      expect(count.result).toBeOk(Cl.uint(3));
    });
  });

  describe("Rate Limiting", () => {
    it("should configure rate limit for workflow", () => {
      const response = simnet.callPublicFn(
        "event-processor",
        "set-rate-limit",
        [Cl.uint(1), Cl.uint(100), Cl.bool(true)],
        wallet1
      );

      expect(response.result).toBeOk(Cl.bool(true));
    });

    it("should check rate limit status", () => {
      // Set rate limit
      simnet.callPublicFn(
        "event-processor",
        "set-rate-limit",
        [Cl.uint(1), Cl.uint(5), Cl.bool(true)],
        wallet1
      );

      // Process some events
      for (let i = 0; i < 3; i++) {
        simnet.callPublicFn(
          "event-processor",
          "process-event",
          [
            Cl.uint(1),
            Cl.buffer(Buffer.from(`rate-test-${i}`)),
            Cl.buffer(Buffer.alloc(32, i)),
            Cl.stringUtf8("test"),
            Cl.bool(false)
          ],
          wallet1
        );
      }

      const status = simnet.callReadOnlyFn(
        "event-processor",
        "check-rate-limit-status",
        [Cl.uint(1)],
        wallet1
      );

      const statusData = status.result.value?.value;
      expect(statusData["current-count"]).toBe(Cl.uint(3));
      expect(statusData.limit).toBe(Cl.uint(5));
      expect(statusData["can-process"]).toBe(Cl.bool(true));
    });

    it("should enforce rate limit when exceeded", () => {
      // Set low rate limit
      simnet.callPublicFn(
        "event-processor",
        "set-rate-limit",
        [Cl.uint(1), Cl.uint(2), Cl.bool(true)],
        wallet1
      );

      // Process events up to limit
      for (let i = 0; i < 2; i++) {
        const response = simnet.callPublicFn(
          "event-processor",
          "process-event",
          [
            Cl.uint(1),
            Cl.buffer(Buffer.from(`limit-test-${i}`)),
            Cl.buffer(Buffer.alloc(32, i)),
            Cl.stringUtf8("test"),
            Cl.bool(false)
          ],
          wallet1
        );
        expect(response.result).toBeOk(Cl.uint(i + 1));
      }

      // Next event should fail
      const response = simnet.callPublicFn(
        "event-processor",
        "process-event",
        [
          Cl.uint(1),
          Cl.buffer(Buffer.from("limit-test-3")),
          Cl.buffer(Buffer.alloc(32, 3)),
          Cl.stringUtf8("test"),
          Cl.bool(false)
        ],
        wallet1
      );

      expect(response.result).toBeErr(Cl.uint(205)); // err-rate-limit-exceeded
    });
  });

  describe("Action Execution", () => {
    it("should execute contract call action", () => {
      const response = simnet.callPublicFn(
        "event-processor",
        "execute-contract-call",
        [
          Cl.uint(1),
          Cl.principal(wallet2),
          Cl.stringUtf8("some-function")
        ],
        wallet1
      );

      expect(response.result).toBeOk(Cl.bool(true));
    });

    it("should execute token transfer action", () => {
      const response = simnet.callPublicFn(
        "event-processor",
        "execute-token-transfer",
        [Cl.uint(1), Cl.principal(wallet2), Cl.uint(1000000)],
        wallet1
      );

      expect(response.result).toBeOk(Cl.bool(true));
    });

    it("should trigger webhook", () => {
      const urlHash = Buffer.alloc(32, 5);

      const response = simnet.callPublicFn(
        "event-processor",
        "trigger-webhook",
        [Cl.uint(1), Cl.buffer(urlHash)],
        wallet1
      );

      expect(response.result).toBeOk(Cl.bool(true));
    });

    it("should log action execution", () => {
      // Execute a contract call
      simnet.callPublicFn(
        "event-processor",
        "execute-contract-call",
        [
          Cl.uint(1),
          Cl.principal(wallet2),
          Cl.stringUtf8("test-function")
        ],
        wallet1
      );

      // Retrieve action log (execution-id should be 1)
      const log = simnet.callReadOnlyFn(
        "event-processor",
        "get-action-log",
        [Cl.uint(1)],
        wallet1
      );

      const logData = log.result.value?.value;
      expect(logData["workflow-id"]).toBe(Cl.uint(1));
      expect(logData["action-type"]).toBe(Cl.stringUtf8("contract-call"));
      expect(logData.success).toBe(Cl.bool(true));
    });
  });

  describe("Retry Queue", () => {
    it("should add failed event to retry queue", () => {
      const workflowId = 1;
      const payload = Buffer.from("failed-event");
      const errorCode = 500;

      const response = simnet.callPublicFn(
        "event-processor",
        "queue-retry",
        [Cl.uint(workflowId), Cl.buffer(payload), Cl.uint(errorCode)],
        wallet1
      );

      expect(response.result).toBeOk(Cl.uint(1)); // First retry queue entry

      // Verify global stats show failed event
      const stats = simnet.callReadOnlyFn(
        "event-processor",
        "get-global-stats",
        [],
        wallet1
      );

      const statsData = stats.result.value?.value;
      expect(statsData["total-failed"]).toBe(Cl.uint(1));
    });

    it("should retrieve retry queue entry", () => {
      const workflowId = 1;
      const payload = Buffer.from("retry-test");
      const errorCode = 503;

      // Add to retry queue
      simnet.callPublicFn(
        "event-processor",
        "queue-retry",
        [Cl.uint(workflowId), Cl.buffer(payload), Cl.uint(errorCode)],
        wallet1
      );

      // Retrieve entry
      const entry = simnet.callReadOnlyFn(
        "event-processor",
        "get-retry-queue-entry",
        [Cl.uint(1)],
        wallet1
      );

      const entryData = entry.result.value?.value;
      expect(entryData["workflow-id"]).toBe(Cl.uint(workflowId));
      expect(entryData.payload).toBe(Cl.buffer(payload));
      expect(entryData["error-code"]).toBe(Cl.uint(errorCode));
      expect(entryData["retry-count"]).toBe(Cl.uint(0));
    });
  });

  describe("Global Statistics", () => {
    it("should track global processing statistics", () => {
      // Process successful events
      for (let i = 0; i < 5; i++) {
        simnet.callPublicFn(
          "event-processor",
          "process-event",
          [
            Cl.uint(1),
            Cl.buffer(Buffer.from(`success-${i}`)),
            Cl.buffer(Buffer.alloc(32, i)),
            Cl.stringUtf8("test"),
            Cl.bool(false)
          ],
          wallet1
        );
      }

      // Add failed events
      for (let i = 0; i < 2; i++) {
        simnet.callPublicFn(
          "event-processor",
          "queue-retry",
          [Cl.uint(1), Cl.buffer(Buffer.from(`fail-${i}`)), Cl.uint(500)],
          wallet1
        );
      }

      const stats = simnet.callReadOnlyFn(
        "event-processor",
        "get-global-stats",
        [],
        wallet1
      );

      const statsData = stats.result.value?.value;
      expect(statsData["total-processed"]).toBe(Cl.uint(5));
      expect(statsData["total-failed"]).toBe(Cl.uint(2));
      expect(statsData["total-events"]).toBe(Cl.uint(5));
      
      // Success rate should be 100% (5/5 processed successfully)
      expect(statsData["success-rate"]).toBe(Cl.uint(100));
    });

    it("should calculate success rate correctly", () => {
      // Process 3 successful events
      for (let i = 0; i < 3; i++) {
        simnet.callPublicFn(
          "event-processor",
          "process-event",
          [
            Cl.uint(1),
            Cl.buffer(Buffer.from(`event-${i}`)),
            Cl.buffer(Buffer.alloc(32, i)),
            Cl.stringUtf8("test"),
            Cl.bool(false)
          ],
          wallet1
        );
      }

      const stats = simnet.callReadOnlyFn(
        "event-processor",
        "get-global-stats",
        [],
        wallet1
      );

      const statsData = stats.result.value?.value;
      // 3 processed out of 3 total = 100%
      expect(statsData["success-rate"]).toBe(Cl.uint(100));
    });
  });

  describe("Fee Validation", () => {
    it("should charge correct fee for standard event processing", () => {
      const initialBalance = simnet.getAssetsMap().get(wallet1)?.get("STX") || 0;

      simnet.callPublicFn(
        "event-processor",
        "process-event",
        [
          Cl.uint(1),
          Cl.buffer(Buffer.from("fee-test")),
          Cl.buffer(Buffer.alloc(32, 1)),
          Cl.stringUtf8("test"),
          Cl.bool(false)
        ],
        wallet1
      );

      const finalBalance = simnet.getAssetsMap().get(wallet1)?.get("STX") || 0;
      const feePaid = initialBalance - finalBalance;

      // Standard fee is 0.1 STX (100000 microSTX)
      expect(feePaid).toBe(100000);
    });

    it("should charge additional fee for priority processing", () => {
      const initialBalance = simnet.getAssetsMap().get(wallet1)?.get("STX") || 0;

      simnet.callPublicFn(
        "event-processor",
        "process-event",
        [
          Cl.uint(1),
          Cl.buffer(Buffer.from("priority-fee-test")),
          Cl.buffer(Buffer.alloc(32, 2)),
          Cl.stringUtf8("test"),
          Cl.bool(true) // Priority
        ],
        wallet1
      );

      const finalBalance = simnet.getAssetsMap().get(wallet1)?.get("STX") || 0;
      const feePaid = initialBalance - finalBalance;

      // Priority fee is 0.1 + 0.05 = 0.15 STX (150000 microSTX)
      expect(feePaid).toBe(150000);
    });
  });
});
