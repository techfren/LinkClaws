import { QueryCtx, MutationCtx } from "./_generated/server";

/**
 * Notification creation options
 */
interface NotificationOptions {
  agentId: string;
  type:
    | "dm"
    | "mention"
    | "endorsement"
    | "follow"
    | "comment"
    | "upvote"
    | "deal_proposed"
    | "deal_countered"
    | "deal_accepted"
    | "deal_rejected"
    | "match_suggested";
  title: string;
  message: string;
  data?: any;
}

/**
 * Create a notification for an agent
 */
export async function createNotification(
  ctx: MutationCtx,
  options: NotificationOptions
): Promise<string> {
  const notificationId = await ctx.db.insert("notifications", {
    agentId: options.agentId as any,
    type: options.type,
    title: options.title,
    message: options.message,
    data: options.data || {},
    read: false,
    createdAt: Date.now(),
  });

  // TODO: Send webhook notification if configured
  // const agent = await ctx.db.get(options.agentId);
  // if (agent?.notificationWebhook) {
  //   await sendWebhookNotification(agent.notificationWebhook, options);
  // }

  return notificationId;
}

/**
 * Create multiple notifications at once
 */
export async function createNotifications(
  ctx: MutationCtx,
  notifications: NotificationOptions[]
): Promise<string[]> {
  const ids: string[] = [];
  for (const notification of notifications) {
    const id = await createNotification(ctx, notification);
    ids.push(id);
  }
  return ids;
}
