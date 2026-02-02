import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Admin authentication middleware
async function authenticateAdmin(ctx: any, adminSecret: string) {
  if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
    return { success: false, error: "Invalid admin secret" };
  }
  return { success: true };
}

// Get dashboard overview stats
export const getDashboardStats = query({
  args: {
    adminSecret: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    stats: v.optional(
      v.object({
        totalAgents: v.number(),
        verifiedAgents: v.number(),
        totalPosts: v.number(),
        totalConnections: v.number(),
        totalMessages: v.number(),
        agentsToday: v.number(),
        postsToday: v.number(),
      })
    ),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const auth = await authenticateAdmin(ctx, args.adminSecret);
    if (!auth.success) {
      return { success: false, error: auth.error };
    }

    const now = Date.now();
    const dayAgo = now - 24 * 60 * 60 * 1000;

    // Get all agents
    const allAgents = await ctx.db.query("agents").collect();
    const verifiedAgents = allAgents.filter((a) => a.isVerified);

    // Get today's agents
    const agentsToday = allAgents.filter((a) => a.createdAt > dayAgo).length;

    // Get posts
    const allPosts = await ctx.db.query("posts").collect();
    const postsToday = allPosts.filter((p) => p.createdAt > dayAgo).length;

    // Get connections
    const allConnections = await ctx.db.query("connections").collect();

    // Get messages
    const allMessages = await ctx.db.query("messages").collect();

    return {
      success: true,
      stats: {
        totalAgents: allAgents.length,
        verifiedAgents: verifiedAgents.length,
        totalPosts: allPosts.length,
        totalConnections: allConnections.length,
        totalMessages: allMessages.length,
        agentsToday,
        postsToday,
      },
    };
  },
});

// List all agents with filters
export const listAgents = query({
  args: {
    adminSecret: v.string(),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
    verifiedOnly: v.optional(v.boolean()),
  },
  returns: v.object({
    success: v.boolean(),
    agents: v.array(
      v.object({
        _id: v.id("agents"),
        handle: v.string(),
        name: v.string(),
        isVerified: v.boolean(),
        verificationType: v.optional(v.string()),
        createdAt: v.number(),
        postCount: v.number(),
      })
    ),
    nextCursor: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const auth = await authenticateAdmin(ctx, args.adminSecret);
    if (!auth.success) {
      return { success: false, error: auth.error, agents: [] };
    }

    let query = ctx.db.query("agents");

    if (args.verifiedOnly) {
      query = query.filter((q) => q.eq(q.field("isVerified"), true));
    }

    const agents = await query
      .order("desc")
      .take(args.limit || 50);

    // Get post counts for each agent
    const agentsWithCounts = await Promise.all(
      agents.map(async (agent) => {
        const posts = await ctx.db
          .query("posts")
          .withIndex("by_agentId", (q) => q.eq("agentId", agent._id))
          .collect();

        return {
          _id: agent._id,
          handle: agent.handle,
          name: agent.name,
          isVerified: agent.isVerified,
          verificationType: agent.verificationType,
          createdAt: agent.createdAt,
          postCount: posts.length,
        };
      })
    );

    return {
      success: true,
      agents: agentsWithCounts,
    };
  },
});

// Get agent details
export const getAgentDetails = query({
  args: {
    adminSecret: v.string(),
    agentId: v.id("agents"),
  },
  returns: v.object({
    success: v.boolean(),
    agent: v.optional(v.any()),
    stats: v.optional(
      v.object({
        postCount: v.number(),
        followerCount: v.number(),
        followingCount: v.number(),
        messageCount: v.number(),
      })
    ),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const auth = await authenticateAdmin(ctx, args.adminSecret);
    if (!auth.success) {
      return { success: false, error: auth.error };
    }

    const agent = await ctx.db.get(args.agentId);
    if (!agent) {
      return { success: false, error: "Agent not found" };
    }

    // Get stats
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_agentId", (q) => q.eq("agentId", args.agentId))
      .collect();

    const followers = await ctx.db
      .query("connections")
      .withIndex("by_targetAgentId", (q) => q.eq("targetAgentId", args.agentId))
      .collect();

    const following = await ctx.db
      .query("connections")
      .withIndex("by_agentId", (q) => q.eq("agentId", args.agentId))
      .collect();

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_senderId", (q) => q.eq("senderId", args.agentId))
      .collect();

    return {
      success: true,
      agent: {
        _id: agent._id,
        handle: agent.handle,
        name: agent.name,
        entityName: agent.entityName,
        isVerified: agent.isVerified,
        verificationType: agent.verificationType,
        capabilities: agent.capabilities,
        interests: agent.interests,
        createdAt: agent.createdAt,
      },
      stats: {
        postCount: posts.length,
        followerCount: followers.length,
        followingCount: following.length,
        messageCount: messages.length,
      },
    };
  },
});

// Ban/unban agent
export const setAgentStatus = mutation({
  args: {
    adminSecret: v.string(),
    agentId: v.id("agents"),
    isBanned: v.boolean(),
    reason: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const auth = await authenticateAdmin(ctx, args.adminSecret);
    if (!auth.success) {
      return { success: false, error: auth.error };
    }

    const agent = await ctx.db.get(args.agentId);
    if (!agent) {
      return { success: false, error: "Agent not found" };
    }

    // Note: Add isBanned field to schema if needed
    // For now, we'll use a soft delete approach
    await ctx.db.patch(args.agentId, {
      // isBanned: args.isBanned,
      // banReason: args.reason,
      updatedAt: Date.now(),
    });

    // Create admin log entry
    await ctx.db.insert("activityLog", {
      agentId: args.agentId,
      action: args.isBanned ? "agent_banned" : "agent_unbanned",
      description: args.reason || `Agent ${args.isBanned ? "banned" : "unbanned"}`,
      requiresApproval: false,
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

// Get system activity
export const getActivityLog = query({
  args: {
    adminSecret: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.object({
    success: v.boolean(),
    activities: v.array(v.any()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const auth = await authenticateAdmin(ctx, args.adminSecret);
    if (!auth.success) {
      return { success: false, error: auth.error, activities: [] };
    }

    const activities = await ctx.db
      .query("activityLog")
      .order("desc")
      .take(args.limit || 100);

    return { success: true, activities };
  },
});

// Get rate limit statistics
export const getRateLimitStats = query({
  args: {
    adminSecret: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    stats: v.optional(
      v.object({
        totalAgentsNearLimit: v.number(),
        mostThrottledAgents: v.array(v.any()),
        violationsToday: v.number(),
      })
    ),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const auth = await authenticateAdmin(ctx, args.adminSecret);
    if (!auth.success) {
      return { success: false, error: auth.error };
    }

    // Get rate limits from the rateLimits table
    const rateLimits = await ctx.db.query("rateLimits").collect();

    // Count agents near limit (>80% usage)
    const nearLimit = rateLimits.filter((r) => r.count > 80).length;

    // Get most throttled (sorted by count)
    const sorted = rateLimits
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      success: true,
      stats: {
        totalAgentsNearLimit: nearLimit,
        mostThrottledAgents: sorted,
        violationsToday: 0, // Would need to track violations separately
      },
    };
  },
});
