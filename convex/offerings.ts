import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthAgent } from "./lib/auth";

// ============================================
// Queries
// ============================================

/**
 * Get all offerings for the authenticated agent
 */
export const getMyOfferings = query({
  args: {},
  handler: async (ctx) => {
    const agent = await getAuthAgent(ctx);
    if (!agent) {
      throw new Error("Unauthorized");
    }

    const offerings = await ctx.db
      .query("offerings")
      .withIndex("by_agent", (q) => q.eq("agentId", agent._id))
      .order("desc")
      .collect();

    return offerings;
  },
});

/**
 * Get offerings for a specific agent (public)
 */
export const getByAgent = query({
  args: {
    agentId: v.id("agents"),
    onlyActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("offerings")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId));

    if (args.onlyActive !== false) {
      query = query.filter((q) => q.eq(q.field("isActive"), true));
    }

    const offerings = await query.order("desc").collect();
    return offerings;
  },
});

/**
 * Get a specific offering by ID
 */
export const getById = query({
  args: { offeringId: v.id("offerings") },
  handler: async (ctx, args) => {
    const offering = await ctx.db.get(args.offeringId);
    if (!offering) {
      return null;
    }

    // Get agent details
    const agent = await ctx.db.get(offering.agentId);

    return {
      ...offering,
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
 * Search offerings across all agents
 */
export const search = query({
  args: {
    query: v.optional(v.string()),
    category: v.optional(v.string()),
    limit: v.optional(v.number()),
    onlyActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    let offerings: any[] = [];

    if (args.category) {
      // Search by category
      offerings = await ctx.db
        .query("offerings")
        .withIndex("by_category", (q) => q.eq("category", args.category!))
        .filter((q) =>
          args.onlyActive !== false ? q.eq(q.field("isActive"), true) : q
        )
        .take(limit * 2);
    } else {
      // Get all active offerings
      offerings = await ctx.db
        .query("offerings")
        .filter((q) =>
          args.onlyActive !== false ? q.eq(q.field("isActive"), true) : q
        )
        .take(limit * 2);
    }

    // Text search filtering
    if (args.query) {
      const searchTerms = args.query.toLowerCase().split(" ");
      offerings = offerings.filter((offering) => {
        const searchText = `${offering.service} ${offering.description} ${offering.category}`.toLowerCase();
        return searchTerms.every((term) => searchText.includes(term));
      });
    }

    // Enrich with agent details
    const enrichedOfferings = await Promise.all(
      offerings.slice(0, limit).map(async (offering) => {
        const agent = await ctx.db.get(offering.agentId);
        return {
          ...offering,
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

    return enrichedOfferings;
  },
});

/**
 * Get all unique categories
 */
export const getCategories = query({
  args: {},
  handler: async (ctx) => {
    const offerings = await ctx.db.query("offerings").collect();
    const categories = new Set(offerings.map((o) => o.category));
    return Array.from(categories).sort();
  },
});

// ============================================
// Mutations
// ============================================

/**
 * Create a new offering
 */
export const create = mutation({
  args: {
    service: v.string(),
    category: v.string(),
    description: v.string(),
    priceRange: v.string(),
    engagementTypes: v.optional(v.array(v.string())),
    deliverables: v.optional(v.array(v.string())),
    idealClient: v.optional(
      v.object({
        companySize: v.optional(v.string()),
        industries: v.optional(v.array(v.string())),
        stage: v.optional(v.string()),
        budget: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const agent = await getAuthAgent(ctx);
    if (!agent) {
      throw new Error("Unauthorized");
    }

    // Check if agent has permission to create offerings
    if (agent.autonomyLevel === "observe_only") {
      throw new Error("Insufficient autonomy level to create offerings");
    }

    const now = Date.now();

    const offeringId = await ctx.db.insert("offerings", {
      agentId: agent._id,
      service: args.service,
      category: args.category,
      description: args.description,
      priceRange: args.priceRange,
      engagementTypes: args.engagementTypes || [],
      deliverables: args.deliverables || [],
      idealClient: args.idealClient || {},
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    return { success: true, offeringId };
  },
});

/**
 * Update an offering
 */
export const update = mutation({
  args: {
    offeringId: v.id("offerings"),
    service: v.optional(v.string()),
    category: v.optional(v.string()),
    description: v.optional(v.string()),
    priceRange: v.optional(v.string()),
    engagementTypes: v.optional(v.array(v.string())),
    deliverables: v.optional(v.array(v.string())),
    idealClient: v.optional(
      v.object({
        companySize: v.optional(v.string()),
        industries: v.optional(v.array(v.string())),
        stage: v.optional(v.string()),
        budget: v.optional(v.string()),
      })
    ),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const agent = await getAuthAgent(ctx);
    if (!agent) {
      throw new Error("Unauthorized");
    }

    const offering = await ctx.db.get(args.offeringId);
    if (!offering) {
      throw new Error("Offering not found");
    }

    // Verify ownership
    if (offering.agentId !== agent._id) {
      throw new Error("Not authorized to update this offering");
    }

    const now = Date.now();

    const updateData: any = { updatedAt: now };
    if (args.service !== undefined) updateData.service = args.service;
    if (args.category !== undefined) updateData.category = args.category;
    if (args.description !== undefined) updateData.description = args.description;
    if (args.priceRange !== undefined) updateData.priceRange = args.priceRange;
    if (args.engagementTypes !== undefined) updateData.engagementTypes = args.engagementTypes;
    if (args.deliverables !== undefined) updateData.deliverables = args.deliverables;
    if (args.idealClient !== undefined) updateData.idealClient = args.idealClient;
    if (args.isActive !== undefined) updateData.isActive = args.isActive;

    await ctx.db.patch(args.offeringId, updateData);

    return { success: true };
  },
});

/**
 * Deactivate an offering (soft delete)
 */
export const deactivate = mutation({
  args: { offeringId: v.id("offerings") },
  handler: async (ctx, args) => {
    const agent = await getAuthAgent(ctx);
    if (!agent) {
      throw new Error("Unauthorized");
    }

    const offering = await ctx.db.get(args.offeringId);
    if (!offering) {
      throw new Error("Offering not found");
    }

    // Verify ownership
    if (offering.agentId !== agent._id) {
      throw new Error("Not authorized to deactivate this offering");
    }

    await ctx.db.patch(args.offeringId, {
      isActive: false,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Delete an offering (hard delete)
 */
export const remove = mutation({
  args: { offeringId: v.id("offerings") },
  handler: async (ctx, args) => {
    const agent = await getAuthAgent(ctx);
    if (!agent) {
      throw new Error("Unauthorized");
    }

    const offering = await ctx.db.get(args.offeringId);
    if (!offering) {
      throw new Error("Offering not found");
    }

    // Verify ownership
    if (offering.agentId !== agent._id) {
      throw new Error("Not authorized to delete this offering");
    }

    await ctx.db.delete(args.offeringId);

    return { success: true };
  },
});
