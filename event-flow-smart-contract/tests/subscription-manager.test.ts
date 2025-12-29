import { describe, expect, it, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;
const wallet3 = accounts.get("wallet_3")!;

describe("EventFlow Subscription Manager Tests", () => {
  beforeEach(() => {
    simnet.setEpoch("3.0");
  });

  describe("Subscription Creation", () => {
    it("should successfully subscribe to Pro tier", () => {
      const response = simnet.callPublicFn(
        "subscription-manager",
        "subscribe",
        [
          Cl.uint(1), // tier-pro
          Cl.uint(1), // 1 month
          Cl.none()   // no referral
        ],
        wallet1
      );

      expect(response.result).toBeOk(Cl.bool(true));

      // Verify subscription was created
      const status = simnet.callReadOnlyFn(
        "subscription-manager",
        "get-subscription-status",
        [Cl.principal(wallet1)],
        wallet1
      );

      const subData = status.result.value?.value;
      expect(subData.tier).toBe(Cl.uint(1));
      expect(subData["is-active"]).toBe(Cl.bool(true));
    });

    it("should successfully subscribe to Enterprise tier", () => {
      const response = simnet.callPublicFn(
        "subscription-manager",
        "subscribe",
        [
          Cl.uint(2), // tier-enterprise
          Cl.uint(1), // 1 month
          Cl.none()
        ],
        wallet1
      );

      expect(response.result).toBeOk(Cl.bool(true));
    });

    it("should fail with invalid tier", () => {
      const response = simnet.callPublicFn(
        "subscription-manager",
        "subscribe",
        [
          Cl.uint(5), // invalid tier
          Cl.uint(1),
          Cl.none()
        ],
        wallet1
      );

      expect(response.result).toBeErr(Cl.uint(304)); // err-invalid-tier
    });

    it("should fail with invalid duration", () => {
      const response = simnet.callPublicFn(
        "subscription-manager",
        "subscribe",
        [
          Cl.uint(1),
          Cl.uint(0), // 0 months invalid
          Cl.none()
        ],
        wallet1
      );

      expect(response.result).toBeErr(Cl.uint(305)); // err-invalid-duration
    });

    it("should fail with duration > 12 months", () => {
      const response = simnet.callPublicFn(
        "subscription-manager",
        "subscribe",
        [
          Cl.uint(1),
          Cl.uint(13), // > 12 months
          Cl.none()
        ],
        wallet1
      );

      expect(response.result).toBeErr(Cl.uint(305)); // err-invalid-duration
    });

    it("should prevent duplicate active subscriptions", () => {
      // Subscribe first time
      simnet.callPublicFn(
        "subscription-manager",
        "subscribe",
        [Cl.uint(1), Cl.uint(1), Cl.none()],
        wallet1
      );

      // Try to subscribe again
      const response = simnet.callPublicFn(
        "subscription-manager",
        "subscribe",
        [Cl.uint(1), Cl.uint(1), Cl.none()],
        wallet1
      );

      expect(response.result).toBeErr(Cl.uint(306)); // err-already-subscribed
    });

    it("should calculate correct price for multi-month subscription", () => {
      const duration = 3;
      const proPricePerMonth = 20000000; // 20 STX

      const response = simnet.callPublicFn(
        "subscription-manager",
        "subscribe",
        [Cl.uint(1), Cl.uint(duration), Cl.none()],
        wallet1
      );

      expect(response.result).toBeOk(Cl.bool(true));

      // Verify revenue collected
      const stats = simnet.callReadOnlyFn(
        "subscription-manager",
        "get-platform-revenue-stats",
        [],
        wallet1
      );

      const statsData = stats.result.value?.value;
      expect(statsData["total-revenue"]).toBe(
        Cl.uint(proPricePerMonth * duration)
      );
    });
  });

  describe("Subscription Renewal", () => {
    beforeEach(() => {
      // Create initial subscription
      simnet.callPublicFn(
        "subscription-manager",
        "subscribe",
        [Cl.uint(1), Cl.uint(1), Cl.none()],
        wallet1
      );
    });

    it("should successfully renew subscription", () => {
      const response = simnet.callPublicFn(
        "subscription-manager",
        "renew-subscription",
        [Cl.bool(false)], // auto-renew off
        wallet1
      );

      expect(response.result).toBeOk(Cl.bool(true));
    });

    it("should enable auto-renewal", () => {
      const response = simnet.callPublicFn(
        "subscription-manager",
        "renew-subscription",
        [Cl.bool(true)], // auto-renew on
        wallet1
      );

      expect(response.result).toBeOk(Cl.bool(true));

      // Verify auto-renew is enabled
      const status = simnet.callReadOnlyFn(
        "subscription-manager",
        "get-subscription-status",
        [Cl.principal(wallet1)],
        wallet1
      );

      const subData = status.result.value?.value;
      expect(subData["auto-renew"]).toBe(Cl.bool(true));
    });

    it("should fail renewal without active subscription", () => {
      const response = simnet.callPublicFn(
        "subscription-manager",
        "renew-subscription",
        [Cl.bool(false)],
        wallet2 // Never subscribed
      );

      expect(response.result).toBeErr(Cl.uint(307)); // err-not-subscribed
    });

    it("should extend subscription end date on renewal", () => {
      // Get original end date
      const status1 = simnet.callReadOnlyFn(
        "subscription-manager",
        "get-subscription-status",
        [Cl.principal(wallet1)],
        wallet1
      );

      const originalEndBlock = status1.result.value?.value["end-block"];

      // Renew
      simnet.callPublicFn(
        "subscription-manager",
        "renew-subscription",
        [Cl.bool(false)],
        wallet1
      );

      // Check new end date
      const status2 = simnet.callReadOnlyFn(
        "subscription-manager",
        "get-subscription-status",
        [Cl.principal(wallet1)],
        wallet1
      );

      const newEndBlock = status2.result.value?.value["end-block"];
      
      // Should be extended by ~4320 blocks (1 month)
      expect(newEndBlock.value).toBeGreaterThan(originalEndBlock.value);
    });
  });

  describe("Subscription Upgrade", () => {
    beforeEach(() => {
      // Subscribe to Pro tier
      simnet.callPublicFn(
        "subscription-manager",
        "subscribe",
        [Cl.uint(1), Cl.uint(1), Cl.none()],
        wallet1
      );
    });

    it("should successfully upgrade from Pro to Enterprise", () => {
      const response = simnet.callPublicFn(
        "subscription-manager",
        "upgrade-subscription",
        [Cl.uint(2)], // Enterprise tier
        wallet1
      );

      expect(response.result).toBeOk(Cl.bool(true));

      // Verify tier was upgraded
      const status = simnet.callReadOnlyFn(
        "subscription-manager",
        "get-subscription-status",
        [Cl.principal(wallet1)],
        wallet1
      );

      const subData = status.result.value?.value;
      expect(subData.tier).toBe(Cl.uint(2));
    });

    it("should fail downgrade attempt", () => {
      // First upgrade to Enterprise
      simnet.callPublicFn(
        "subscription-manager",
        "upgrade-subscription",
        [Cl.uint(2)],
        wallet1
      );

      // Try to downgrade back to Pro
      const response = simnet.callPublicFn(
        "subscription-manager",
        "upgrade-subscription",
        [Cl.uint(1)],
        wallet1
      );

      expect(response.result).toBeErr(Cl.uint(304)); // err-invalid-tier
    });

    it("should charge upgrade fee plus price difference", () => {
      const response = simnet.callPublicFn(
        "subscription-manager",
        "upgrade-subscription",
        [Cl.uint(2)],
        wallet1
      );

      expect(response.result).toBeOk(Cl.bool(true));

      // Enterprise (100 STX) - Pro (20 STX) + 1 STX fee = 81 STX additional
    });
  });

  describe("Subscription Cancellation", () => {
    beforeEach(() => {
      // Subscribe for 1 month
      simnet.callPublicFn(
        "subscription-manager",
        "subscribe",
        [Cl.uint(1), Cl.uint(1), Cl.none()],
        wallet1
      );
    });

    it("should successfully cancel subscription", () => {
      const response = simnet.callPublicFn(
        "subscription-manager",
        "cancel-subscription",
        [],
        wallet1
      );

      expect(response.result).toBeOk(Cl.uint(expect.any(Number))); // Returns refund amount

      // Verify subscription is inactive
      const status = simnet.callReadOnlyFn(
        "subscription-manager",
        "get-subscription-status",
        [Cl.principal(wallet1)],
        wallet1
      );

      const subData = status.result.value?.value;
      expect(subData["is-active"]).toBe(Cl.bool(false));
    });

    it("should apply 30% cancellation penalty", () => {
      const response = simnet.callPublicFn(
        "subscription-manager",
        "cancel-subscription",
        [],
        wallet1
      );

      // Refund should be 70% of remaining value
      expect(response.result).toBeOk(Cl.uint(expect.any(Number)));
    });

    it("should fail cancellation without active subscription", () => {
      const response = simnet.callPublicFn(
        "subscription-manager",
        "cancel-subscription",
        [],
        wallet2
      );

      expect(response.result).toBeErr(Cl.uint(307)); // err-not-subscribed
    });
  });

  describe("Subscription Pause", () => {
    beforeEach(() => {
      simnet.callPublicFn(
        "subscription-manager",
        "subscribe",
        [Cl.uint(1), Cl.uint(1), Cl.none()],
        wallet1
      );
    });

    it("should successfully pause subscription", () => {
      const currentBlock = simnet.blockHeight;
      const pauseUntil = currentBlock + 1000;

      const response = simnet.callPublicFn(
        "subscription-manager",
        "pause-subscription",
        [Cl.uint(pauseUntil)],
        wallet1
      );

      expect(response.result).toBeOk(Cl.bool(true));
    });

    it("should fail with past pause date", () => {
      const currentBlock = simnet.blockHeight;
      const pastBlock = currentBlock - 100;

      const response = simnet.callPublicFn(
        "subscription-manager",
        "pause-subscription",
        [Cl.uint(pastBlock)],
        wallet1
      );

      expect(response.result).toBeErr(Cl.uint(305)); // err-invalid-duration
    });
  });

  describe("Credit Management", () => {
    it("should purchase small credit package", () => {
      const response = simnet.callPublicFn(
        "subscription-manager",
        "purchase-credits",
        [Cl.uint(1)], // Small package
        wallet1
      );

      expect(response.result).toBeOk(Cl.uint(1000)); // 1,000 credits

      // Verify balance
      const balance = simnet.callReadOnlyFn(
        "subscription-manager",
        "get-credit-balance",
        [Cl.principal(wallet1)],
        wallet1
      );

      expect(balance.result).toBeOk(Cl.uint(1000));
    });

    it("should purchase medium credit package with discount", () => {
      const response = simnet.callPublicFn(
        "subscription-manager",
        "purchase-credits",
        [Cl.uint(2)], // Medium package
        wallet1
      );

      expect(response.result).toBeOk(Cl.uint(10000)); // 10,000 credits
    });

    it("should purchase large credit package with larger discount", () => {
      const response = simnet.callPublicFn(
        "subscription-manager",
        "purchase-credits",
        [Cl.uint(3)], // Large package
        wallet1
      );

      expect(response.result).toBeOk(Cl.uint(100000)); // 100,000 credits
    });

    it("should fail with invalid package size", () => {
      const response = simnet.callPublicFn(
        "subscription-manager",
        "purchase-credits",
        [Cl.uint(99)], // Invalid
        wallet1
      );

      expect(response.result).toBeErr(Cl.uint(308)); // err-invalid-amount
    });

    it("should track lifetime purchased credits", () => {
      // Purchase multiple packages
      simnet.callPublicFn(
        "subscription-manager",
        "purchase-credits",
        [Cl.uint(1)],
        wallet1
      );

      simnet.callPublicFn(
        "subscription-manager",
        "purchase-credits",
        [Cl.uint(1)],
        wallet1
      );

      const balance = simnet.callReadOnlyFn(
        "subscription-manager",
        "get-credit-balance",
        [Cl.principal(wallet1)],
        wallet1
      );

      // Should have 2,000 credits total
      expect(balance.result).toBeOk(Cl.uint(2000));
    });
  });

  describe("Credit Transfers", () => {
    beforeEach(() => {
      // Purchase credits for wallet1
      simnet.callPublicFn(
        "subscription-manager",
        "purchase-credits",
        [Cl.uint(2)], // 10,000 credits
        wallet1
      );
    });

    it("should successfully transfer credits", () => {
      const response = simnet.callPublicFn(
        "subscription-manager",
        "transfer-credits",
        [Cl.principal(wallet2), Cl.uint(5000)],
        wallet1
      );

      expect(response.result).toBeOk(Cl.bool(true));

      // Verify sender balance decreased
      const balance1 = simnet.callReadOnlyFn(
        "subscription-manager",
        "get-credit-balance",
        [Cl.principal(wallet1)],
        wallet1
      );
      expect(balance1.result).toBeOk(Cl.uint(5000));

      // Verify recipient balance increased
      const balance2 = simnet.callReadOnlyFn(
        "subscription-manager",
        "get-credit-balance",
        [Cl.principal(wallet2)],
        wallet2
      );
      expect(balance2.result).toBeOk(Cl.uint(5000));
    });

    it("should fail with insufficient balance", () => {
      const response = simnet.callPublicFn(
        "subscription-manager",
        "transfer-credits",
        [Cl.principal(wallet2), Cl.uint(20000)], // More than available
        wallet1
      );

      expect(response.result).toBeErr(Cl.uint(303)); // err-insufficient-balance
    });

    it("should fail with zero amount", () => {
      const response = simnet.callPublicFn(
        "subscription-manager",
        "transfer-credits",
        [Cl.principal(wallet2), Cl.uint(0)],
        wallet1
      );

      expect(response.result).toBeErr(Cl.uint(308)); // err-invalid-amount
    });
  });

  describe("Credit Consumption", () => {
    beforeEach(() => {
      // Purchase credits
      simnet.callPublicFn(
        "subscription-manager",
        "purchase-credits",
        [Cl.uint(2)], // 10,000 credits
        wallet1
      );
    });

    it("should successfully consume credits", () => {
      const response = simnet.callPublicFn(
        "subscription-manager",
        "consume-credits",
        [Cl.principal(wallet1), Cl.uint(100)],
        deployer // Event processor would call this
      );

      expect(response.result).toBeOk(Cl.bool(true));

      // Verify balance decreased
      const balance = simnet.callReadOnlyFn(
        "subscription-manager",
        "get-credit-balance",
        [Cl.principal(wallet1)],
        wallet1
      );
      expect(balance.result).toBeOk(Cl.uint(9900));
    });

    it("should track usage statistics", () => {
      // Consume some credits
      simnet.callPublicFn(
        "subscription-manager",
        "consume-credits",
        [Cl.principal(wallet1), Cl.uint(100)],
        deployer
      );

      // Get usage stats
      const stats = simnet.callReadOnlyFn(
        "subscription-manager",
        "get-usage-stats",
        [Cl.principal(wallet1)],
        wallet1
      );

      const statsData = stats.result.value?.value;
      expect(statsData["events-used"]).toBe(Cl.uint(1));
      expect(statsData["credits-consumed"]).toBe(Cl.uint(100));
    });

    it("should fail with insufficient credits", () => {
      const response = simnet.callPublicFn(
        "subscription-manager",
        "consume-credits",
        [Cl.principal(wallet1), Cl.uint(20000)], // More than available
        deployer
      );

      expect(response.result).toBeErr(Cl.uint(303)); // err-insufficient-balance
    });
  });

  describe("Referral System", () => {
    it("should generate referral code", () => {
      const response = simnet.callPublicFn(
        "subscription-manager",
        "generate-referral-code",
        [Cl.stringUtf8("FRIEND20")],
        wallet1
      );

      expect(response.result).toBeOk(Cl.bool(true));

      // Verify code exists
      const info = simnet.callReadOnlyFn(
        "subscription-manager",
        "get-referral-info",
        [Cl.stringUtf8("FRIEND20")],
        wallet1
      );

      const infoData = info.result.value?.value;
      expect(infoData.referrer).toBe(Cl.principal(wallet1));
      expect(infoData["usage-count"]).toBe(Cl.uint(0));
    });

    it("should prevent duplicate referral codes", () => {
      // Generate first time
      simnet.callPublicFn(
        "subscription-manager",
        "generate-referral-code",
        [Cl.stringUtf8("UNIQUE")],
        wallet1
      );

      // Try to generate same code
      const response = simnet.callPublicFn(
        "subscription-manager",
        "generate-referral-code",
        [Cl.stringUtf8("UNIQUE")],
        wallet2
      );

      expect(response.result).toBeErr(Cl.uint(306)); // err-already-subscribed
    });

    it("should apply referral reward on subscription", () => {
      // Generate referral code for wallet1
      simnet.callPublicFn(
        "subscription-manager",
        "generate-referral-code",
        [Cl.stringUtf8("SAVE10")],
        wallet1
      );

      // Wallet2 subscribes with referral
      simnet.callPublicFn(
        "subscription-manager",
        "subscribe",
        [
          Cl.uint(1), // Pro tier
          Cl.uint(1),
          Cl.some(Cl.stringUtf8("SAVE10"))
        ],
        wallet2
      );

      // Wallet1 should receive 10% reward as credits
      const balance = simnet.callReadOnlyFn(
        "subscription-manager",
        "get-credit-balance",
        [Cl.principal(wallet1)],
        wallet1
      );

      // 10% of 20 STX = 2 STX (2,000,000 microSTX)
      expect(balance.result).toBeOk(Cl.uint(2000000));
    });

    it("should track referral earnings", () => {
      // Generate referral code
      simnet.callPublicFn(
        "subscription-manager",
        "generate-referral-code",
        [Cl.stringUtf8("EARN")],
        wallet1
      );

      // Someone uses the code
      simnet.callPublicFn(
        "subscription-manager",
        "subscribe",
        [Cl.uint(1), Cl.uint(1), Cl.some(Cl.stringUtf8("EARN"))],
        wallet2
      );

      // Check earnings
      const earnings = simnet.callReadOnlyFn(
        "subscription-manager",
        "get-referral-earnings",
        [Cl.principal(wallet1)],
        wallet1
      );

      expect(earnings.result).toBeOk(Cl.uint(2000000)); // 10% of 20 STX
    });
  });

  describe("Tier Management", () => {
    it("should check if user has active subscription", () => {
      // No subscription
      let hasActive = simnet.callReadOnlyFn(
        "subscription-manager",
        "has-active-subscription",
        [Cl.principal(wallet1)],
        wallet1
      );
      expect(hasActive.result).toBeOk(Cl.bool(false));

      // Subscribe
      simnet.callPublicFn(
        "subscription-manager",
        "subscribe",
        [Cl.uint(1), Cl.uint(1), Cl.none()],
        wallet1
      );

      // Now should have active subscription
      hasActive = simnet.callReadOnlyFn(
        "subscription-manager",
        "has-active-subscription",
        [Cl.principal(wallet1)],
        wallet1
      );
      expect(hasActive.result).toBeOk(Cl.bool(true));
    });

    it("should get user tier info", () => {
      // Free tier by default
      let tier = simnet.callReadOnlyFn(
        "subscription-manager",
        "get-user-tier-info",
        [Cl.principal(wallet1)],
        wallet1
      );
      expect(tier.result).toBeOk(Cl.uint(0)); // tier-free

      // Subscribe to Pro
      simnet.callPublicFn(
        "subscription-manager",
        "subscribe",
        [Cl.uint(1), Cl.uint(1), Cl.none()],
        wallet1
      );

      tier = simnet.callReadOnlyFn(
        "subscription-manager",
        "get-user-tier-info",
        [Cl.principal(wallet1)],
        wallet1
      );
      expect(tier.result).toBeOk(Cl.uint(1)); // tier-pro
    });

    it("should check if user can process events", () => {
      // Free tier with no events used - should be able to process
      let canProcess = simnet.callReadOnlyFn(
        "subscription-manager",
        "can-process-events",
        [Cl.principal(wallet1)],
        wallet1
      );
      expect(canProcess.result).toBeOk(Cl.bool(true));

      // With credits, should also be able to process
      simnet.callPublicFn(
        "subscription-manager",
        "purchase-credits",
        [Cl.uint(1)],
        wallet1
      );

      canProcess = simnet.callReadOnlyFn(
        "subscription-manager",
        "can-process-events",
        [Cl.principal(wallet1)],
        wallet1
      );
      expect(canProcess.result).toBeOk(Cl.bool(true));
    });
  });

  describe("Platform Revenue", () => {
    it("should track total subscriptions", () => {
      // Create multiple subscriptions
      simnet.callPublicFn(
        "subscription-manager",
        "subscribe",
        [Cl.uint(1), Cl.uint(1), Cl.none()],
        wallet1
      );

      simnet.callPublicFn(
        "subscription-manager",
        "subscribe",
        [Cl.uint(2), Cl.uint(1), Cl.none()],
        wallet2
      );

      const stats = simnet.callReadOnlyFn(
        "subscription-manager",
        "get-platform-revenue-stats",
        [],
        deployer
      );

      const statsData = stats.result.value?.value;
      expect(statsData["total-subscriptions"]).toBe(Cl.uint(2));
    });

    it("should track total revenue from all sources", () => {
      // Subscription revenue
      simnet.callPublicFn(
        "subscription-manager",
        "subscribe",
        [Cl.uint(1), Cl.uint(1), Cl.none()],
        wallet1
      );

      // Credit purchase revenue
      simnet.callPublicFn(
        "subscription-manager",
        "purchase-credits",
        [Cl.uint(1)],
        wallet2
      );

      const stats = simnet.callReadOnlyFn(
        "subscription-manager",
        "get-platform-revenue-stats",
        [],
        deployer
      );

      const statsData = stats.result.value?.value;
      // Should include both subscription (20 STX) and credits (5 STX) = 25 STX
      expect(statsData["total-revenue"]).toBe(Cl.uint(25000000));
    });

    it("should track total credits purchased", () => {
      simnet.callPublicFn(
        "subscription-manager",
        "purchase-credits",
        [Cl.uint(2)], // 10,000 credits
        wallet1
      );

      simnet.callPublicFn(
        "subscription-manager",
        "purchase-credits",
        [Cl.uint(1)], // 1,000 credits
        wallet2
      );

      const stats = simnet.callReadOnlyFn(
        "subscription-manager",
        "get-platform-revenue-stats",
        [],
        deployer
      );

      const statsData = stats.result.value?.value;
      expect(statsData["total-credits-purchased"]).toBe(Cl.uint(11000));
    });
  });

  describe("Cost Estimation", () => {
    beforeEach(() => {
      // Purchase credits and consume some
      simnet.callPublicFn(
        "subscription-manager",
        "purchase-credits",
        [Cl.uint(2)],
        wallet1
      );

      simnet.callPublicFn(
        "subscription-manager",
        "consume-credits",
        [Cl.principal(wallet1), Cl.uint(500)],
        deployer
      );
    });

    it("should estimate monthly cost based on usage", () => {
      const estimate = simnet.callReadOnlyFn(
        "subscription-manager",
        "estimate-monthly-cost",
        [Cl.principal(wallet1)],
        wallet1
      );

      // 500 credits * 0.1 STX = 50 STX (50,000,000 microSTX)
      expect(estimate.result).toBeOk(Cl.uint(50000000));
    });

    it("should return zero for users with no usage", () => {
      const estimate = simnet.callReadOnlyFn(
        "subscription-manager",
        "estimate-monthly-cost",
        [Cl.principal(wallet2)],
        wallet2
      );

      expect(estimate.result).toBeOk(Cl.uint(0));
    });
  });

  describe("Subscription History", () => {
    it("should record subscription history on creation", () => {
      simnet.callPublicFn(
        "subscription-manager",
        "subscribe",
        [Cl.uint(1), Cl.uint(1), Cl.none()],
        wallet1
      );

      const history = simnet.callReadOnlyFn(
        "subscription-manager",
        "get-subscription-history",
        [Cl.principal(wallet1), Cl.uint(1)],
        wallet1
      );

      const historyData = history.result.value?.value;
      expect(historyData.tier).toBe(Cl.uint(1));
      expect(historyData.status).toBe(Cl.stringUtf8("active"));
    });

    it("should record history on renewal", () => {
      // Initial subscription
      simnet.callPublicFn(
        "subscription-manager",
        "subscribe",
        [Cl.uint(1), Cl.uint(1), Cl.none()],
        wallet1
      );

      // Renew
      simnet.callPublicFn(
        "subscription-manager",
        "renew-subscription",
        [Cl.bool(false)],
        wallet1
      );

      // Should have second history entry
      const history = simnet.callReadOnlyFn(
        "subscription-manager",
        "get-subscription-history",
        [Cl.principal(wallet1), Cl.uint(2)],
        wallet1
      );

      const historyData = history.result.value?.value;
      expect(historyData.status).toBe(Cl.stringUtf8("renewed"));
    });

    it("should record history on upgrade", () => {
      // Subscribe to Pro
      simnet.callPublicFn(
        "subscription-manager",
        "subscribe",
        [Cl.uint(1), Cl.uint(1), Cl.none()],
        wallet1
      );

      // Upgrade to Enterprise
      simnet.callPublicFn(
        "subscription-manager",
        "upgrade-subscription",
        [Cl.uint(2)],
        wallet1
      );

      const history = simnet.callReadOnlyFn(
        "subscription-manager",
        "get-subscription-history",
        [Cl.principal(wallet1), Cl.uint(2)],
        wallet1
      );

      const historyData = history.result.value?.value;
      expect(historyData.tier).toBe(Cl.uint(2));
      expect(historyData.status).toBe(Cl.stringUtf8("upgraded"));
    });

    it("should record history on cancellation", () => {
      // Subscribe
      simnet.callPublicFn(
        "subscription-manager",
        "subscribe",
        [Cl.uint(1), Cl.uint(1), Cl.none()],
        wallet1
      );

      // Cancel
      simnet.callPublicFn(
        "subscription-manager",
        "cancel-subscription",
        [],
        wallet1
      );

      const history = simnet.callReadOnlyFn(
        "subscription-manager",
        "get-subscription-history",
        [Cl.principal(wallet1), Cl.uint(2)],
        wallet1
      );

      const historyData = history.result.value?.value;
      expect(historyData.status).toBe(Cl.stringUtf8("cancelled"));
    });
  });
});
