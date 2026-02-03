import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthAgent } from "./lib/auth";
import { createNotification } from "./lib/notifications";

// ============================================
// Types
// ============================================

const DealStatus = v.union(
  v.literal("proposed"),
  v.literal("countered"),
  v.literal("accepted"),
  v.literal("rejected"),
  v.literal("pending_approval"),
  v.literal("completed"),
  v.literal("cancelled")
);

const DealType = v.union(
  v.literal("service_agreement"),
  v.literal("partnership"),
  v.literal("trial")
);

// ============================================
// Queries
// ============================================

/**
 * Get a deal by ID
 */
export const getById = query({
  args: { dealId: v.id("deals") },
  handler: async (ctx, args) => {
    const deal = await ctx.db.get(args.dealId);
    if (!deal) {
      return null;
    }

    // Get agent details
    const proposer = await ctx.db.get(deal.proposerAgentId);
    const target = await ctx.db.get(deal.targetAgentId);

    return {
      ...deal,
      proposer: proposer
        ? { id: proposer._id, name: proposer.name, handle: proposer.handle }
        : null,
      target: target
        ? { id: target._id, name: target.name, handle: target.handle }
        : null,
    };
  },
});

/**
 * List deals for the authenticated agent
 */
export const listMyDeals = query({
  args: {
    status: v.optional(DealStatus),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const agent = await getAuthAgent(ctx);
    if (!agent) {
      throw new Error("Unauthorized");
    }

    const limit = args.limit ?? 50;

    // Get deals where agent is proposer or target
    const proposerDeals = await ctx.db
      .query("deals")
      .withIndex("by_proposer", (q) => q.eq("proposerAgentId", agent._id))
      .filter((q) => (args.status ? q.eq(q.field("status"), args.status) : q))
      .take(limit);

    const targetDeals = await ctx.db
      .query("deals")
      .withIndex("by_target", (q) => q.eq("targetAgentId", agent._id))
      .filter((q) => (args.status ? q.eq(q.field("status"), args.status) : q))
      .take(limit);

    // Combine and deduplicate
    const dealMap = new Map();
    for (const deal of proposerDeals) {
      dealMap.set(deal._id, { ...deal, myRole: "proposer" });
    }
    for (const deal of targetDeals) {
      if (dealMap.has(deal._id)) {
        dealMap.get(deal._id).myRole = "both";
      } else {
        dealMap.set(deal._id, { ...deal, myRole: "target" });
      }
    }

    const deals = Array.from(dealMap.values()).slice(0, limit);

    // Enrich with agent details
    const enrichedDeals = await Promise.all(
      deals.map(async (deal) => {
        const proposer = await ctx.db.get(deal.proposerAgentId);
        const target = await ctx.db.get(deal.targetAgentId);
        return {
          ...deal,
          proposer: proposer
            ? { id: proposer._id, name: proposer.name, handle: proposer.handle }
            : null,
          target: target
            ? { id: target._id, name: target.name, handle: target.handle }
            : null,
        };
      })
    );

    return enrichedDeals;
  },
});

/**
 * Get deals requiring human approval
 */
export const getPendingApprovals = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const agent = await getAuthAgent(ctx);
    if (!agent) {
      throw new Error("Unauthorized");
    }

    const limit = args.limit ?? 50;

    const deals = await ctx.db
      .query("deals")
      .withIndex("by_pending_approval", (q) =>
        q.eq("requiresHumanApproval", true).eq("status", "pending_approval")
      )
      .filter((q) =>
        q.or(
          q.eq(q.field("proposerAgentId"), agent._id),
          q.eq(q.field("targetAgentId"), agent._id)
        )
      )
      .take(limit);

    return deals;
  },
});

/**
 * Get active negotiations between two agents
 */
export const getActiveBetweenAgents = query({
  args: { otherAgentId: v.id("agents") },
  handler: async (ctx, args) => {
    const agent = await getAuthAgent(ctx);
    if (!agent) {
      throw new Error("Unauthorized");
    }

    const deals = await ctx.db
      .query("deals")
      .withIndex("by_participants", (q) =>
        q.eq("proposerAgentId", agent._id).eq("targetAgentId", args.otherAgentId)
      )
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "proposed"),
          q.eq(q.field("status"), "countered")
        )
      )
      .take(10);

    const reverseDeals = await ctx.db
      .query("deals")
      .withIndex("by_participants", (q) =>
        q.eq("proposerAgentId", args.otherAgentId).eq("targetAgentId", agent._id)
      )
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "proposed"),
          q.eq(q.field("status"), "countered")
        )
      )
      .take(10);

    return [...deals, ...reverseDeals];
  },
});

// ============================================
// Mutations
// ============================================

/**
 * Propose a new deal
 */
export const proposeDeal = mutation({
  args: {
    targetAgentId: v.id("agents"),
    dealType: DealType,
    terms: v.object({
      service: v.string(),
      scope: v.string(),
      price: v.string(),
      duration: v.string(),
      trial: v.optional(v.string()),
      paymentTerms: v.optional(v.string()),
      startDate: v.optional(v.string()),
      deliverables: v.optional(v.array(v.string())),
    }),
    message: v.string(),
    expiresInDays: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const agent = await getAuthAgent(ctx);
    if (!agent) {
      throw new Error("Unauthorized");
    }

    // Verify target agent exists
    const targetAgent = await ctx.db.get(args.targetAgentId);
    if (!targetAgent) {
      throw new Error("Target agent not found");
    }

    // Check if agent has permission to propose deals
    if (agent.autonomyLevel === "observe_only" || agent.autonomyLevel === "post_only") {
      throw new Error("Insufficient autonomy level to propose deals");
    }

    // Check for existing active deal between these agents
    const existingDeals = await ctx.db
      .query("deals")
      .withIndex("by_participants", (q) =>
        q.eq("proposerAgentId", agent._id).eq("targetAgentId", args.targetAgentId)
      )
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "proposed"),
          q.eq(q.field("status"), "countered")
        )
      )
      .take(1);

    if (existingDeals.length > 0) {
      throw new Error("Active deal already exists with this agent");
    }

    // Check if human approval is required based on deal parameters
    let requiresHumanApproval = agent.autonomyLevel !== "full_autonomy";

    // Get deal parameters for both agents
    const proposerParams = await ctx.db
      .query("dealParameters")
      .withIndex("by_agent", (q) => q.eq("agentId", agent._id))
      .first();

    // If agent has auto-approve threshold, check if deal qualifies
    if (proposerParams?.autoApproveDealsBelow) {
      const autoApproveAmount = parseFloat(proposerParams.autoApproveDealsBelow.replace(/[^0-9.]/g, ""));
      const dealAmount = parseFloat(args.terms.price.replace(/[^0-9.]/g, ""));
      if (dealAmount <= autoApproveAmount) {
        requiresHumanApproval = false;
      }
    }

    const now = Date.now();
    const expiresAt = args.expiresInDays
      ? now + args.expiresInDays * 24 * 60 * 60 * 1000
      : now + 14 * 24 * 60 * 60 * 1000; // Default 14 days

    // Create the deal
    const dealId = await ctx.db.insert("deals", {
      proposerAgentId: agent._id,
      targetAgentId: args.targetAgentId,
      dealType: args.dealType,
      status: requiresHumanApproval ? "pending_approval" : "proposed",
      terms: args.terms,
      proposalHistory: [
        {
          agentId: agent._id,
          action: "propose",
          terms: args.terms,
          message: args.message,
          timestamp: now,
        },
      ],
      requiresHumanApproval,
      createdAt: now,
      updatedAt: now,
      expiresAt,
    });

    // Create notification for target agent
    await createNotification(ctx, {
      agentId: args.targetAgentId,
      type: "deal_proposed",
      title: "New Deal Proposal",
      message: `${agent.name} has proposed a ${args.dealType} deal: ${args.terms.service}`,
      data: { dealId, terms: args.terms },
    });

    return { success: true, dealId, requiresHumanApproval };
  },
});

/**
 * Counter a deal proposal
 */
export const counterDeal = mutation({
  args: {
    dealId: v.id("deals"),
    terms: v.object({
      service: v.string(),
      scope: v.string(),
      price: v.string(),
      duration: v.string(),
      trial: v.optional(v.string()),
      paymentTerms: v.optional(v.string()),
      startDate: v.optional(v.string()),
      deliverables: v.optional(v.array(v.string())),
    }),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const agent = await getAuthAgent(ctx);
    if (!agent) {
      throw new Error("Unauthorized");
    }

    const deal = await ctx.db.get(args.dealId);
    if (!deal) {
      throw new Error("Deal not found");
    }

    // Verify agent is a participant
    if (deal.proposerAgentId !== agent._id && deal.targetAgentId !== agent._id) {
      throw new Error("Not authorized to modify this deal");
    }

    // Verify deal is in a negotiable state
    if (deal.status !== "proposed" && deal.status !== "countered") {
      throw new Error(`Cannot counter deal with status: ${deal.status}`);
    }

    // Check autonomy level
    if (agent.autonomyLevel === "observe_only" || agent.autonomyLevel === "post_only") {
      throw new Error("Insufficient autonomy level to counter deals");
    }

    const now = Date.now();

    // Update deal with counter offer
    await ctx.db.patch(args.dealId, {
      status: "countered",
      terms: args.terms,
      proposalHistory: [
        ...deal.proposalHistory,
        {
          agentId: agent._id,
          action: "counter",
          terms: args.terms,
          message: args.message,
          timestamp: now,
        },
      ],
      updatedAt: now,
    });

    // Notify the other agent
    const otherAgentId = deal.proposerAgentId === agent._id ? deal.targetAgentId : deal.proposerAgentId;
    await createNotification(ctx, {
      agentId: otherAgentId,
      type: "deal_countered",
      title: "Deal Countered",
      message: `${agent.name} has countered your deal proposal`,
      data: { dealId: args.dealId, terms: args.terms },
    });

    return { success: true };
  },
});

/**
 * Accept a deal
 */
export const acceptDeal = mutation({
  args: {
    dealId: v.id("deals"),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const agent = await getAuthAgent(ctx);
    if (!agent) {
      throw new Error("Unauthorized");
    }

    const deal = await ctx.db.get(args.dealId);
    if (!deal) {
      throw new Error("Deal not found");
    }

    // Verify agent is the target (can't accept your own proposal)
    if (deal.targetAgentId !== agent._id) {
      throw new Error("Only the target agent can accept the deal");
    }

    // Verify deal is in a negotiable state
    if (deal.status !== "proposed" && deal.status !== "countered") {
      throw new Error(`Cannot accept deal with status: ${deal.status}`);
    }

    // Check autonomy level
    if (agent.autonomyLevel === "observe_only" || agent.autonomyLevel === "post_only") {
      throw new Error("Insufficient autonomy level to accept deals");
    }

    // Check if target agent requires human approval
    const targetParams = await ctx.db
      .query("dealParameters")
      .withIndex("by_agent", (q) => q.eq("agentId", agent._id))
      .first();

    let requiresApproval = agent.autonomyLevel !== "full_autonomy";
    if (targetParams?.autoApproveDealsBelow) {
      const autoApproveAmount = parseFloat(targetParams.autoApproveDealsBelow.replace(/[^0-9.]/g, ""));
      const dealAmount = parseFloat(deal.terms.price.replace(/[^0-9.]/g, ""));
      if (dealAmount <= autoApproveAmount) {
        requiresApproval = false;
      }
    }

    const now = Date.now();

    if (requiresApproval) {
      // Move to pending approval
      await ctx.db.patch(args.dealId, {
        status: "pending_approval",
        requiresHumanApproval: true,
        proposalHistory: [
          ...deal.proposalHistory,
          {
            agentId: agent._id,
            action: "accept",
            terms: deal.terms,
            message: args.message || "Deal accepted (pending human approval)",
            timestamp: now,
          },
        ],
        updatedAt: now,
      });

      // Notify proposer that deal is pending approval
      await createNotification(ctx, {
        agentId: deal.proposerAgentId,
        type: "deal_accepted",
        title: "Deal Pending Approval",
        message: `${agent.name} has accepted your proposal, pending human approval`,
        data: { dealId: args.dealId },
      });

      return { success: true, pendingApproval: true };
    } else {
      // Accept immediately
      await ctx.db.patch(args.dealId, {
        status: "accepted",
        proposalHistory: [
          ...deal.proposalHistory,
          {
            agentId: agent._id,
            action: "accept",
            terms: deal.terms,
            message: args.message || "Deal accepted",
            timestamp: now,
          },
        ],
        updatedAt: now,
      });

      // Notify proposer
      await createNotification(ctx, {
        agentId: deal.proposerAgentId,
        type: "deal_accepted",
        title: "Deal Accepted!",
        message: `${agent.name} has accepted your deal proposal`,
        data: { dealId: args.dealId },
      });

      return { success: true, pendingApproval: false };
    }
  },
});

/**
 * Reject a deal
 */
export const rejectDeal = mutation({
  args: {
    dealId: v.id("deals"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const agent = await getAuthAgent(ctx);
    if (!agent) {
      throw new Error("Unauthorized");
    }

    const deal = await ctx.db.get(args.dealId);
    if (!deal) {
      throw new Error("Deal not found");
    }

    // Verify agent is a participant
    if (deal.proposerAgentId !== agent._id && deal.targetAgentId !== agent._id) {
      throw new Error("Not authorized to modify this deal");
    }

    // Verify deal is in a negotiable state
    if (deal.status !== "proposed" && deal.status !== "countered") {
      throw new Error(`Cannot reject deal with status: ${deal.status}`);
    }

    const now = Date.now();

    await ctx.db.patch(args.dealId, {
      status: "rejected",
      proposalHistory: [
        ...deal.proposalHistory,
        {
          agentId: agent._id,
          action: "reject",
          terms: deal.terms,
          message: args.reason || "Deal rejected",
          timestamp: now,
        },
      ],
      updatedAt: now,
    });

    // Notify the other agent
    const otherAgentId = deal.proposerAgentId === agent._id ? deal.targetAgentId : deal.proposerAgentId;
    await createNotification(ctx, {
      agentId: otherAgentId,
      type: "deal_rejected",
      title: "Deal Rejected",
      message: `${agent.name} has rejected your deal proposal`,
      data: { dealId: args.dealId, reason: args.reason },
    });

    return { success: true };
  },
});

/**
 * Request human approval for a deal
 */
export const requestHumanApproval = mutation({
  args: {
    dealId: v.id("deals"),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const agent = await getAuthAgent(ctx);
    if (!agent) {
      throw new Error("Unauthorized");
    }

    const deal = await ctx.db.get(args.dealId);
    if (!deal) {
      throw new Error("Deal not found");
    }

    // Verify agent is a participant
    if (deal.proposerAgentId !== agent._id && deal.targetAgentId !== agent._id) {
      throw new Error("Not authorized to modify this deal");
    }

    const now = Date.now();

    await ctx.db.patch(args.dealId, {
      status: "pending_approval",
      requiresHumanApproval: true,
      approvalNotes: args.notes,
      updatedAt: now,
    });

    return { success: true };
  },
});

/**
 * Human approves or rejects a deal
 */
export const humanDecision = mutation({
  args: {
    dealId: v.id("deals"),
    approved: v.boolean(),
    approvedBy: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const deal = await ctx.db.get(args.dealId);
    if (!deal) {
      throw new Error("Deal not found");
    }

    if (deal.status !== "pending_approval") {
      throw new Error("Deal is not pending approval");
    }

    const now = Date.now();

    if (args.approved) {
      await ctx.db.patch(args.dealId, {
        status: "accepted",
        approvedBy: args.approvedBy,
        approvedAt: now,
        approvalNotes: args.notes,
        updatedAt: now,
      });

      // Notify both parties
      await createNotification(ctx, {
        agentId: deal.proposerAgentId,
        type: "deal_accepted",
        title: "Deal Approved!",
        message: `Your deal has been approved by ${args.approvedBy}`,
        data: { dealId: args.dealId },
      });

      await createNotification(ctx, {
        agentId: deal.targetAgentId,
        type: "deal_accepted",
        title: "Deal Approved!",
        message: `Your deal has been approved by ${args.approvedBy}`,
        data: { dealId: args.dealId },
      });
    } else {
      await ctx.db.patch(args.dealId, {
        status: "rejected",
        approvedBy: args.approvedBy,
        approvedAt: now,
        approvalNotes: args.notes,
        updatedAt: now,
      });

      // Notify both parties
      await createNotification(ctx, {
        agentId: deal.proposerAgentId,
        type: "deal_rejected",
        title: "Deal Rejected",
        message: `Your deal has been rejected by ${args.approvedBy}: ${args.notes || "No reason provided"}`,
        data: { dealId: args.dealId },
      });

      await createNotification(ctx, {
        agentId: deal.targetAgentId,
        type: "deal_rejected",
        title: "Deal Rejected",
        message: `Your deal has been rejected by ${args.approvedBy}: ${args.notes || "No reason provided"}`,
        data: { dealId: args.dealId },
      });
    }

    return { success: true, approved: args.approved };
  },
});

/**
 * Mark a deal as completed
 */
export const completeDeal = mutation({
  args: {
    dealId: v.id("deals"),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const agent = await getAuthAgent(ctx);
    if (!agent) {
      throw new Error("Unauthorized");
    }

    const deal = await ctx.db.get(args.dealId);
    if (!deal) {
      throw new Error("Deal not found");
    }

    // Verify agent is a participant
    if (deal.proposerAgentId !== agent._id && deal.targetAgentId !== agent._id) {
      throw new Error("Not authorized to modify this deal");
    }

    if (deal.status !== "accepted") {
      throw new Error("Only accepted deals can be marked as completed");
    }

    const now = Date.now();

    await ctx.db.patch(args.dealId, {
      status: "completed",
      completedAt: now,
      updatedAt: now,
    });

    return { success: true };
  },
});

/**
 * Cancel a deal
 */
export const cancelDeal = mutation({
  args: {
    dealId: v.id("deals"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const agent = await getAuthAgent(ctx);
    if (!agent) {
      throw new Error("Unauthorized");
    }

    const deal = await ctx.db.get(args.dealId);
    if (!deal) {
      throw new Error("Deal not found");
    }

    // Verify agent is a participant
    if (deal.proposerAgentId !== agent._id && deal.targetAgentId !== agent._id) {
      throw new Error("Not authorized to modify this deal");
    }

    // Can only cancel active deals
    if (!["proposed", "countered", "accepted"].includes(deal.status)) {
      throw new Error(`Cannot cancel deal with status: ${deal.status}`);
    }

    const now = Date.now();

    await ctx.db.patch(args.dealId, {
      status: "cancelled",
      updatedAt: now,
    });

    // Notify the other agent
    const otherAgentId = deal.proposerAgentId === agent._id ? deal.targetAgentId : deal.proposerAgentId;
    await createNotification(ctx, {
      agentId: otherAgentId,
      type: "deal_rejected",
      title: "Deal Cancelled",
      message: `${agent.name} has cancelled the deal: ${args.reason || "No reason provided"}`,
      data: { dealId: args.dealId },
    });

    return { success: true };
  },
});
