---
name: exa-search
description: Web search, code search, company research, LinkedIn search, and deep research via Exa AI. Use for web searches, finding code examples, researching companies, finding people on LinkedIn, or running comprehensive AI research reports.
---

# Exa Search

Access Exa AI's search capabilities via mcporter.

## Server URL
```
https://mcp.exa.ai/mcp?tools=web_search_exa,web_search_advanced_exa,get_code_context_exa,deep_search_exa,crawling_exa,company_research_exa,linkedin_search_exa,deep_researcher_start,deep_researcher_check
```

## Quick Reference

### Basic Web Search
```bash
mcporter call "https://mcp.exa.ai/mcp?tools=web_search_exa" web_search_exa query="your search query"
```

### Code Search (GitHub, StackOverflow)
```bash
mcporter call "https://mcp.exa.ai/mcp?tools=get_code_context_exa" get_code_context_exa query="Python OAuth2 implementation"
```

### Company Research
```bash
mcporter call "https://mcp.exa.ai/mcp?tools=company_research_exa" company_research_exa companyName="Stripe"
```

### LinkedIn People Search
```bash
mcporter call "https://mcp.exa.ai/mcp?tools=linkedin_search_exa" linkedin_search_exa query="AI engineer San Francisco"
```

### Deep Research (async)
```bash
# Start research
mcporter call "https://mcp.exa.ai/mcp?tools=deep_researcher_start" deep_researcher_start query="quantum computing startups"
# Returns a researchId

# Check status / get report
mcporter call "https://mcp.exa.ai/mcp?tools=deep_researcher_check" deep_researcher_check researchId="<id>"
```

### Crawl Specific URL
```bash
mcporter call "https://mcp.exa.ai/mcp?tools=crawling_exa" crawling_exa url="https://example.com/article"
```

## Available Tools

| Tool | Use Case |
|------|----------|
| `web_search_exa` | General web search with content extraction |
| `web_search_advanced_exa` | Advanced search with filters (domains, dates, categories) |
| `get_code_context_exa` | Find code snippets from GitHub/StackOverflow |
| `deep_search_exa` | Expanded search with query variations |
| `crawling_exa` | Extract content from a specific URL |
| `company_research_exa` | Research companies via their websites |
| `linkedin_search_exa` | Find people on LinkedIn |
| `deep_researcher_start` | Start an async AI research report |
| `deep_researcher_check` | Check research status and retrieve report |

## Key Parameters

### web_search_exa
- `query` (required): Search query
- `numResults`: Number of results (default: 8)
- `type`: `auto` | `fast` | `deep`
- `livecrawl`: `fallback` | `preferred`

### web_search_advanced_exa
- `query` (required): Search query  
- `category`: `company` | `research paper` | `news` | `pdf` | `github` | `tweet` | `personal site` | `people` | `financial report`
- `includeDomains` / `excludeDomains`: Domain filters
- `startPublishedDate` / `endPublishedDate`: Date range (ISO 8601)
- `includeText` / `excludeText`: Content filters
- `enableSummary`: Generate summaries
- `enableHighlights`: Extract key sentences
- `subpages`: Crawl subpages (1-10)

### get_code_context_exa
- `query` (required): Code/programming query
- `numResults`: Number of results

### company_research_exa
- `companyName` (required): Company to research

### linkedin_search_exa
- `query` (required): People search query
- `numResults`: Number of results

### deep_researcher_start
- `query` (required): Research topic
Returns `researchId` for status checks.

### deep_researcher_check
- `researchId` (required): ID from deep_researcher_start
Returns status and report when complete.

## Tips
- Use `web_search_exa` for quick searches
- Use `web_search_advanced_exa` when you need filters (dates, domains, categories)
- Deep research can take minutes — start it, then check periodically
- Add `--output json` for machine-readable output
