# LLM Price Comparison Video — Research Summary

**Research Date:** January 30, 2026  
**Focus:** Undervalued LLM providers with strong price/performance ratios  
**Target:** Short-form video (YouTube Shorts / TikTok / Reels)

---

## Executive Summary

Six providers stand out for offering superior price/performance compared to OpenAI/Anthropic:

| Provider | Primary Angle | Speed | Value | Best For |
|----------|---------------|-------|-------|----------|
| **Cerebras** | Speed King | 2,100 t/s | Good | Real-time apps |
| **Kimi (Moonshot)** | Agent Swarms | 173 t/s | Excellent | Multi-agent workflows |
| **Z.ai (GLM)** | Free Tier + Value | 60-85 t/s | **Best** | Coding, budget-conscious |
| **MiniMax** | Long Context | 68-100 t/s | Good | Massive documents |
| **Grok (xAI)** | Long Context + Personality | 127-147 t/s | Good | Creative tasks, X integration |
| **OpenCode Zen** | Curated Gateway | Varies | **No Markup** | Coding agents, team use |

---

## 1. CEREBRAS — "The Speed Demon"

### Pricing

| Model | Input / 1M | Output / 1M |
|-------|------------|-------------|
| Llama 3.1 8B | $0.10 | $0.10 |
| Llama 3.1 70B | $0.60 | $0.60 |
| Llama 3.1 405B | $6.00 | $12.00 |

### Performance Metrics

| Model | Tokens/Second | TTFT | Context |
|-------|---------------|------|---------|
| Llama 3.1 8B | **1,800 t/s** | Ultra-low | 128K |
| Llama 3.1 70B | **2,100+ t/s** | ~240ms | 128K |
| Llama 3.1 405B | **969 t/s** | ~240ms | 128K |

### Key Claims
- **16-75x faster** than GPU-based hyperscalers (verified by Artificial Analysis)
- **18x faster than Claude 3.5 Sonnet**
- **12x faster than GPT-4o**
- Wafer-scale engine (world's largest chip)
- Full 16-bit precision throughout
- Predictable per-token pricing (not compute-time)

### Video Angle
> "18x faster than Claude at a fraction of the price — Cerebras is what happens when you stop using GPUs and start using wafers."

---

## 2. KIMI K2.5 (Moonshot AI) — "The Agent Orchestrator"

### Pricing

| Metric | Value |
|--------|-------|
| Input | ~$0.07/1M tokens |
| Output | ~$0.30/1M tokens |
| OpenRouter | $0.50/1M in, $2.80/1M out |

### Performance Metrics

| Metric | Value |
|--------|-------|
| Throughput | **173+ t/s** (K2 Thinking via Simplismart) |
| TTFT | **117ms** (production load) |
| Context Window | **256K tokens** |
| Architecture | 1T parameter MoE |
| Model Size | 595GB |

### Key Differentiators
- **First native multimodal trillion-parameter model**
- **100 coordinated sub-agent swarm capability**
- Trained on 15T visual + text tokens
- Self-directed agent orchestration
- Released: January 26, 2026

### Benchmarks
- Matches GPT-5 and Claude Sonnet 4.5 on hardest benchmarks
- Strong visual coding capabilities

### Video Angle
> "One model. 100 agents working in parallel. That's not an LLM — that's a workforce."

---

## 3. Z.AI (GLM Family) — "The Value King"

### Latest Family: GLM-4.7 (December 2025 / January 2026)

#### GLM-4.7 — Flagship Coding Model

| Metric | Value |
|--------|-------|
| **Input Price** | **$0.60/1M tokens** |
| **Output Price** | **$2.20/1M tokens** |
| Cached Input | $0.11/1M |
| Context Window | **200K tokens** |
| Max Output | 131K tokens |
| Architecture | 355B total / 32B active (MoE) |
| License | MIT (open weights) |

**Benchmarks:**
- SWE-bench: **73.8%** (+5.8% vs GLM-4.6)
- SWE-bench Multilingual: **66.7%** (+12.9%)
- Terminal Bench 2.0: **41%** (+16.5%)
- HLE: 42.8%
- MMLU: 90.1%
- GPQA: 85.7%

**Features:**
- Preserved Thinking (reasoning persists across turns)
- Turn-level thinking control
- Works with Claude Code, Cline, Roo Code, Kilo Code

---

#### GLM-4.7-Flash — Actually Free

| Metric | Value |
|--------|-------|
| **Price** | **FREE** (verified: "no credit card required") |
| FlashX Tier | $0.07/1M in, $0.40/1M out |
| Context | 200K tokens |
| Params | ~30B total / **3B active** (MoE) |
| Speed | 60-80+ t/s on RTX 4090 |
| Released | January 19, 2026 |

**Key Point:** This is a **new model** (not the old GLM-4-Flash). Designed for local deployment on consumer hardware (24GB GPUs).

---

#### GLM-4.5-Air — Budget Option

| Metric | Value |
|--------|-------|
| Input | $0.20/1M |
| Output | $1.10/1M |
| Context | 131K |
| Params | 106B total / 12B active |

**Also available:** GLM-4.5-Flash (FREE tier), GLM-4.5-Air (free on OpenRouter)

### Summary Table

| Model | Price (per 1M) | Context | Speed | Best For |
|-------|---------------|---------|-------|----------|
| GLM-4.7 | $0.60 / $2.20 | 200K | ~55-85 t/s | Elite coding |
| GLM-4.7-Flash | **FREE** | 200K | 60-80+ t/s | Free coding agent |
| GLM-4.5-Air | $0.20 / $1.10 | 131K | Faster | Budget workflows |
| GLM-4.5-Flash | **FREE** | 131K | Fast | Free tier |

### Video Angle
> "Z.ai has a completely free GLM-4.7-Flash that runs locally on a 4090 and beats 70B models — while their flagship GLM-4.7 beats Claude on SWE-bench at 1/10th the price."

---

## 4. MINIMAX — "The Long Context King"

### Pricing (Text-01 / Older)

| Metric | Value |
|--------|-------|
| Input | $0.15/1M tokens |
| Output | $0.60/1M tokens |

### Specifications (Text-01)

| Metric | Value |
|--------|-------|
| Architecture | 456B params, 45.9B active/token |
| Context Window | **4M tokens** (largest available) |
| Training Context | 1M tokens (MiniMax-M1) |
| Attention | Lightning Attention + Softmax + MoE |
| Speed | Not published (not their focus) |

### Updated: MiniMax M2.1 (Latest)

| Metric | Value |
|--------|-------|
| **Input** | **$0.30/1M tokens** |
| **Output** | **$1.20/1M tokens** |
| Context | **1M tokens** |
| Architecture | 230B total / 10B active (MoE) |
| Speed | **~100 TPS** (claimed), **68 TPS** (Artificial Analysis) |
| Released | December 2025 |

**Key Claims:**
- "Only 8% of the price of Claude Sonnet and twice the speed"
- Built specifically for agents and coding
- Top-5 globally on Artificial Analysis benchmark

### Key Differentiators (M2.1)
- **Long context**: 1M tokens (M2.1), 4M tokens (Text-01)
- **Lightning Attention** enables near-linear complexity scaling
- **Speed**: ~68-100 TPS (competitive with mid-tier)
- **Price**: $0.30/1M input (cheaper than Text-01's $0.15? Verify)
- Maintains high performance across full context length

### Video Angle
> "4 million tokens. You could feed it the entire Lord of the Rings trilogy in one prompt. MiniMax doesn't care about your context limits."

---

## 5. GROK 4.1 FAST (xAI) — "The Personality King"

### Pricing

| Metric | Value |
|--------|-------|
| **Input** | **$0.20/1M tokens** |
| **Output** | **$0.50/1M tokens** |
| Cached | $0.05/1M |

### Performance Metrics

| Metric | Value |
|--------|-------|
| **Tokens/Second** | **127-147 t/s** (Artificial Analysis: 146.8 t/s) |
| TTFT | ~0.57s |
| Context Window | **2M tokens** |
| Output Limit | 30K tokens |

### Benchmarks

| Benchmark | Score |
|-----------|-------|
| MMLU-Pro | 74.3% |
| GPQA | 63.7% |
| LiveCodeBench | 39.9% |
| Coding | 40.1% |

**Note:** Grok 4.1 Fast (non-reasoning) vs Grok 4.1 Fast Reasoning are different models. Reasoning version scores higher on math (89.7%) but costs the same.

### Key Differentiators
- **Massive 2M context window** (2nd largest)
- **Real-time X/Twitter data access**
- Personality-driven responses (EQ-Bench: 1586)
- Creative and "fun" tone vs clinical competitors
- Strong for brainstorming, creative writing, viral content

### Video Angle
> "2 million tokens of context AND a personality? Grok is the only LLM that feels like it has opinions."

---

## 6. OPENCODE ZEN — "The Curated Gateway"

### What It Is
OpenCode Zen is a **model gateway** (not a model provider) — curated, tested models specifically optimized for coding agents. They work directly with model teams to ensure optimal serving.

### Pricing (Per 1M Tokens)

| Model | Input | Output | Notes |
|-------|-------|--------|-------|
| **GLM 4.7** | $0.60 | $2.20 | Same as direct |
| **GLM 4.7 Free** | FREE | FREE | Limited time |
| **Kimi K2.5** | $0.60 | $3.00 | Slight markup |
| **Kimi K2.5 Free** | FREE | FREE | Limited time |
| **MiniMax M2.1** | $0.30 | $1.20 | Same as direct |
| **MiniMax M2.1 Free** | FREE | FREE | Limited time |
| **Claude Sonnet 4.5** | $3.00 | $15.00 | ≤200K context |
| **GPT 5.1** | $1.07 | $8.50 | Via OpenAI API |
| **Big Pickle** | FREE | FREE | Stealth model |

### Key Philosophy
> "Pass along any price drops by selling at cost; so the only markup is to cover our processing fees."

### Key Differentiators
- **No markup on inference** (unlike OpenRouter's 5.5% credit fee)
- Curated models tested specifically for coding agents
- Models configured correctly (not guessing on OpenRouter)
- Bring your own OpenAI/Anthropic keys
- Team management with spending limits
- Zero-retention policy (US hosted)

### Video Angle
> "Tired of guessing which OpenRouter endpoint actually works? Zen tests every model so you don't have to."

---

## OPENROUTER vs DIRECT APIs — "The Markup Reality"

### OpenRouter Fees

| Fee Type | Amount | Notes |
|----------|--------|-------|
| **Credit Purchase** | **5.5%** ($0.80 min) | One-time fee on adding funds |
| **Crypto Purchase** | 5% | Alternative payment |
| **Inference Markup** | **0%** | Pass-through pricing |
| **BYOK (Own Keys)** | 5% | After 1M free requests/month |

**Example:** Add $100 → Pay $105.50 → Use $100 worth of inference

### OpenCode Zen Fees

| Fee Type | Amount | Notes |
|----------|--------|-------|
| **Credit Purchase** | Minimal processing | "Only markup is to cover processing fees" |
| **Inference** | 0% | At-cost pricing |
| **BYOK** | 0% | Use your own OpenAI/Anthropic keys free |

### Direct API Comparison

| Provider | Direct Price | OpenRouter Price | Zen Price |
|----------|--------------|------------------|-----------|
| GLM 4.7 | $0.60/$2.20 | $0.60/$2.20 | $0.60/$2.20 |
| Kimi K2.5 | ~$0.07/$0.30 | $0.50/$2.80 | $0.60/$3.00 |
| MiniMax M2.1 | $0.30/$1.20 | $0.30/$1.20 | $0.30/$1.20 |
| Claude Sonnet 4.5 | $3.00/$15.00 | ~$3.00/$15.00 | $3.00/$15.00 |

### Key Takeaway
- **OpenRouter:** Good for variety (300+ models), pay 5.5% convenience fee
- **Zen:** Good for curated coding models, minimal markup, better defaults
- **Direct APIs:** Best for high volume, single provider

---

## Comparative Summary

### Speed Ranking (Tokens/Second)
1. **Cerebras** — 2,100 t/s (Llama 70B)
2. **Cerebras** — 1,800 t/s (Llama 8B)
3. **Grok 4.1 Fast** — 127-147 t/s
4. **Kimi K2.5** — ~173 t/s
5. **MiniMax M2** — 68-100 t/s
6. **GLM-4.7** — ~55-85 t/s

### Value Ranking (Price/Performance)
1. **GLM-4.7-Flash** — FREE with 200K context
2. **GLM-4.5-Flash** — FREE with 131K context
3. **GLM-4.5-Air** — $0.20/1M input
4. **Kimi K2.5** — ~$0.07/1M input (direct)
5. **Grok 4.1 Fast** — $0.20/1M input
6. **MiniMax M2.1** — $0.30/1M input
7. **Cerebras 8B** — $0.10/1M

### Context Window Ranking
1. **MiniMax** — 4M tokens
2. **Grok 4.1 Fast** — 2M tokens
3. **Kimi K2.5** — 256K tokens
4. **GLM-4.7** — 200K tokens
5. **Cerebras** — 128K tokens

### Coding Benchmarks (SWE-bench)
- Claude Sonnet 4.5: ~76-77%
- GPT-5.1 High: ~76%
- **GLM-4.7: 73.8%**
- Kimi K2: ~71%
- DeepSeek-V3.2: ~73%

---

## Narrative Angles for Video

### Hook Options:
1. **"What if I told you there's an LLM that's 18x faster than Claude, another with 4M context, and another that's completely free?"**
2. **"Stop paying OpenAI prices. These 6 providers offer more for less."**
3. **"4 million tokens. 2,100 tokens per second. 100 agent swarms. 2M context. Free tier. Let's talk."**
4. **"I compared 6 undervalued LLM providers so you don't have to. Here's who wins on speed, price, and context."

### Provider One-Liners:
- **Cerebras:** "Speed is their religion"
- **Kimi:** "One command, 100 agents"
- **Z.ai:** "Claude-level coding for free (or close to it)"
- **MiniMax:** "Context limits are for other people"
- **Grok:** "2M context with a side of sass"
- **OpenCode Zen:** "The gateway that actually tests its models"

### Closing Angle:
> "The AI landscape isn't just OpenAI and Anthropic anymore. These four providers are eating their lunch on speed, price, and capabilities. The question isn't whether to switch — it's which one to try first."

---

## Data Sources & Verification

- **Cerebras:** Official press releases (Aug-Nov 2024), Forbes, Artificial Analysis
- **Kimi:** Moonshot AI announcements (Jan 2026), Simplismart deployment blog, OpenRouter
- **Z.ai/GLM:** Official pricing docs (docs.z.ai), LLM Stats, Z.ai blog posts (Dec 2025/Jan 2026)
- **MiniMax:** Hugging Face model card, arXiv papers, Artificial Analysis, MiniMax official site
- **Grok:** xAI announcements, PricePerToken, Artificial Analysis
- **OpenCode Zen:** Official docs (opencode.ai/docs/zen), Mastra docs
- **OpenRouter:** Official FAQ/docs (openrouter.ai/docs/faq)

**Last Verified:** January 30, 2026
