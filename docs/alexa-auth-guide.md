# Alexa API Authentication Guide

*Last updated: 2026-01-24*

## The Goal
Access Alexa Shopping Lists (or other Alexa data) programmatically — e.g., to sync with Amazon Cart or other services.

## The Challenge
Amazon doesn't offer a simple API key. You need OAuth tokens obtained through browser-based login.

---

## Approaches

### 1. `alexa-remote2` (Node.js) — ❌ Not Recommended

**How it works:**
- Spins up a local proxy server
- Launches browser pointing to proxy
- User logs into Amazon through proxy
- Proxy intercepts cookies/tokens

**Why it fails:**
- Amazon's signin pages don't render correctly through the proxy
- Amazon frequently updates their auth flow, breaking proxy-based solutions
- URL rewriting causes page elements to break

**If you still want to try:**
```bash
npm install alexa-remote2
```
```javascript
const Alexa = require('alexa-remote2');
const alexa = new Alexa();

alexa.init({
  cookie: '',
  proxyOnly: true,
  proxyOwnIp: 'localhost',
  proxyPort: 3456,
  proxyLogLevel: 'info'
}, (err) => {
  if (err) console.error(err);
});
```

---

### 2. `alexacli` (Go CLI) — ✅ Recommended

**How it works:**
- Opens your real browser directly (no proxy)
- You log into Amazon normally
- CLI captures the auth tokens

**Installation:**
```bash
# macOS
brew install buddyh/tap/alexacli

# Or with Go
go install github.com/buddyh/alexa-cli/cmd/alexacli@latest
```

**Usage:**
```bash
# Authenticate (opens browser)
alexacli auth

# List shopping lists
alexacli lists

# Get items from a list
alexacli list "Shopping List"
```

**Why it works:**
- Uses Amazon's real pages, no URL rewriting
- Less likely to break when Amazon updates their flow

---

### 3. Login with Amazon (LWA) OAuth — ✅ Best for Production

**For apps that need long-lived, renewable access.**

**Setup:**
1. Go to [developer.amazon.com](https://developer.amazon.com)
2. Create a Security Profile
3. Get Client ID + Client Secret
4. Configure allowed redirect URIs

**OAuth Flow:**
```
1. Redirect user to:
   https://www.amazon.com/ap/oa?client_id=YOUR_CLIENT_ID
   &scope=alexa::household:lists:read+alexa::household:lists:write
   &response_type=code
   &redirect_uri=YOUR_REDIRECT_URI

2. User logs in, grants permission

3. Amazon redirects to your URI with ?code=AUTH_CODE

4. Exchange code for tokens:
   POST https://api.amazon.com/auth/o2/token
   grant_type=authorization_code
   &code=AUTH_CODE
   &client_id=YOUR_CLIENT_ID
   &client_secret=YOUR_CLIENT_SECRET
   &redirect_uri=YOUR_REDIRECT_URI

5. Response includes access_token + refresh_token
```

**Alexa Lists API:**
```bash
# Get all lists
curl -H "Authorization: Bearer ACCESS_TOKEN" \
  https://api.amazonalexa.com/v2/householdlists/

# Get list items
curl -H "Authorization: Bearer ACCESS_TOKEN" \
  https://api.amazonalexa.com/v2/householdlists/LIST_ID/items
```

---

## Token Lifespan & Storage

| Auth Method | Token Lifespan | Storage Location |
|-------------|----------------|------------------|
| alexa-remote2 (cookies) | Hours to days | Local JSON file |
| alexacli | Days to weeks | `~/.alexa/` or similar |
| LWA OAuth (refresh token) | Months+ (renewable) | Your secure storage |

**Note:** Access tokens expire in ~1 hour. Use refresh tokens to get new access tokens without re-auth.

---

## Common Gotchas

1. **Amazon locale matters** — Auth is region-specific. Use the right Amazon domain (.com, .co.uk, .de, etc.)

2. **2FA/MFA** — If enabled on your Amazon account, you'll need to complete it during browser auth

3. **Rate limits** — Amazon will throttle you if you hit the API too hard

4. **Token refresh** — Always handle token expiration gracefully; implement auto-refresh

5. **Cookies expire** — Cookie-based auth (alexa-remote2) needs periodic re-auth

---

## Project Files

Test scripts created during exploration:
- `~/clawd/projects/alexa-remote-test/auth.js` — alexa-remote2 basic auth
- `~/clawd/projects/alexa-remote-test/proxy-auth.js` — proxy variant

---

## TL;DR

| Use Case | Recommended Approach |
|----------|---------------------|
| Quick local scripts | `alexacli` |
| Production app | LWA OAuth |
| Avoid | Proxy-based auth (fragile) |
