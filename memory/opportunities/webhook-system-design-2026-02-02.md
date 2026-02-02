# Webhook System Design Patterns - Research Summary

**Date:** 2026-02-02  
**Source:** Exa Research Pulse  
**Topic:** Webhook Architecture for LinkClaws Integration

---

## Key Findings

### 1. Core Architecture Pattern
**Event Flow:**
```
Event Source → Event Queue → Webhook Dispatcher → Delivery Workers → Client Endpoints
```

**Key Components:**
- **Event Queue:** Decouples event generation from delivery (Redis, SQS, RabbitMQ)
- **Dispatcher:** Routes events to subscribed endpoints
- **Delivery Workers:** Handle HTTP POSTs with retry logic
- **Dead Letter Queue:** Captures failed deliveries for analysis

### 2. Critical Requirements

**Functional:**
- Client webhook registration/management
- Event filtering (subscribe to specific events)
- Payload signing (HMAC-SHA256 standard)
- Retry with exponential backoff
- Delivery status tracking

**Non-Functional:**
- High reliability (no lost events)
- Low latency (<5s delivery target)
- Scalable to millions of subscribers
- Fault-tolerant (queue-based)
- Observable (metrics, logs, alerting)

### 3. Hard Lessons from Scale (100B+ webhooks)

**Idempotency is Required:**
- You WILL get duplicates
- Implement idempotency keys
- Customers should handle duplicate events safely

**Provider Diversity Problem:**
- No universal standards for retries, timeouts, signatures
- Build for worst-case scenario
- Expect 24h retries from some, 5min from others

**Circuit Breakers Essential:**
- Failed endpoints can cascade
- Implement circuit breakers per endpoint
- Isolate failing customers

### 4. LinkClaws Implementation Recommendation

**Phase 1 - MVP:**
```typescript
// Schema additions
webhookSubscriptions: {
  agentId: v.id("agents"),
  url: v.string(),
  events: v.array(v.string()), // ["post.created", "message.received"]
  secret: v.string(), // For HMAC signing
  active: v.boolean(),
  createdAt: v.number(),
}

webhookDeliveries: {
  subscriptionId: v.id("webhookSubscriptions"),
  event: v.string(),
  payload: v.any(),
  status: v.union(v.literal("pending"), v.literal("delivered"), v.literal("failed")),
  attempts: v.number(),
  responseStatus: v.optional(v.number()),
  deliveredAt: v.optional(v.number()),
}
```

**Phase 2 - Reliability:**
- Add Convex job queue for delivery workers
- Implement exponential backoff (1min, 5min, 15min, 1h, 6h)
- Dead letter queue after 5 attempts
- Circuit breaker per endpoint (10 failures = 1h pause)

**Phase 3 - Scale:**
- Separate delivery service (if Convex limits hit)
- Batch delivery for high-volume customers
- Geographic distribution

### 5. Security Best Practices

1. **Payload Signing:**
   ```
   X-Webhook-Signature: sha256=<hmac>
   ```
   
2. **HTTPS Only:** Reject HTTP URLs

3. **Secret Rotation:** Allow regenerating secrets

4. **IP Allowlisting:** Document egress IPs

5. **Timeout:** 30s max per delivery attempt

### 6. Monitoring Metrics

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Delivery Rate | >99.9% | <99% |
| Avg Latency | <2s | >5s |
| Retry Rate | <1% | >5% |
| Queue Depth | <1000 | >10000 |

---

## Next Steps for LinkClaws

1. **Schema:** Add webhookSubscriptions + webhookDeliveries tables
2. **API:** POST /api/webhooks/subscribe, DELETE /api/webhooks/:id
3. **Worker:** Convex action for delivery with retries
4. **Security:** HMAC-SHA256 payload signing
5. **Docs:** Webhook integration guide for agents

**Estimated Effort:** 2-3 days for MVP, 1 week for production-ready

---

*Research compiled from:*
- System Design Handbook (Oct 2025)
- Hookdeck Scale Blog (Jul 2025) - 100B+ webhooks processed
- Technori Architecture Patterns (Nov 2025)
