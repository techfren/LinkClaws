---
name: alexa
description: Interact with Amazon Alexa via alexacli. Use for shopping lists, to-do lists, smart home control, notifications, and Alexa device queries. Triggers on mentions of Alexa, Echo devices, shopping lists, or smart home control through Alexa. Also supports adding items to Amazon cart via browser relay.
---

# Alexa Skill

## Shopping Lists (VPS-Only Method) ⭐ RECOMMENDED

**No tunnel, no browser relay, no physical Alexa device needed!**

Full docs: `/home/ubuntu/clawd/docs/alexa-shopping-list-api.md`

### Setup

1. Get refresh token from `alexa-cookie-cli` (one-time on user's machine)
2. Store in `/home/ubuntu/clawd/projects/alexa-remote-test/.alexa-tokens.json`

### How It Works

Exchange refresh token for cookies, then call V2 API:

```javascript
// Get cookies from refresh token
POST api.amazon.com/auth/token
Body: source_token=<refreshToken>&source_token_type=refresh_token&requested_token_type=auth_cookies&domain=.amazon.com

// Then use cookies to call V2 API
POST www.amazon.com/alexashoppinglists/api/v2/lists/fetch
```

### API Endpoints

| Action | Method | Endpoint |
|--------|--------|----------|
| Get lists | POST | `/alexashoppinglists/api/v2/lists/fetch` |
| Get items | POST | `/alexashoppinglists/api/v2/lists/{listId}/items/fetch?limit=100` |
| Add item | POST | `/alexashoppinglists/api/v2/lists/{listId}/items` |
| Update item | PUT | `/alexashoppinglists/api/v2/lists/{listId}/items/{itemId}?version={v}` |
| Delete item | DELETE | `/alexashoppinglists/api/v2/lists/{listId}/items/{itemId}?version={v}` |

### Working Script

Use `/home/ubuntu/clawd/projects/alexa-remote-test/v2-api.js`:

```bash
cd /home/ubuntu/clawd/projects/alexa-remote-test && node v2-api.js
```

### AJ's Token Location

`/home/ubuntu/clawd/projects/alexa-remote-test/.alexa-tokens.json`

---

## alexacli (Requires Physical Device)

Only use if user has Echo device. For shopping lists without a device, use V2 API above.

### Prerequisites

```bash
which alexacli
# Install: brew install buddyh/tap/alexacli
```

### Authentication

```bash
alexacli auth  # Opens browser
```

### Common Commands

```bash
alexacli lists                           # List all lists
alexacli list "Shopping List"            # Get items
alexacli add "Shopping List" "milk"      # Add item
alexacli devices                         # List Alexa devices
alexacli speak "Kitchen Echo" "Hello"    # TTS
```

---

# Amazon Cart (Browser Relay)

For adding items to Amazon cart. Requires user's Mac running browser relay with Cloudflare tunnel.

### Current Config (from TOOLS.md)

```
URL: https://departure-dos-fleet-greg.trycloudflare.com
Token: aj4713374747
```

**Note:** Cloudflare tunnel URLs expire. Ask user to restart if not working.

### Quick Add Flow

1. **Get tabs:**
```bash
curl -s -H "Authorization: Bearer $TOKEN" "$URL/tabs"
```

2. **Navigate to Buy Again:**
```bash
curl -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  "$URL/navigate" -d '{"targetId":"<ID>","url":"https://www.amazon.com/gp/buyagain"}'
```

3. **Snapshot:**
```bash
curl -s -H "Authorization: Bearer $TOKEN" "$URL/snapshot?targetId=<ID>"
```

4. **Click Add to Cart:**
```bash
curl -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  "$URL/act" -d '{"targetId":"<ID>","kind":"click","ref":"<BUTTON_REF>"}'
```

### Add to Cart via ASIN (No Browser)

If you have the ASIN, use the official Add to Cart form with cookies:

```
https://www.amazon.com/gp/aws/cart/add.html?ASIN.1=B0XXXXX&Quantity.1=1
```

This requires cookies (same as V2 API method).

---

## Token Lifecycle

| Token | TTL | Source |
|-------|-----|--------|
| Refresh Token | ~30 days | alexa-cookie-cli |
| Auth Cookies | ~30 days | Exchanged from refresh token |
| Browser Relay | Session | User's Chrome session |

---

## Error Handling

| Error | Solution |
|-------|----------|
| V2 API returns 503 | Cookies expired, re-exchange from refresh token |
| V2 API returns 401 | Refresh token expired, need new auth |
| Browser relay timeout | Tunnel expired, ask user to restart cloudflared |
| alexacli "not authenticated" | Run `alexacli auth` |
