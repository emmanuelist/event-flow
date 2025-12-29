import { describe, expect, it, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;
const wallet3 = accounts.get("wallet_3")!;

describe("EventFlow Workflow Registry Tests", () => {
  beforeEach(() => {
    simnet.setEpoch("3.0");
  });

  describe("Workflow Registration", () => {
    it("should successfully register a new workflow", () => {
      const name = Cl.stringUtf8("NFT Sales Monitor");
      const description = Cl.stringUtf8("Track NFT sales in real-time");
      const config = Cl.buffer(Buffer.from("config-data"));
      const isPublic = Cl.bool(true);

      const response = simnet.callPublicFn(
        "workflow-registry",
        "register-workflow",
        [name, description, config, isPublic],
        wallet1
      );

      expect(response.result).toBeOk(Cl.uint(1));
      
      // Verify platform revenue increased
      const stats = simnet.callReadOnlyFn(
        "workflow-registry",
        "get-platform-stats",
        [],
        wallet1
      );
      
      expect(stats.result).toBeOk(
        Cl.tuple({
          "total-workflows": Cl.uint(1),
          "total-revenue": Cl.uint(10000000) // 10 STX registration fee
        })
      );
    });

    it("should fail with invalid name", () => {
      const response = simnet.callPublicFn(
        "workflow-registry",
        "register-workflow",
        [
          Cl.stringUtf8(""),
          Cl.stringUtf8("Description"),
          Cl.buffer(Buffer.from("config")),
          Cl.bool(true)
        ],
        wallet1
      );

      expect(response.result).toBeErr(Cl.uint(106)); // err-invalid-name
    });

    it("should fail with invalid description", () => {
      const response = simnet.callPublicFn(
        "workflow-registry",
        "register-workflow",
        [
          Cl.stringUtf8("Name"),
          Cl.stringUtf8(""),
          Cl.buffer(Buffer.from("config")),
          Cl.bool(true)
        ],
        wallet1
      );

      expect(response.result).toBeErr(Cl.uint(107)); // err-invalid-description
    });

    it("should enforce free tier workflow limit", () => {
      // Register 5 workflows (max for free tier)
      for (let i = 0; i < 5; i++) {
        const response = simnet.callPublicFn(
          "workflow-registry",
          "register-workflow",
          [
            Cl.stringUtf8(`Workflow ${i}`),
            Cl.stringUtf8("Description"),
            Cl.buffer(Buffer.from("config")),
            Cl.bool(true)
          ],
          wallet1
        );
        expect(response.result).toBeOk(Cl.uint(i + 1));
      }

      // 6th workflow should fail
      const response = simnet.callPublicFn(
        "workflow-registry",
        "register-workflow",
        [
          Cl.stringUtf8("Workflow 6"),
          Cl.stringUtf8("Description"),
          Cl.buffer(Buffer.from("config")),
          Cl.bool(true)
        ],
        wallet1
      );

      expect(response.result).toBeErr(Cl.uint(108)); // err-workflow-limit-reached
    });

    it("should allow unlimited workflows for premium users", () => {
      // Unlock premium
      const unlockResponse = simnet.callPublicFn(
        "workflow-registry",
        "unlock-premium",
        [],
        wallet1
      );
      expect(unlockResponse.result).toBeOk(Cl.bool(true));

      // Register more than 5 workflows
      for (let i = 0; i < 6; i++) {
        const response = simnet.callPublicFn(
          "workflow-registry",
          "register-workflow",
          [
            Cl.stringUtf8(`Workflow ${i}`),
            Cl.stringUtf8("Description"),
            Cl.buffer(Buffer.from("config")),
            Cl.bool(true)
          ],
          wallet1
        );
        expect(response.result).toBeOk(Cl.uint(i + 1));
      }
    });
  });

  describe("Workflow Updates", () => {
    beforeEach(() => {
      // Register a workflow first
      simnet.callPublicFn(
        "workflow-registry",
        "register-workflow",
        [
          Cl.stringUtf8("Test Workflow"),
          Cl.stringUtf8("Test Description"),
          Cl.buffer(Buffer.from("config")),
          Cl.bool(true)
        ],
        wallet1
      );
    });

    it("should successfully update workflow", () => {
      const response = simnet.callPublicFn(
        "workflow-registry",
        "update-workflow",
        [
          Cl.uint(1),
          Cl.stringUtf8("Updated Name"),
          Cl.stringUtf8("Updated Description"),
          Cl.buffer(Buffer.from("new-config"))
        ],
        wallet1
      );

      expect(response.result).toBeOk(Cl.bool(true));

      // Verify workflow was updated
      const workflow = simnet.callReadOnlyFn(
        "workflow-registry",
        "get-workflow",
        [Cl.uint(1)],
        wallet1
      );

      expect(workflow.result).toBeOk(
        Cl.some(
          Cl.tuple({
            owner: Cl.principal(wallet1),
            name: Cl.stringUtf8("Updated Name"),
            description: Cl.stringUtf8("Updated Description"),
            config: Cl.buffer(Buffer.from("new-config")),
            "is-public": Cl.bool(true),
            "is-active": Cl.bool(true),
            "created-at": Cl.uint(expect.any(Number)),
            "updated-at": Cl.uint(expect.any(Number)),
            version: Cl.uint(2)
          })
        )
      );
    });

    it("should fail when non-owner tries to update", () => {
      const response = simnet.callPublicFn(
        "workflow-registry",
        "update-workflow",
        [
          Cl.uint(1),
          Cl.stringUtf8("Updated Name"),
          Cl.stringUtf8("Updated Description"),
          Cl.buffer(Buffer.from("new-config"))
        ],
        wallet2 // Different wallet
      );

      expect(response.result).toBeErr(Cl.uint(102)); // err-unauthorized
    });

    it("should fail for non-existent workflow", () => {
      const response = simnet.callPublicFn(
        "workflow-registry",
        "update-workflow",
        [
          Cl.uint(999),
          Cl.stringUtf8("Updated Name"),
          Cl.stringUtf8("Updated Description"),
          Cl.buffer(Buffer.from("new-config"))
        ],
        wallet1
      );

      expect(response.result).toBeErr(Cl.uint(101)); // err-not-found
    });
  });

  describe("Workflow Visibility", () => {
    beforeEach(() => {
      simnet.callPublicFn(
        "workflow-registry",
        "register-workflow",
        [
          Cl.stringUtf8("Test Workflow"),
          Cl.stringUtf8("Test Description"),
          Cl.buffer(Buffer.from("config")),
          Cl.bool(true)
        ],
        wallet1
      );
    });

    it("should toggle visibility from public to private", () => {
      const response = simnet.callPublicFn(
        "workflow-registry",
        "toggle-visibility",
        [Cl.uint(1)],
        wallet1
      );

      expect(response.result).toBeOk(Cl.bool(false)); // Now private

      // Verify visibility changed
      const workflow = simnet.callReadOnlyFn(
        "workflow-registry",
        "get-workflow",
        [Cl.uint(1)],
        wallet1
      );

      const workflowData = workflow.result.value?.value;
      expect(workflowData["is-public"]).toBe(Cl.bool(false));
    });

    it("should fail when non-owner tries to toggle", () => {
      const response = simnet.callPublicFn(
        "workflow-registry",
        "toggle-visibility",
        [Cl.uint(1)],
        wallet2
      );

      expect(response.result).toBeErr(Cl.uint(102)); // err-unauthorized
    });
  });

  describe("Workflow Transfer", () => {
    beforeEach(() => {
      simnet.callPublicFn(
        "workflow-registry",
        "register-workflow",
        [
          Cl.stringUtf8("Test Workflow"),
          Cl.stringUtf8("Test Description"),
          Cl.buffer(Buffer.from("config")),
          Cl.bool(true)
        ],
        wallet1
      );
    });

    it("should successfully transfer workflow ownership", () => {
      const price = 10000000; // 10 STX
      
      const response = simnet.callPublicFn(
        "workflow-registry",
        "transfer-workflow",
        [Cl.uint(1), Cl.principal(wallet2), Cl.uint(price)],
        wallet1
      );

      expect(response.result).toBeOk(Cl.bool(true));

      // Verify new ownership
      const workflow = simnet.callReadOnlyFn(
        "workflow-registry",
        "get-workflow",
        [Cl.uint(1)],
        wallet2
      );

      const workflowData = workflow.result.value?.value;
      expect(workflowData.owner).toBe(Cl.principal(wallet2));
    });

    it("should fail with price below minimum", () => {
      const response = simnet.callPublicFn(
        "workflow-registry",
        "transfer-workflow",
        [Cl.uint(1), Cl.principal(wallet2), Cl.uint(1000000)], // 1 STX (below 5 STX min)
        wallet1
      );

      expect(response.result).toBeErr(Cl.uint(104)); // err-invalid-price
    });

    it("should calculate correct platform fee (5%)", () => {
      const price = 10000000; // 10 STX
      const expectedFee = 500000; // 5% = 0.5 STX

      simnet.callPublicFn(
        "workflow-registry",
        "transfer-workflow",
        [Cl.uint(1), Cl.principal(wallet2), Cl.uint(price)],
        wallet1
      );

      const stats = simnet.callReadOnlyFn(
        "workflow-registry",
        "get-platform-stats",
        [],
        wallet1
      );

      const revenue = stats.result.value?.value["total-revenue"];
      // Should be registration fee (10 STX) + transfer fee (0.5 STX)
      expect(revenue).toBe(Cl.uint(10000000 + expectedFee));
    });
  });

  describe("Workflow Deletion", () => {
    beforeEach(() => {
      simnet.callPublicFn(
        "workflow-registry",
        "register-workflow",
        [
          Cl.stringUtf8("Test Workflow"),
          Cl.stringUtf8("Test Description"),
          Cl.buffer(Buffer.from("config")),
          Cl.bool(true)
        ],
        wallet1
      );
    });

    it("should successfully delete (deactivate) workflow", () => {
      const response = simnet.callPublicFn(
        "workflow-registry",
        "delete-workflow",
        [Cl.uint(1)],
        wallet1
      );

      expect(response.result).toBeOk(Cl.bool(true));

      // Verify workflow is deactivated
      const workflow = simnet.callReadOnlyFn(
        "workflow-registry",
        "get-workflow",
        [Cl.uint(1)],
        wallet1
      );

      const workflowData = workflow.result.value?.value;
      expect(workflowData["is-active"]).toBe(Cl.bool(false));
    });

    it("should fail when non-owner tries to delete", () => {
      const response = simnet.callPublicFn(
        "workflow-registry",
        "delete-workflow",
        [Cl.uint(1)],
        wallet2
      );

      expect(response.result).toBeErr(Cl.uint(102)); // err-unauthorized
    });
  });

  describe("Premium Features", () => {
    it("should successfully unlock premium", () => {
      const response = simnet.callPublicFn(
        "workflow-registry",
        "unlock-premium",
        [],
        wallet1
      );

      expect(response.result).toBeOk(Cl.bool(true));

      // Verify premium status
      const isPremium = simnet.callReadOnlyFn(
        "workflow-registry",
        "is-user-premium",
        [Cl.principal(wallet1)],
        wallet1
      );

      expect(isPremium.result).toBeOk(Cl.bool(true));
    });

    it("should charge correct premium fee (50 STX)", () => {
      simnet.callPublicFn(
        "workflow-registry",
        "unlock-premium",
        [],
        wallet1
      );

      const stats = simnet.callReadOnlyFn(
        "workflow-registry",
        "get-platform-stats",
        [],
        wallet1
      );

      expect(stats.result).toBeOk(
        Cl.tuple({
          "total-workflows": Cl.uint(0),
          "total-revenue": Cl.uint(50000000) // 50 STX
        })
      );
    });
  });

  describe("Access Control", () => {
    beforeEach(() => {
      // Create public workflow
      simnet.callPublicFn(
        "workflow-registry",
        "register-workflow",
        [
          Cl.stringUtf8("Public Workflow"),
          Cl.stringUtf8("Description"),
          Cl.buffer(Buffer.from("config")),
          Cl.bool(true)
        ],
        wallet1
      );

      // Create private workflow
      simnet.callPublicFn(
        "workflow-registry",
        "register-workflow",
        [
          Cl.stringUtf8("Private Workflow"),
          Cl.stringUtf8("Description"),
          Cl.buffer(Buffer.from("config")),
          Cl.bool(false)
        ],
        wallet1
      );
    });

    it("should allow owner to access private workflow", () => {
      const canAccess = simnet.callReadOnlyFn(
        "workflow-registry",
        "can-access-workflow",
        [Cl.uint(2), Cl.principal(wallet1)],
        wallet1
      );

      expect(canAccess.result).toBeOk(Cl.bool(true));
    });

    it("should allow anyone to access public workflow", () => {
      const canAccess = simnet.callReadOnlyFn(
        "workflow-registry",
        "can-access-workflow",
        [Cl.uint(1), Cl.principal(wallet2)],
        wallet2
      );

      expect(canAccess.result).toBeOk(Cl.bool(true));
    });

    it("should deny non-owner access to private workflow", () => {
      const canAccess = simnet.callReadOnlyFn(
        "workflow-registry",
        "can-access-workflow",
        [Cl.uint(2), Cl.principal(wallet2)],
        wallet2
      );

      expect(canAccess.result).toBeOk(Cl.bool(false));
    });
  });

  describe("User Workflow Tracking", () => {
    it("should track user workflows correctly", () => {
      // Register multiple workflows
      for (let i = 0; i < 3; i++) {
        simnet.callPublicFn(
          "workflow-registry",
          "register-workflow",
          [
            Cl.stringUtf8(`Workflow ${i}`),
            Cl.stringUtf8("Description"),
            Cl.buffer(Buffer.from("config")),
            Cl.bool(true)
          ],
          wallet1
        );
      }

      const userWorkflows = simnet.callReadOnlyFn(
        "workflow-registry",
        "get-user-workflows",
        [Cl.principal(wallet1)],
        wallet1
      );

      const data = userWorkflows.result.value?.value;
      expect(data.count).toBe(Cl.uint(3));
      expect(data["workflow-ids"].list.length).toBe(3);
    });

    it("should get correct workflow count", () => {
      // Register 2 workflows
      simnet.callPublicFn(
        "workflow-registry",
        "register-workflow",
        [
          Cl.stringUtf8("Workflow 1"),
          Cl.stringUtf8("Description"),
          Cl.buffer(Buffer.from("config")),
          Cl.bool(true)
        ],
        wallet1
      );

      simnet.callPublicFn(
        "workflow-registry",
        "register-workflow",
        [
          Cl.stringUtf8("Workflow 2"),
          Cl.stringUtf8("Description"),
          Cl.buffer(Buffer.from("config")),
          Cl.bool(true)
        ],
        wallet1
      );

      const count = simnet.callReadOnlyFn(
        "workflow-registry",
        "get-user-workflow-count-public",
        [Cl.principal(wallet1)],
        wallet1
      );

      expect(count.result).toBeOk(Cl.uint(2));
    });
  });

  describe("Workflow Statistics", () => {
    beforeEach(() => {
      simnet.callPublicFn(
        "workflow-registry",
        "register-workflow",
        [
          Cl.stringUtf8("Test Workflow"),
          Cl.stringUtf8("Test Description"),
          Cl.buffer(Buffer.from("config")),
          Cl.bool(true)
        ],
        wallet1
      );
    });

    it("should track workflow updates", () => {
      // Update workflow twice
      simnet.callPublicFn(
        "workflow-registry",
        "update-workflow",
        [
          Cl.uint(1),
          Cl.stringUtf8("Updated 1"),
          Cl.stringUtf8("Description"),
          Cl.buffer(Buffer.from("config"))
        ],
        wallet1
      );

      simnet.callPublicFn(
        "workflow-registry",
        "update-workflow",
        [
          Cl.uint(1),
          Cl.stringUtf8("Updated 2"),
          Cl.stringUtf8("Description"),
          Cl.buffer(Buffer.from("config"))
        ],
        wallet1
      );

      const stats = simnet.callReadOnlyFn(
        "workflow-registry",
        "get-workflow-stats",
        [Cl.uint(1)],
        wallet1
      );

      const data = stats.result.value?.value;
      expect(data["total-updates"]).toBe(Cl.uint(2));
    });

    it("should track workflow transfers", () => {
      // Transfer workflow
      simnet.callPublicFn(
        "workflow-registry",
        "transfer-workflow",
        [Cl.uint(1), Cl.principal(wallet2), Cl.uint(10000000)],
        wallet1
      );

      const stats = simnet.callReadOnlyFn(
        "workflow-registry",
        "get-workflow-stats",
        [Cl.uint(1)],
        wallet2
      );

      const data = stats.result.value?.value;
      expect(data["total-transfers"]).toBe(Cl.uint(1));
    });
  });
});
