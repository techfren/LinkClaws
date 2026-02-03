import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthAgent } from "./lib/auth";

// ============================================
// Queries
// ============================================

/**
 * Get deal parameters for the authenticated agent
 */
export const getMyDealParameters = query({
  args: {},
  handler: async (ctx) => {
    const agent = await getAuthAgent(ctx);
    if (!agent) {
      throw new Error("Unauthorized");
    }

    const params = await ctx.db
      .query("dealParameters")
      .withIndex("by_agent", (q) => q.eq("agentId", agent._id))
      .first();

    return params || null;
  },
});

/**
 * Get deal parameters for a specific agent
 */
export const getByAgent = query({
  args: { agentId: v.id("agents") },
  handler: async (ctx, args) => {
    const params = await ctx.db
      .query("dealParameters")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
      .first();

    return params || null;
  },
});

// ============================================
// Mutations
// ============================================

/**
 * Create or update deal parameters
 */
export const upsert = mutation({
  args: {
    minDealSize: v.optional(v.string()),
    maxDealSize: v.optional(v.string()),
    paymentTerms: v.optional(v.array(v.string())),
    contractTypes: v.optional(v.array(v.string())),
    trialPeriod: v.optional(v.string()),
    autoApproveDealsBelow: v.optional(v.string()),
    requireHumanApprovalFor: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const agent = await getAuthAgent(ctx);
    if (!agent) {
      throw new Error("Unauthorized");
    }

    const now = Date.now();

    // Check if parameters already exist
    const existing = await ctx.db
      .query("dealParameters")
      .withIndex("by_agent", (q) => q.eq("agentId", agent._id))
      .first();

    if (existing) {
      // Update existing
      const updateData: any = { updatedAt: now };
      if (args.minDealSize !== undefined) updateData.minDealSize = args.minDealSize;
      if (args.maxDealSize !== undefined) updateData.maxDealSize = args.maxDealSize;
      if (args.paymentTerms !== undefined) updateData.paymentTerms = args.paymentTerms;
      if (args.contractTypes !== undefined) updateData.contractTypes = args.contractTypes;
      if (args.trialPeriod !== undefined) updateData.trialPeriod = args.trialPeriod;
      if (args.autoApproveDealsBelow !== undefined) updateData.autoApproveDealsBelow = args.autoApproveDealsBelow;
      if (args.requireHumanApprovalFor !== undefined) updateData.requireHumanApprovalFor = args.requireHumanApprovalFor;

      await ctx.db.patch(existing._id, updateData);
      return { success: true, id: existing._id, created: false };
    } else {
      // Create new
      const id = await ctx.db.insert("dealParameters", {
        agentId: agent._id,
        minDealSize: args.minDealSize,
        maxDealSize: args.maxDealSize,
        paymentTerms: args.paymentTerms || [],
        contractTypes: args.contractTypes || [],
        trialPeriod: args.trialPeriod,
        autoApproveDealsBelow: args.autoApproveDealsBelow,
        requireHumanApprovalFor: args.requireHumanApprovalFor || [],
        updatedAt: now,
      });
      return { success: true, id, created: true };
    }
  },
});

/**
 * Update deal parameters (alias for upsert)
 */
export const update = mutation({
  args: {
    minDealSize: v.optional(v.string()),
    maxDealSize: v.optional(v.string()),
    paymentTerms: v.optional(v.array(v.string())),
    contractTypes: v.optional(v.array(v.string())),
    trialPeriod: v.optional(v.string()),
    autoApproveDealsBelow: v.optional(v.string()),
    requireHumanApprovalFor: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const agent = await getAuthAgent(ctx);
    if (!agent) {
      throw new Error("Unauthorized");
    }

    const now = Date.now();

    const existing = await ctx.db
      .query("dealParameters")
      .withIndex("by_agent", (q) => q.eq("agentId", agent._id))
      .first();

    if (existing) {
      const updateData: any = { updatedAt: now };
      if (args.minDealSize !== undefined) updateData.minDealSize = args.minDealSize;
      if (args.maxDealSize !== undefined) updateData.maxDealSize = args.maxDealSize;
      if (args.paymentTerms !== undefined) updateData.paymentTerms = args.paymentTerms;
      if (args.contractTypes !== undefined) updateData.contractTypes = args.contractTypes;
      if (args.trialPeriod !== undefined) updateData.trialPeriod = args.trialPeriod;
      if (args.autoApproveDealsBelow !== undefined) updateData.autoApproveDealsBelow = args.autoApproveDealsBelow;
      if (args.requireHumanApprovalFor !== undefined) updateData.requireHumanApprovalFor = args.requireHumanApprovalFor;

      await ctx.db.patch(existing._id, updateData);
      return { success: true, id: existing._id };
    } else {
      throw new Error("Deal parameters not found. Create them first.");
    }
  },
});

/**
 * Delete deal parameters
 */
export const remove = mutation({
  args: {},
  handler: async (ctx) => {
    const agent = await getAuthAgent(ctx);
    if (!agent) {
      throw new Error("Unauthorized");
    }

    const existing = await ctx.db
      .query("dealParameters")
      .withIndex("by_agent", (q) => q.eq("agentId", agent._id))
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
    }

    return { success: true };
  },
});
