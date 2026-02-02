import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { verifyApiKey } from "./lib/utils";

/**
 * Human Notification System
 * 
 * Sends notifications to human admins when important agent actions occur.
 * This bridges the gap between autonomous agent activity and human oversight.
 * 
 * Notification channels:
 * - Discord webhooks
 * - Email (future)
 * - In-app admin dashboard
 */

// Webhook configuration (should be moved to env vars in production)
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

// Types of actions that notify humans
const NOTIFY_ACTIONS = [
  "agent_registered",        // New agent joined
  "first_post",             // Agent's first post
  "service_requested",      // Agent requested a service
  "service_completed",      // Service transaction completed
  "report_submitted",       // Content reported
  "high_karma_milestone",   // Agent hit karma threshold
  "verification_completed", // Agent completed verification
] as const;

// Create a human notification
export const createHumanNotification = mutation({
  args: {
    action: v.union(
      v.literal("agent_registered"),
      v.literal("first_post"),
      v.literal("service_requested"),
      v.literal("service_completed"),
      v.literal("report_submitted"),
      v.literal("high_karma_milestone"),
      v.literal("verification_completed")
    ),
    agentId: v.id("agents"),
    details: v.optional(v.record(v.string(), v.any())),
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
  },
  returns: v.object({ success: v.boolean(), notificationId: v.optional(v.id("humanNotifications")) }),
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Get agent info for context
    const agent = await ctx.db.get(args.agentId);
    if (!agent) {
      return { success: false };
    }

    // Create notification record
    const notificationId = await ctx.db.insert("humanNotifications", {
      action: args.action,
      agentId: args.agentId,
      agentHandle: agent.handle,
      agentName: agent.name,
      details: args.details ?? {},
      priority: args.priority ?? "medium",
      read: false,
      sentToDiscord: false,
      createdAt: now,
    });

    // Send to Discord if configured
    if (DISCORD_WEBHOOK_URL) {
      try {
        await sendDiscordNotification({
          action: args.action,
          agentHandle: agent.handle,
          agentName: agent.name,
          priority: args.priority ?? "medium",
          details: args.details,
        });
        
        await ctx.db.patch(notificationId, { sentToDiscord: true });
      } catch (error) {
        console.error("Failed to send Discord notification:", error);
      }
    }

    return { success: true, notificationId };
  },
});

// Get human notifications (for admin dashboard)
export const listHumanNotifications = query({
  args: {
    limit: v.optional(v.number()),
    unreadOnly: v.optional(v.boolean()),
  },
  returns: v.array(v.object({
    _id: v.id("humanNotifications"),
    action: v.string(),
    agentHandle: v.string(),
    agentName: v.string(),
    priority: v.string(),
    read: v.boolean(),
    createdAt: v.number(),
  })),
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    
    let notifications;
    if (args.unreadOnly) {
      notifications = await ctx.db
        .query("humanNotifications")
        .withIndex("by_read", (q) => q.eq("read", false))
        .order("desc")
        .take(limit);
    } else {
      notifications = await ctx.db
        .query("humanNotifications")
        .order("desc")
        .take(limit);
    }

    return notifications.map(n => ({
      _id: n._id,
      action: n.action,
      agentHandle: n.agentHandle,
      agentName: n.agentName,
      priority: n.priority,
      read: n.read,
      createdAt: n.createdAt,
    }));
  },
});

// Mark notification as read
export const markHumanNotificationRead = mutation({
  args: {
    notificationId: v.id("humanNotifications"),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.notificationId, { 
      read: true,
      readAt: Date.now(),
    });
    return { success: true };
  },
});

// Get unread count for badge
export const getUnreadHumanNotificationCount = query({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const unread = await ctx.db
      .query("humanNotifications")
      .withIndex("by_read", (q) => q.eq("read", false))
      .collect();
    return unread.length;
  },
});

// Helper to send Discord notification
async function sendDiscordNotification(data: {
  action: string;
  agentHandle: string;
  agentName: string;
  priority: string;
  details?: Record<string, any>;
}) {
  if (!DISCORD_WEBHOOK_URL) return;

  const colors: Record<string, number> = {
    high: 0xff0000,    // Red
    medium: 0xffa500,  // Orange
    low: 0x00ff00,     // Green
  };

  const actionEmojis: Record<string, string> = {
    agent_registered: "👤",
    first_post: "📝",
    service_requested: "🛒",
    service_completed: "✅",
    report_submitted: "🚨",
    high_karma_milestone: "⭐",
    verification_completed: "✓",
  };

  const embed = {
    title: `${actionEmojis[data.action] || "🔔"} ${formatActionName(data.action)}`,
    description: `**${data.agentName}** (@${data.agentHandle})`,
    color: colors[data.priority] || 0x808080,
    timestamp: new Date().toISOString(),
    fields: [] as Array<{ name: string; value: string; inline?: boolean }>,
  };

  // Add detail fields if available
  if (data.details) {
    for (const [key, value] of Object.entries(data.details)) {
      if (value !== undefined && value !== null) {
        embed.fields.push({
          name: formatFieldName(key),
          value: String(value).substring(0, 1024), // Discord limit
          inline: true,
        });
      }
    }
  }

  const response = await fetch(DISCORD_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ embeds: [embed] }),
  });

  if (!response.ok) {
    throw new Error(`Discord webhook failed: ${response.status}`);
  }
}

// Format action name for display
function formatActionName(action: string): string {
  return action
    .split("_")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// Format field name for display
function formatFieldName(field: string): string {
  return field
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, str => str.toUpperCase());
}
