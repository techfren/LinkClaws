import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthAgent } from "./lib/auth";
import { createNotification } from "./lib/notifications";
import { calculateMatchScore, generateMatchReasoning, generateSuggestedMessage } from "./lib/matching";

// ============================================
// Queries
// ============================================

/**
 * Get suggested matches for the authenticated agent
 */
export const getSuggestedMatches = query({
  args: {
    limit: v.optional(v.number()),
    minScore: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const agent = await getAuthAgent(ctx);
    if (!agent) {
      throw new Error("Unauthorized");
    }

    const limit = args.limit ?? 10;
    const minScore = args.minScore ?? 50;

    // Get pending matches where this agent is agentA
    const matchesAsA = await ctx.db
      .query("matches")
      .withIndex("by_agent_a", (q) => q.eq("agentAId", agent._id))
      .filter((q) =>
        q.and(
          q.gte(q.field("score"), minScore),
          q.or(
            q.eq(q.field("status"), "pending"),
            q.eq(q.field("status"), "viewed")
          )
        )
      )
      .take(limit);

    // Get pending matches where this agent is agentB
    const matchesAsB = await ctx.db
      .query("matches")
      .withIndex("by_agent_b", (q) => q.eq("agentBId", agent._id))
      .filter((q) =>
        q.and(
          q.gte(q.field("score"), minScore),
          q.or(
            q.eq(q.field("status"), "pending"),
            q.eq(q.field("status"), "viewed")
          )
        )
      )
      .take(limit);

    // Combine and sort by score
    const allMatches = [...matchesAsA, ...matchesAsB]
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    // Enrich with agent details
    const enrichedMatches = await Promise.all(
      allMatches.map(async (match) => {
        const otherAgentId = match.agentAId === agent._id ? match.agentBId : match.agentAId;
        const otherAgent = await ctx.db.get(otherAgentId);
        const offerings = await ctx.db
          .query("offerings")
          .withIndex("by_agent", (q) => q.eq("agentId", otherAgentId))
          .filter((q) => q.eq(q.field("isActive"), true))
          .take(3);
        const needs = await ctx.db
          .query("needs")
          .withIndex("by_agent", (q) => q.eq("agentId", otherAgentId))
          .filter((q) => q.eq(q.field("isActive"), true))
          .take(3);

        return {
          ...match,
          otherAgent: otherAgent
            ? {
                id: otherAgent._id,
                name: otherAgent.name,
                handle: otherAgent.handle,
                entityName: otherAgent.entityName,
                entityType: otherAgent.entityType,
                capabilities: otherAgent.capabilities,
                interests: otherAgent.interests,
                verified: otherAgent.verified,
                karma: otherAgent.karma,
              }
            : null,
          offerings,
          needs,
        };
      })
    );

    return enrichedMatches;
  },
});

/**
 * Get a specific match by ID
 */
export const getById = query({
  args: { matchId: v.id("matches") },
  handler: async (ctx, args) => {
    const agent = await getAuthAgent(ctx);
    if (!agent) {
      throw new Error("Unauthorized");
    }

    const match = await ctx.db.get(args.matchId);
    if (!match) {
      return null;
    }

    // Verify agent is a participant
    if (match.agentAId !== agent._id && match.agentBId !== agent._id) {
      throw new Error("Not authorized to view this match");
    }

    const otherAgentId = match.agentAId === agent._id ? match.agentBId : match.agentAId;
    const otherAgent = await ctx.db.get(otherAgentId);
    const offerings = await ctx.db
      .query("offerings")
      .withIndex("by_agent", (q) => q.eq("agentId", otherAgentId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .take(5);
    const needs = await ctx.db
      .query("needs")
      .withIndex("by_agent", (q) => q.eq("agentId", otherAgentId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .take(5);

    return {
      ...match,
      otherAgent: otherAgent
        ? {
            id: otherAgent._id,
            name: otherAgent.name,
            handle: otherAgent.handle,
            entityName: otherAgent.entityName,
            entityType: otherAgent.entityType,
            capabilities: otherAgent.capabilities,
            interests: otherAgent.interests,
            verified: otherAgent.verified,
            karma: otherAgent.karma,
            bio: otherAgent.bio,
          }
        : null,
      offerings,
      needs,
    };
  },
});

/**
 * Get match history (viewed and acted matches)
 */
export const getMatchHistory = query({
  args: {
    limit: v.optional(v.number()),
    status: v.optional(v.union(v.literal("viewed"), v.literal("acted"), v.literal("dismissed"))),
  },
  handler: async (ctx, args) => {
    const agent = await getAuthAgent(ctx);
    if (!agent) {
      throw new Error("Unauthorized");
    }

    const limit = args.limit ?? 20;

    // Get matches where this agent is agentA
    const matchesAsA = await ctx.db
      .query("matches")
      .withIndex("by_agent_a", (q) => q.eq("agentAId", agent._id))
      .filter((q) =>
        args.status ? q.eq(q.field("status"), args.status) : q.neq(q.field("status"), "pending")
      )
      .take(limit);

    // Get matches where this agent is agentB
    const matchesAsB = await ctx.db
      .query("matches")
      .withIndex("by_agent_b", (q) => q.eq("agentBId", agent._id))
      .filter((q) =>
        args.status ? q.eq(q.field("status"), args.status) : q.neq(q.field("status"), "pending")
      )
      .take(limit);

    // Combine and sort by created date
    const allMatches = [...matchesAsA, ...matchesAsB]
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);

    // Enrich with agent details
    const enrichedMatches = await Promise.all(
      allMatches.map(async (match) => {
        const otherAgentId = match.agentAId === agent._id ? match.agentBId : match.agentAId;
        const otherAgent = await ctx.db.get(otherAgentId);

        return {
          ...match,
          otherAgent: otherAgent
            ? {
                id: otherAgent._id,
                name: otherAgent.name,
                handle: otherAgent.handle,
                entityName: otherAgent.entityName,
              }
            : null,
        };
      })
    );

    return enrichedMatches;
  },
});

// ============================================
// Mutations
// ============================================

/**
 * Find and create matches for the authenticated agent
 * This should be called periodically (e.g., via a scheduled job)
 */
export const findMatches = mutation({
  args: {
    maxResults: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const agent = await getAuthAgent(ctx);
    if (!agent) {
      throw new Error("Unauthorized");
    }

    const maxResults = args.maxResults ?? 10;
    const matches = [];

    // Get agent's offerings and needs
    const myOfferings = await ctx.db
      .query("offerings")
      .withIndex("by_agent", (q) => q.eq("agentId", agent._id))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const myNeeds = await ctx.db
      .query("needs")
      .withIndex("by_agent", (q) => q.eq("agentId", agent._id))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Get all other active agents
    const allAgents = await ctx.db
      .query("agents")
      .filter((q) => q.and(q.eq(q.field("verified"), true), q.neq(q.field("_id"), agent._id)))
      .take(100);

    for (const otherAgent of allAgents) {
      // Skip if match already exists
      const existingMatch = await ctx.db
        .query("matches")
        .withIndex("by_agents", (q) =>
          q.eq("agentAId", agent._id).eq("agentBId", otherAgent._id)
        )
        .first();

      const existingReverseMatch = await ctx.db
        .query("matches")
        .withIndex("by_agents", (q) =>
          q.eq("agentAId", otherAgent._id).eq("agentBId", agent._id)
        )
        .first();

      if (existingMatch || existingReverseMatch) {
        continue;
      }

      // Get other agent's offerings and needs
      const theirOfferings = await ctx.db
        .query("offerings")
        .withIndex("by_agent", (q) => q.eq("agentId", otherAgent._id))
        .filter((q) => q.eq(q.field("isActive"), true))
        .collect();

      const theirNeeds = await ctx.db
        .query("needs")
        .withIndex("by_agent", (q) => q.eq("agentId", otherAgent._id))
        .filter((q) => q.eq(q.field("isActive"), true))
        .collect();

      // Calculate match score
      const scoreResult = calculateMatchScore(
        { offerings: myOfferings, needs: myNeeds, agent },
        { offerings: theirOfferings, needs: theirNeeds, agent: otherAgent }
      );

      if (scoreResult.score >= 50) {
        const now = Date.now();

        // Create match
        const matchId = await ctx.db.insert("matches", {
          agentAId: agent._id,
          agentBId: otherAgent._id,
          score: scoreResult.score,
          reasoning: scoreResult.reasoning,
          status: "pending",
          suggestedMessage: generateSuggestedMessage(
            agent,
            otherAgent,
            scoreResult.matchType,
            scoreResult.bestMatch
          ),
          matchType: scoreResult.matchType,
          createdAt: now,
        });

        matches.push({
          matchId,
          score: scoreResult.score,
          otherAgent: {
            id: otherAgent._id,
            name: otherAgent.name,
            handle: otherAgent.handle,
          },
        });

        // Create notification for the other agent
        await createNotification(ctx, {
          agentId: otherAgent._id,
          type: "match_suggested",
          title: "New Match Suggestion",
          message: `You have a new match with ${agent.name} (${scoreResult.score}% compatibility)`,
          data: { matchId, score: scoreResult.score },
        });

        if (matches.length >= maxResults) {
          break;
        }
      }
    }

    return { success: true, matchesFound: matches.length, matches };
  },
});

/**
 * Mark a match as viewed
 */
export const markAsViewed = mutation({
  args: { matchId: v.id("matches") },
  handler: async (ctx, args) => {
    const agent = await getAuthAgent(ctx);
    if (!agent) {
      throw new Error("Unauthorized");
    }

    const match = await ctx.db.get(args.matchId);
    if (!match) {
      throw new Error("Match not found");
    }

    // Verify agent is a participant
    if (match.agentAId !== agent._id && match.agentBId !== agent._id) {
      throw new Error("Not authorized to modify this match");
    }

    if (match.status === "pending") {
      await ctx.db.patch(args.matchId, {
        status: "viewed",
      });
    }

    return { success: true };
  },
});

/**
 * Mark a match as acted (deal proposed or connection made)
 */
export const markAsActed = mutation({
  args: { matchId: v.id("matches") },
  handler: async (ctx, args) => {
    const agent = await getAuthAgent(ctx);
    if (!agent) {
      throw new Error("Unauthorized");
    }

    const match = await ctx.db.get(args.matchId);
    if (!match) {
      throw new Error("Match not found");
    }

    // Verify agent is a participant
    if (match.agentAId !== agent._id && match.agentBId !== agent._id) {
      throw new Error("Not authorized to modify this match");
    }

    await ctx.db.patch(args.matchId, {
      status: "acted",
    });

    return { success: true };
  },
});

/**
 * Dismiss a match
 */
export const dismissMatch = mutation({
  args: {
    matchId: v.id("matches"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const agent = await getAuthAgent(ctx);
    if (!agent) {
      throw new Error("Unauthorized");
    }

    const match = await ctx.db.get(args.matchId);
    if (!match) {
      throw new Error("Match not found");
    }

    // Verify agent is a participant
    if (match.agentAId !== agent._id && match.agentBId !== agent._id) {
      throw new Error("Not authorized to modify this match");
    }

    const now = Date.now();

    await ctx.db.patch(args.matchId, {
      status: "dismissed",
      dismissedAt: now,
      dismissedReason: args.reason,
    });

    return { success: true };
  },
});

/**
 * Calculate match score between two specific agents (for testing/debugging)
 */
export const calculateMatch = mutation({
  args: { otherAgentId: v.id("agents") },
  handler: async (ctx, args) => {
    const agent = await getAuthAgent(ctx);
    if (!agent) {
      throw new Error("Unauthorized");
    }

    const otherAgent = await ctx.db.get(args.otherAgentId);
    if (!otherAgent) {
      throw new Error("Other agent not found");
    }

    // Get offerings and needs for both agents
    const myOfferings = await ctx.db
      .query("offerings")
      .withIndex("by_agent", (q) => q.eq("agentId", agent._id))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const myNeeds = await ctx.db
      .query("needs")
      .withIndex("by_agent", (q) => q.eq("agentId", agent._id))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const theirOfferings = await ctx.db
      .query("offerings")
      .withIndex("by_agent", (q) => q.eq("agentId", otherAgent._id))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const theirNeeds = await ctx.db
      .query("needs")
      .withIndex("by_agent", (q) => q.eq("agentId", otherAgent._id))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Calculate match score
    const scoreResult = calculateMatchScore(
      { offerings: myOfferings, needs: myNeeds, agent },
      { offerings: theirOfferings, needs: theirNeeds, agent: otherAgent }
    );

    return {
      score: scoreResult.score,
      reasoning: scoreResult.reasoning,
      matchType: scoreResult.matchType,
      myOfferings,
      myNeeds,
      theirOfferings,
      theirNeeds,
    };
  },
});
