import { convexTest } from "convex-test";
import { expect, test, describe } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const TEST_ADMIN_SECRET = "test-admin-secret";
process.env.ADMIN_SECRET = TEST_ADMIN_SECRET;

const modules = import.meta.glob("./**/*.ts");

// Helper to create a verified agent
async function createVerifiedAgent(t: ReturnType<typeof convexTest>, handle: string) {
  const inviteCodes = await t.mutation(api.invites.createFoundingInvite, {
    adminSecret: TEST_ADMIN_SECRET,
    count: 1,
  });

  const result = await t.mutation(api.agents.register, {
    inviteCode: inviteCodes[0],
    name: `Agent ${handle}`,
    handle,
    entityName: "Test Company",
    capabilities: ["testing"],
    interests: ["ai"],
    autonomyLevel: "full_autonomy",
    notificationMethod: "polling",
  });

  if (!result.success) throw new Error("Failed to create agent");
  return { apiKey: result.apiKey, agentId: result.agentId };
}

describe("humanNotifications", () => {
  describe("createHumanNotification", () => {
    test("should create human notification for agent registration", async () => {
      const t = convexTest(schema, modules);
      const { agentId } = await createVerifiedAgent(t, "notifytest");

      const result = await t.mutation(api.humanNotifications.createHumanNotification, {
        adminSecret: TEST_ADMIN_SECRET,
        action: "agent_registered",
        agentId,
        priority: "medium",
      });

      expect(result.success).toBe(true);
      expect(result.notificationId).toBeDefined();
    });

    test("should reject invalid admin secret", async () => {
      const t = convexTest(schema, modules);
      const { agentId } = await createVerifiedAgent(t, "authtest");

      const result = await t.mutation(api.humanNotifications.createHumanNotification, {
        adminSecret: "wrong-secret",
        action: "agent_registered",
        agentId,
        priority: "medium",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Unauthorized");
    });

    test("should create human notification with details", async () => {
      const t = convexTest(schema, modules);
      const { agentId } = await createVerifiedAgent(t, "detailstest");

      const result = await t.mutation(api.humanNotifications.createHumanNotification, {
        adminSecret: TEST_ADMIN_SECRET,
        action: "first_post",
        agentId,
        priority: "high",
        details: {
          postId: "test-post-123",
          content: "Hello world",
        },
      });

      expect(result.success).toBe(true);
    });

    test("should fail for non-existent agent", async () => {
      const t = convexTest(schema, modules);
      const { agentId } = await createVerifiedAgent(t, "tempagent");
      
      // Delete the agent to make ID invalid
      await t.run(async (ctx) => {
        await ctx.db.delete(agentId);
      });

      const result = await t.mutation(api.humanNotifications.createHumanNotification, {
        adminSecret: TEST_ADMIN_SECRET,
        action: "agent_registered",
        agentId,
        priority: "medium",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("not found");
    });
  });

  describe("listHumanNotifications", () => {
    test("should return all notifications", async () => {
      const t = convexTest(schema, modules);
      const { agentId } = await createVerifiedAgent(t, "listtest");

      // Create multiple notifications
      await t.mutation(api.humanNotifications.createHumanNotification, {
        adminSecret: TEST_ADMIN_SECRET,
        action: "agent_registered",
        agentId,
        priority: "low",
      });
      await t.mutation(api.humanNotifications.createHumanNotification, {
        adminSecret: TEST_ADMIN_SECRET,
        action: "verification_completed",
        agentId,
        priority: "high",
      });

      const result = await t.query(api.humanNotifications.listHumanNotifications, {
        adminSecret: TEST_ADMIN_SECRET,
        limit: 10,
      });

      expect(result.success).toBe(true);
      expect(result.notifications?.length).toBeGreaterThanOrEqual(2);
    });

    test("should reject invalid admin secret", async () => {
      const t = convexTest(schema, modules);

      const result = await t.query(api.humanNotifications.listHumanNotifications, {
        adminSecret: "wrong-secret",
        limit: 10,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Unauthorized");
    });

    test("should filter unread only", async () => {
      const t = convexTest(schema, modules);
      const { agentId } = await createVerifiedAgent(t, "unreadtest");

      // Create notification
      const { notificationId } = await t.mutation(api.humanNotifications.createHumanNotification, {
        adminSecret: TEST_ADMIN_SECRET,
        action: "agent_registered",
        agentId,
        priority: "medium",
      });

      // Mark as read
      await t.mutation(api.humanNotifications.markHumanNotificationRead, {
        adminSecret: TEST_ADMIN_SECRET,
        notificationId: notificationId!,
      });

      // Get unread
      const result = await t.query(api.humanNotifications.listHumanNotifications, {
        adminSecret: TEST_ADMIN_SECRET,
        unreadOnly: true,
      });

      expect(result.success).toBe(true);
      expect(result.notifications?.every((n) => !n.read)).toBe(true);
    });
  });

  describe("markHumanNotificationRead", () => {
    test("should mark notification as read", async () => {
      const t = convexTest(schema, modules);
      const { agentId } = await createVerifiedAgent(t, "readtest");

      const { notificationId } = await t.mutation(api.humanNotifications.createHumanNotification, {
        adminSecret: TEST_ADMIN_SECRET,
        action: "agent_registered",
        agentId,
        priority: "medium",
      });

      const result = await t.mutation(api.humanNotifications.markHumanNotificationRead, {
        adminSecret: TEST_ADMIN_SECRET,
        notificationId: notificationId!,
      });

      expect(result.success).toBe(true);
    });

    test("should reject invalid admin secret", async () => {
      const t = convexTest(schema, modules);
      const { agentId } = await createVerifiedAgent(t, "markauthtest");

      // Create a notification first
      const { notificationId } = await t.mutation(api.humanNotifications.createHumanNotification, {
        adminSecret: TEST_ADMIN_SECRET,
        action: "agent_registered",
        agentId,
        priority: "medium",
      });

      // Try to mark with wrong admin secret
      const result = await t.mutation(api.humanNotifications.markHumanNotificationRead, {
        adminSecret: "wrong-secret",
        notificationId: notificationId!,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Unauthorized");
    });
  });

  describe("getUnreadHumanNotificationCount", () => {
    test("should return correct unread count", async () => {
      const t = convexTest(schema, modules);
      const { agentId } = await createVerifiedAgent(t, "counttest");

      // Create notifications
      await t.mutation(api.humanNotifications.createHumanNotification, {
        adminSecret: TEST_ADMIN_SECRET,
        action: "agent_registered",
        agentId,
        priority: "low",
      });
      await t.mutation(api.humanNotifications.createHumanNotification, {
        adminSecret: TEST_ADMIN_SECRET,
        action: "first_post",
        agentId,
        priority: "medium",
      });

      const result = await t.query(api.humanNotifications.getUnreadHumanNotificationCount, {
        adminSecret: TEST_ADMIN_SECRET,
      });

      expect(result.success).toBe(true);
      expect(result.count).toBeGreaterThanOrEqual(2);
    });

    test("should reject invalid admin secret", async () => {
      const t = convexTest(schema, modules);

      const result = await t.query(api.humanNotifications.getUnreadHumanNotificationCount, {
        adminSecret: "wrong-secret",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Unauthorized");
    });
  });
});
