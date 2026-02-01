---
name: techfren-scripts
description: Write video scripts in techfren's Fireship-style voice. Use for YouTube shorts, tech demos, tool reviews, and coding content. Triggers on script writing, video planning, hook writing, or content creation for techfren. Integrates gifgrep for meme/GIF suggestions.
---

# techfren Script Writer

Write video scripts in AJ's signature "discovery energy" voice — authentic reactions, live demos, and Fireship-style pacing.

## Voice DNA

- **Builder, not reviewer** — Use tools live, react authentically, show real results
- **Genuine reactions** — "Dude," "sick," "whoa," "that's actually perfect"
- **Inclusive exploration** — "Let's see," "let's try this together"
- **Accessible enthusiasm** — Complex topics made approachable

## The Rules

### First 10 Words Rule
🚫 **NEVER** start with: "so," "hey," "what's up," "alright so," "hey friends"

✅ **DO** start with: Bold claim, trending metric, unique discovery, or direct action

### Hook Performance (by success rate)
1. **Bold Claim** (80%) — "X has been trending — 20K stars..."
2. **Excitement Reaction** (57%) — Natural discovery energy
3. **Direct Demo** (54%) — Skip preamble, show immediately
4. **Tool Introduction** (50%) — Better when paired with claim
5. **Question Hook** (29%) — ❌ AVOID — Don't ask, claim

### Language Patterns
**USE:** "just," "free," "open source," "local," "let's see," "actually," "boom," "dude," "pretty cool"

**AVOID:** "like" (filler), "I think," "kind of," "maybe," "subscribe"

### Pacing (Fireship-style)
- 200-250 words per minute
- 10-15 visual cuts per minute
- Meme/GIF every 20-30 seconds
- Zero dead air
- Short punchy sentences (avg 10-15 words max)

## Script Notes Format

Write **sentence starters** (3-6 words), not full scripts. End with "..." so the thought continues naturally on camera.

```
**HOOK**
• [Bold claim or result]...
• [Specific metric or discovery]...

**VALUE STACK**
• It's [free/open source/local]...
• No [pain point] required...

**DEMO**
• Let's try it out...
• [First action]...

**REACTION**
• [Authentic reaction placeholder]...

**CTA**
• [Action verb: download/try/check out]...
```

## Templates

### Template 1: Bold Claim (80% success)
```
**HOOK:** [Tool] has been trending — [metric]. [What it does]...
**VALUE:** It's [free/open source/local]. No [pain point] required.
**DEMO:** Let's try it out. [ACTION]. Let's see if this works...
**REACT:** [Dude/Whoa], that's actually [perfect/sick].
**CTA:** Go download it / Check it out.
```

### Template 2: Unique Discovery
```
**HOOK:** Now this is something I haven't seen [anywhere/in any other tool]...
**WHAT:** [TOOL] can [UNIQUE CAPABILITY].
**DEMO:** Let me show you. [DEMONSTRATE].
**CTA:** Try it yourself.
```

### Template 3: Build Demo
```
**HOOK:** I just [built/created] [RESULT] with [TOOL].
**VALUE:** No [downloads/coding] required. Let me show you how.
**DEMO:** This was my prompt: [SHOW]. And here's what it gave me...
**TIP:** My tip is to [ACTIONABLE ADVICE].
**CTA:** Try it yourself.
```

## GIF Integration

Use `gifgrep` to find reaction memes for Fireship-style pacing (every 20-30 sec):

```bash
# Search and get URLs
gifgrep "mind blown" --max 5 --format url

# Download directly
gifgrep "this is fine" --download --max 1

# Common reactions for tech content:
gifgrep "mind blown"        # impressive features
gifgrep "this is fine"      # bugs/disasters  
gifgrep "confused math"     # complex concepts
gifgrep "celebration"       # successful demos
gifgrep "surprised pikachu" # obvious outcomes
gifgrep "typing fast"       # coding montages
```

## CTA Performance

| CTA Type | Avg Views | Use? |
|----------|-----------|------|
| Download/Install | 42,209 | ✅ YES |
| Try it / Give it a go | 35,350 | ✅ YES |
| Check it out | 27,145 | ✅ Good |
| Let me know | 19,316 | Okay |
| Subscribe/Follow | 5,419 | ❌ NO |

## Full Reference

For complete guide with all templates, humor framework, and detailed analysis:
→ [references/production-guide.md](references/production-guide.md)
