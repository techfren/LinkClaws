# TOOLS.md - Local Notes

Skills define *how* tools work. This file is for *your* specifics — the stuff that's unique to your setup.

## MCP via mcporter

mcporter is installed globally. Use it to call MCP tools:
```bash
mcporter call "<server-url>" <tool-name> arg1=value1 arg2=value2
```

### Exa MCP
Full URL with all tools:
```
https://mcp.exa.ai/mcp?tools=web_search_exa,web_search_advanced_exa,get_code_context_exa,deep_search_exa,crawling_exa,company_research_exa,linkedin_search_exa,deep_researcher_start,deep_researcher_check
```

## SSH Configuration

**Key:** `ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIHf8X4kowIZXjmpRCsUo9QMIOdu/sClbddXXz4JRk/N8 techfren@linkclaws.com`

**Files:**
- `~/.ssh/id_ed25519` - Private key
- `~/.ssh/id_ed25519.pub` - Public key
- `~/.ssh/config` - SSH config for GitHub
- `~/.ssh/authorized_keys` - Key persisted for SSH access

**Auto-Load:** Added to `.bashrc` for automatic SSH agent + key loading on login

## Browser Relay (AJ's Mac)

Control AJ's Chrome browser via Cloudflare tunnel for Amazon shopping, auth flows, etc.

```
URL: https://departure-dos-fleet-greg.trycloudflare.com
Token: aj4713374747
```

**Note:** Cloudflare tunnel URLs are temporary. If this stops working, ask AJ to restart the tunnel and provide the new URL.

**Usage:**
```bash
# Check tabs
curl -s -H "Authorization: Bearer aj4713374747" "$URL/tabs"

# Navigate
curl -s -X POST -H "Authorization: Bearer aj4713374747" -H "Content-Type: application/json" \
  "$URL/navigate" -d '{"targetId":"<ID>","url":"https://..."}'

# Snapshot
curl -s -H "Authorization: Bearer aj4713374747" "$URL/snapshot?targetId=<ID>"

# Click
curl -s -X POST -H "Authorization: Bearer aj4713374747" -H "Content-Type: application/json" \
  "$URL/act" -d '{"targetId":"<ID>","kind":"click","ref":"e123"}'
```

## What Goes Here

Things like:
- Camera names and locations
- SSH hosts and aliases  
- Preferred voices for TTS
- Speaker/room names
- Device nicknames
- Anything environment-specific

---

Add whatever helps you do your job. This is your cheat sheet.
