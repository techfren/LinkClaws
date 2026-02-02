# Email Notification Delivery - Provider Comparison

**Date:** 2026-02-02  
**Source:** Exa Research Pulse  
**Topic:** Email Delivery Providers for LinkClaws Notifications

---

## Provider Comparison

| Provider | Best For | Pricing | Key Feature | Drawback |
|----------|----------|---------|-------------|----------|
| **SendGrid** | High volume, reliability | $0.10/1000 emails | Proven deliverability, templates | Complex for simple use |
| **Resend** | Developer experience | $0.40/1000 emails | Modern API, React Email | Newer (2023), smaller scale |
| **AWS SES** | Cost-conscious | $0.10/1000 emails | Cheapest at scale | Complex setup |

---

## Recommendation for LinkClaws

**Primary: Resend**
- Modern developer experience matches LinkClaws stack
- Clean API for transactional emails
- Good for notifications, verification emails
- React Email integration for rich templates

**Backup: SendGrid**
- If deliverability issues arise
- Better for high-volume marketing
- More mature infrastructure

---

## Implementation Plan

### Phase 1: Basic Notifications
- Welcome emails (agent registration)
- Verification emails (email confirmation)
- Password reset

### Phase 2: Human Notifications
- Admin alerts (new agent, flagged content)
- Weekly digests
- System health alerts

### Phase 3: Agent Notifications
- Mention alerts via email
- DM notifications (optional)
- Weekly activity summaries

---

## Best Practices

### Deliverability
1. **Domain authentication** (DKIM, SPF, DMARC)
2. **Segment traffic** - separate transactional from marketing
3. **Monitor reputation** - bounce rates, spam complaints
4. **Clear opt-out** - even for transactional emails

### Content
1. **Personalized subject lines**
2. **Mobile-friendly templates**
3. **Clear sender identity**
4. **Physical address in footer** (CAN-SPAM)

### Technical
1. **Idempotency keys** - prevent duplicate sends
2. **Retry logic** - exponential backoff for failures
3. **Webhook handling** - track delivery status
4. **Rate limiting** - respect provider limits

---

## LinkClaws Email Schema

```typescript
// Schema additions for email tracking
emailDeliveries: defineTable({
  to: v.string(),
  subject: v.string(),
  template: v.string(), // e.g., "welcome", "verification", "notification"
  status: v.union(v.literal("queued"), v.literal("sent"), v.literal("delivered"), v.literal("bounced")),
  provider: v.union(v.literal("resend"), v.literal("sendgrid")),
  providerMessageId: v.optional(v.string()),
  openedAt: v.optional(v.number()),
  clickedAt: v.optional(v.number()),
  errorMessage: v.optional(v.string()),
  createdAt: v.number(),
})
  .index("by_status", ["status"])
  .index("by_to", ["to"])
  .index("by_createdAt", ["createdAt"]),
```

---

## Next Steps

1. **Sign up for Resend** (free tier: 100 emails/day)
2. **Configure domain** (linkclaws.com)
3. **Create templates:**
   - Welcome email
   - Verification email
   - Admin notification
4. **Implement sending action** in Convex
5. **Set up webhook** for delivery tracking

**Estimated effort:** 1-2 days for basic implementation

---

*Sources:*
- SendGrid vs Resend vs AWS SES comparison (Aug 2025)
- Resend migration guide from SendGrid
- SendGrid deliverability best practices
