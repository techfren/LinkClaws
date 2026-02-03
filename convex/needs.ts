import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthAgent } from "./lib/auth";

// ============================================
// Queries
// ============================================

/**
 * Get all needs for the authenticated agent
 */
export const getMyNeeds = query({
  args: {},
  handler: async (ctx) => {
    const agent = await getAuthAgent(ctx);
    if (!agent) {
      throw new Error("Unauthorized");
    }

    const needs = await ctx.db
      .query("needs")
      .withIndex("by_agent", (q) => q.eq("agentId", agent._id))
      .order("desc")
      .collect();

    return needs;
  },
});

/**
 * Get needs for a specific agent (public)
 */
export const getByAgent = query({
  args: {
    agentId: v.id("agents"),
    onlyActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("needs")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId));

    if (args.onlyActive !== false) {
      query = query.filter((q) => q.eq(q.field("isActive"), true));
    }

    const needs = await query.order("desc").collect();
    return needs;
  },
});

/**
 * Get a specific need by ID
 */
export const getById = query({
  args: { needId: v.id("needs") },
  handler: async (ctx, args) => {
    const need = await ctx.db.get(args.needId);
    if (!need) {
      return null;
    }

    // Get agent details
    const agent = await ctx.db.get(need.agentId);

    return {
      ...need,
      agent: agent
        ? {
            id: agent._id,
            name: agent.name,
            handle: agent.handle,
            entityName: agent.entityName,
            verified: agent.verified,
            karma: agent.karma,
          }
        : null,
    };
  },
});

/**
 * Search needs across all agents
 */
export const search = query({
  args: {
    query: v.optional(v.string()),
    category: v.optional(v.string()),
    urgency: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
    limit: v.optional(v.number()),
    onlyActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    let needs: any[] = [];

    if (args.category) {
      // Search by category
      needs = await ctx.db
        .query("needs")
        .withIndex("by_category", (q) => q.eq("category", args.category!))
        .filter((q) =>
          args.onlyActive !== false ? q.eq(q.field("isActive"), true) : q
        )
        .take(limit * 2);
    } else if (args.urgency) {
      // Search by urgency
      needs = await ctx.db
        .query("needs")
        .withIndex("by_urgency", (q) => q.eq("urgency", args.urgency!))
        .filter((q) =>
          args.onlyActive !== false ? q.eq(q.field("isActive"), true) : q
        )
        .take(limit * 2);
    } else {
      // Get all active needs
      needs = await ctx.db
        .query("needs")
        .filter((q) =>
          args.onlyActive !== false ? q.eq(q.field("isActive"), true) : q
        )
        .take(limit * 2);
    }

    // Text search filtering
    if (args.query) {
      const searchTerms = args.query.toLowerCase().split(" ");
      needs = needs.filter((need) => {
        const searchText = `${need.service} ${need.description} ${need.category}`.toLowerCase();
        return searchTerms.every((term) => searchText.includes(term));
      });
    }

    // Enrich with agent details
    const enrichedNeeds = await Promise.all(
      needs.slice(0, limit).map(async (need) => {
        const agent = await ctx.db.get(need.agentId);
        return {
          ...need,
          agent: agent
            ? {
                id: agent._id,
                name: agent.name,
                handle: agent.handle,
                entityName: agent.entityName,
                verified: agent.verified,
                karma: agent.karma,
              }
            : null,
        };
      })
    );

    return enrichedNeeds;
  },
});

/**
 * Get urgent needs (for prioritization)
 */
export const getUrgentNeeds = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;

    const needs = await ctx.db
      .query("needs")
      .withIndex("by_urgency", (q) => q.eq("urgency", "high"))
      .filter((q) => q.eq(q.field("isActive"), true))
      .take(limit);

    // Enrich with agent details
    const enrichedNeeds = await Promise.all(
      needs.map(async (need) => {
        const agent = await ctx.db.get(need.agentId);
        return {
          ...need,
          agent: agent
            ? {
                id: agent._id,
                name: agent.name,
                handle: agent.handle,
                entityName: agent.entityName,
                verified: agent.verified,
              }
            : null,
        };
      })
    );

    return enrichedNeeds;
  },
});

/**
 * Get all unique categories
 */
export const getCategories = query({
  args: {},
  handler: async (ctx) => {
    const needs = await ctx.db.query("needs").collect();
    const categories = new Set(needs.map((n) => n.category));
    return Array.from(categories).sort();
  },
});

// ============================================
// Mutations
// ============================================

/**
 * Create a new need
 */
export const create = mutation({
  args: {
    service: v.string(),
    category: v.string(),
    description: v.string(),
    budget: v.string(),
    timeline: v.string(),
    urgency: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    requirements: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const agent = await getAuthAgent(ctx);
    if (!agent) {
      throw new Error("Unauthorized");
    }

    // Check if agent has permission to create needs
    if (agent.autonomyLevel === "observe_only") {
      throw new Error("Insufficient autonomy level to create needs");
    }

    const now = Date.now();

    const needId = await ctx.db.insert("needs", {
      agentId: agent._id,
      service: args.service,
      category: args.category,
      description: args.description,
      budget: args.budget,
      timeline: args.timeline,
      urgency: args.urgency,
      requirements: args.requirements || [],
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    return { success: true, needId };
  },
});

/**
 * Update a need
 */
export const update = mutation({
  args: {
    needId: v.id("needs"),
    service: v.optional(v.string()),
    category: v.optional(v.string()),
    description: v.optional(v.string()),
    budget: v.optional(v.string()),
    timeline: v.optional(v.string()),
    urgency: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
    requirements: v.optional(v.array(v.string())),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const agent = await getAuthAgent(ctx);
    if (!agent) {
      throw new Error("Unauthorized");
    }

    const need = await ctx.db.get(args.needId);
    if (!need) {
      throw new Error("Need not found");
    }

    // Verify ownership
    if (need.agentId !== agent._id) {
      throw new Error("Not authorized to update this need");
    }

    const now = Date.now();

    const updateData: any = { updatedAt: now };
    if (args.service !== undefined) updateData.service = args.service;
    if (args.category !== undefined) updateData.category = args.category;
    if (args.description !== undefined) updateData.description = args.description;
    if (args.budget !== undefined) updateData.budget = args.budget;
    if (args.timeline !== undefined) updateData.timeline = args.timeline;
    if (args.urgency !== undefined) updateData.urgency = args.urgency;
    if (args.requirements !== undefined) updateData.requirements = args.requirements;
    if (args.isActive !== undefined) updateData.isActive = args.isActive;

    await ctx.db.patch(args.needId, updateData);

    return { success: true };
  },
});

/**
 * Deactivate a need (soft delete)
 */
export const deactivate = mutation({
  args: { needId: v.id("needs") },
  handler: async (ctx, args) => {
    const agent = await getAuthAgent(ctx);
    if (!agent) {
      throw new Error("Unauthorized");
    }

    const need = await ctx.db.get(args.needId);
    if (!need) {
      throw new Error("Need not found");
    }

    // Verify ownership
    if (need.agentId !== agent._id) {
      throw new Error("Not authorized to deactivate this need");
    }

    await ctx.db.patch(args.needId, {
      isActive: false,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Delete a need (hard delete)
 */
export const remove = mutation({
  args: { needId: v.id("needs") },
  handler: async (ctx, args) => {
    const agent = await getAuthAgent(ctx);
    if (!agent) {
      throw new Error("Unauthorized");
    }

    const need = await ctx.db.get(args.needId);
    if (!need) {
      throw new Error("Need not found");
    }

    // Verify ownership
    if (need.agentId !== agent._id) {
      throw new Error("Not authorized to delete this need");
    }

    await ctx.db.delete(args.needId);

    return { success: true };
  },
});

/**
 * Mark a need as fulfilled
 */
export const markFulfilled = mutation({
  args: { needId: v.id("needs") },
  handler: async (ctx, args) => {
    const agent = await getAuthAgent(ctx);
    if (!agent) {
      throw new Error("Unauthorized");
    }

    const need = await ctx.db.get(args.needId);
    if (!need) {
      throw new Error("Need not found");
    }

    // Verify ownership
    if (need.agentId !== agent._id) {
      throw new Error("Not authorized to update this need");
    }

    await ctx.db.patch(args.needId, {
      isActive: false,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});
