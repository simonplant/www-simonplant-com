---
name: content-pitch
description: "Creates and refines technical article pitch blocks from raw input — conversations, build logs, decisions, observations, rants. Produces a structured pitch with insight, why-it-matters, concepts, and structure type that serves as a brief for downstream writing. Uses an internal critic loop (six critics including grounding and self-promotion checks) and thinking toolkit techniques to sharpen pitches from first-draft to publishable brief. Also supports Audit Mode for evaluating existing articles against the same quality bar, and Series Mode for analyzing multi-article sequences for repetition, argument arc, and product creep. Use this skill whenever the user wants to brainstorm article ideas, pitch a blog post, develop a content concept, workshop a technical writing idea, audit or critique existing content, evaluate a content series, or says anything like 'this could be a post', 'I should write about this', 'article idea', 'blog idea', 'content idea', 'pitch this', 'what should I write about', 'review this article', 'audit this content', or 'evaluate this series'. Also trigger when the user dumps raw notes, build logs, or decision records and wants to extract publishable ideas from them."
---

# Content Pitch Creator

Turn raw material into sharp, publishable article pitches. This skill is an editorial filter between the writer's brain and the writing process. It enforces quality through a critic loop and structured analysis before any drafting begins.

## Core Principle

No pitch, no draft. If the pitch doesn't hold up under scrutiny, no amount of prose polish saves the article. This skill exists to kill weak ideas early and sharpen strong ones into briefs worth writing.

## What This Skill Produces

A **Pitch Block** — the atomic unit of a publishable article brief:

```
PITCH BLOCK
===========
TITLE (working):  [concise, specific, no clickbait]
INSIGHT:          [1-2 sentences. The specific thing you learned, decided, 
                   discovered, or realized. Must be concrete, not abstract.]
WHY IT MATTERS:   [1-2 sentences. Who cares? What changes for them? 
                   Why now, not six months ago?]
CONCEPTS:         [2-4 main ideas that deliver the insight. Each one 
                   sentence. These become the article's structural spine.]
STRUCTURE TYPE:   [One of: Worked Example | Decision Record | Pattern 
                   Definition | Contrarian Reframe | Journey Narrative | 
                   Landscape + Position]
CONVERSATION:     [What does this add to the existing discourse? Why is 
                   this not "me too" or "hell yeah"? What new ground 
                   does it break or what existing ground does it 
                   challenge?]
READER TAKEAWAY:  [One sentence. What can the reader do, think, or 
                   decide differently after reading this?]
```

## Structure Types Reference

Choose the container that best serves the insight — never the other way around:

**Worked Example** — You hit a real problem, walked through the decision tree, found dead ends, arrived at a solution. Best for: build logs, implementation stories, debugging narratives. Structure: problem → constraints → approaches tried (and why they failed) → the pattern that worked → generalized principle.

**Decision Record** — You made a real architectural or strategic decision with real tradeoffs. Best for: technology choices, design decisions, trade-off analyses. Structure: context → decision drivers → options evaluated with honest tradeoffs → decision → consequences (known and discovered).

**Pattern Definition** — You observed a recurring pattern worth naming. Best for: abstractions drawn from repeated experience, operational wisdom. Structure: name the pattern → crisp definition → 2-3 concrete examples → when it applies → when it breaks → why it matters.

**Contrarian Reframe** — Conventional wisdom is wrong or incomplete, and you have evidence. Best for: challenging industry assumptions, correcting popular misconceptions. Structure: "everyone says X" → why X is wrong/incomplete → the better mental model Y → how Y plays out in practice.

**Journey Narrative** — The path itself is the insight — the twists, reversals, and discoveries along the way. Best for: multi-decision arcs, evolving understanding, "how I ended up here" stories. Structure: starting assumptions → what happened → where you landed → what surprised you → what you'd tell someone starting the same journey.

**Landscape + Position** — Map a space, then plant your flag. Best for: emerging categories, competitive analysis, ecosystem overviews. Structure: here's the space → what everyone assumes → the gap nobody's addressing → why it matters → how to think about it differently.

## Input Handling

The skill accepts messy, unstructured input from any of these sources:

- **Conversation excerpts** — copy-paste from Claude chats, Slack, or discussions
- **Build logs** — notes from development sessions, commit messages, PR descriptions
- **Decision records** — notes on choices made and why
- **Observations** — things noticed in the ecosystem, industry, or community
- **Rants** — frustrated takes on how things are done wrong (often the best raw material)
- **Questions** — "I keep wondering why..." or "nobody talks about..."
- **Multiple inputs** — dump several related pieces and let the skill find the thread

When receiving raw input, extract candidate insights before proposing a pitch. Look for:
- Decisions with non-obvious tradeoffs
- Surprises — things that didn't work as expected
- Patterns across multiple experiences
- Gaps in existing discourse
- Contradictions with conventional wisdom

## The Three-Pass Process

Every pitch goes through three passes. Do not skip passes. Do not collapse them.

### Pass 1: College Try

Generate an initial pitch block from the raw input. This is deliberately a first draft — get something on paper. Fill in every field of the pitch block. Be direct, be specific, avoid hedging.

If the raw input contains multiple potential articles, generate up to 3 candidate pitch blocks ranked by: (1) strength of insight, (2) how much new ground it breaks, (3) how much the writer's direct experience adds credibility.

### Pass 2: Critic Loop

Attack the pitch block using these critic lenses. Be harsh — the goal is to kill weak pitches and expose soft spots in strong ones.

**Insight Critic:**
- Is the insight *specific* or is it a dressed-up generality? "AI agents need good infrastructure" is a generality. "Running a privacy-first agent on OpenClaw requires rejecting 60% of available models and building your own tool trust chain" is specific.
- Could someone who *hasn't* done the work write this? If yes, the insight is too shallow.
- Is there a concrete decision, discovery, or surprise at the core? If not, there's no insight yet.

**So-What Critic:**
- Would the target reader (technical practitioners building or evaluating AI infrastructure) change any decision or mental model after reading this?
- Is the "why it matters" tied to a real consequence, or is it hand-wavy ("this is important for the community")?
- Does this have a shelf life? Will it matter in 6 months or is it pure news cycle?

**Novelty Critic:**
- Search for existing content on this topic. What's already been written?
- Classify the novelty tier:
  - **GENUINELY NEW** — an insight, framework, or finding that doesn't exist in the discourse yet
  - **NOVEL SYNTHESIS** — combines known ideas in a way that produces a new conclusion
  - **KNOWN-PATTERN TRANSPLANT** — takes established wisdom from another domain and applies it here (e.g., "IaC but for agents," "Docker hardening but for AI sandboxes"). This is INCREMENTAL — the skill should push harder on what's actually new beyond the transplant itself. What did you discover that someone just reading the source domain wouldn't predict?
- Does this move the conversation forward, or is it agreeing loudly with what's already been said?

**Grounding Critic:**
- Are the specific claims verifiable? Could a reader check the cited CVEs, products, stats, research papers, or tools mentioned?
- Is this reporting or fiction dressed as reporting? If the article references specific vulnerabilities, statistics, Shodan results, market numbers, or named tools/products — are they real?
- Are examples drawn from actual experience, or are they hypothetical scenarios presented as if they happened?
- Rule: if a claim can't be independently verified and isn't clearly marked as the author's estimate/opinion, it must be flagged. Fabricated specifics (fake CVE numbers, invented stats, fictional products presented as real) are an automatic KILL regardless of how good the insight is.

**Self-Promotion Critic:**
- Does the article's analysis lead inevitably to the author's own product as the solution? Would the conclusions change if the author didn't have a product to sell?
- Is this analysis or a pitch deck? The test: could you remove all references to the author's product and still have a complete, valuable article? If not, the pitch is product marketing wearing editorial clothing.
- One mention of the author's product as a worked example is fine. The product as the answer to every problem described is not.
- If flagged: recommend how to reframe so the insight stands independent of the product.

**Structure Critic:**
- Is the chosen structure type the best fit, or was it picked by default?
- Do the concepts actually deliver the insight, or do they wander?
- Could the concepts be reordered or consolidated? Are any of them filler?

After running all six critics, produce a **Critic Report**:
```
CRITIC REPORT
=============
INSIGHT:        [SHARP / SOFT / MISSING] — [1 sentence why]
SO-WHAT:        [STRONG / WEAK / ABSENT] — [1 sentence why]  
NOVELTY:        [NEW GROUND / NOVEL SYNTHESIS / KNOWN-PATTERN TRANSPLANT / ALREADY SAID] — [1 sentence why]
GROUNDING:      [VERIFIED / UNVERIFIED / FABRICATED] — [1 sentence why]
SELF-PROMOTION: [CLEAN / LEANS / PITCH DECK] — [1 sentence why]
STRUCTURE:      [FITS / FORCED / WRONG TYPE] — [1 sentence why]
VERDICT:        [ADVANCE / REVISE / KILL]
REVISION NOTES: [If REVISE: specific instructions for what to fix]
```

**Auto-KILL triggers** (any one of these is an automatic KILL regardless of other scores):
- GROUNDING: FABRICATED
- SELF-PROMOTION: PITCH DECK
- INSIGHT: MISSING

If KILL: Tell the writer directly. Explain why. Suggest whether there's a different, better article hiding in the same raw material.

If REVISE: Apply revisions and produce an updated pitch block. Then run the critic loop ONE more time on the revised pitch. Two rounds max — if it can't survive two rounds of critique, it needs more raw material or more lived experience before it's ready.

If ADVANCE: Move to Pass 3.

### Pass 3: Thinking Toolkit Sharpening

Apply targeted thinking toolkit techniques to harden the pitch into a final brief. Don't apply all techniques — pick the 1-2 that fit:

**Use Assumptions (Toolkit #5) when:** The pitch makes claims about what the audience needs, what the market lacks, or why something matters. Surface the hidden assumptions. If a hidden assumption has high blast radius (the whole article falls apart if it's wrong), flag it and either address it in the concepts or note it as a risk the article should acknowledge.

**Use Stress Test (Toolkit #1) when:** The pitch takes a strong position (especially Contrarian Reframe or Landscape + Position). Attack the load-bearing claims. If any come back FATAL, the pitch needs fundamental revision. If WOUNDED, the article should address the weakness directly — not hide from it.

**Use Distill (Toolkit #4) when:** The pitch is sprawling or the insight isn't crisp enough. Compress to Level 4 (one-liner) and Level 3 (elevator pitch). If the one-liner is vague or could describe many articles, the insight isn't sharp enough yet.

**Use Evolve (Toolkit #2) when:** The pitch is solid but feels obvious or predictable. Mutate the framing — INVERT the core assumption, TRANSPLANT the insight to a different audience, SUBTRACT the most complex concept. Sometimes the better article is a mutation of the first idea.

After applying the toolkit, produce the **Final Pitch Block** with any modifications, plus:

```
SHARPENING NOTES
================
TOOLKIT APPLIED:  [Which technique(s) and why]
KEY FINDING:      [What the toolkit revealed]
ARTICLE RISKS:    [What could go wrong — weak spots the writer 
                   should be aware of while drafting]
ESTIMATED DEPTH:  [Short (500-800w) | Medium (1000-1500w) | 
                   Deep (2000-3000w) | Series (multiple posts)]
```

## Output Format

The final deliverable is the complete pitch block plus the critic report and sharpening notes. This is the brief that gets handed to the writing agent.

Present it cleanly:

```
═══════════════════════════════════════
FINAL PITCH BLOCK
═══════════════════════════════════════

TITLE (working):  ...
INSIGHT:          ...
WHY IT MATTERS:   ...
CONCEPTS:         ...
STRUCTURE TYPE:   ...
CONVERSATION:     ...
READER TAKEAWAY:  ...

───────────────────────────────────────
CRITIC REPORT (final)
───────────────────────────────────────
INSIGHT:        ...
SO-WHAT:        ...
NOVELTY:        ...
GROUNDING:      ...
SELF-PROMOTION: ...
STRUCTURE:      ...
VERDICT:        ADVANCE

───────────────────────────────────────
SHARPENING NOTES  
───────────────────────────────────────
TOOLKIT APPLIED:  ...
KEY FINDING:      ...
ARTICLE RISKS:    ...
ESTIMATED DEPTH:  ...

═══════════════════════════════════════
```

## Quality Calibration

**GOOD pitch — would ADVANCE:**
"INSIGHT: Running a zero-trust agent on OpenClaw means rejecting the default security posture entirely — auth is disabled by default, credentials are plaintext, and community skills are unaudited black boxes. The 'easy path' is the dangerous path. WHY IT MATTERS: Every OpenClaw tutorial teaches the insecure defaults. Teams shipping agents to production are inheriting CVEs they don't know about. CONVERSATION: Existing OpenClaw content focuses on getting started fast. Nobody is writing about what the production security posture actually requires."

**BAD pitch — would KILL:**
"INSIGHT: Security is important for AI agents. WHY IT MATTERS: As AI agents become more prevalent, security becomes critical. CONVERSATION: Adding to the growing conversation about AI safety." — Every sentence could be written by someone who never touched OpenClaw. No specific discovery, no concrete tradeoff, no earned insight.

**BAD pitch — would REVISE:**
"INSIGHT: I chose Gemma 4 over other models for my local inference. WHY IT MATTERS: Model selection is hard. CONVERSATION: Sharing my experience." — There's a real decision buried here (the principled rejection of Chinese-origin models, the VRAM constraints, the OpenRouter fallback architecture) but the pitch hasn't excavated it yet. The specifics are missing. Revise to surface the actual tradeoffs and the generalizable pattern.

## Batch Mode

When the writer wants to mine a body of work for article ideas (e.g., "look at everything I've been building and tell me what's worth writing about"), generate up to 5 candidate pitch blocks at Pass 1 level, then run a comparative critic pass:

- Rank by insight strength and novelty
- Flag overlaps (two pitches that are really the same article)
- Identify sequencing (does pitch B only make sense after pitch A is published?)
- Recommend which 1-2 to develop first

## Series Mode

When evaluating pitches that are part of a planned series (or when the writer asks to evaluate an existing series), apply these additional checks on top of the individual pitch process:

**Cross-Article Repetition:** Are the same stats, examples, or framing devices appearing across multiple articles? A fact bank that shows up 3+ times reads as a content agent recycling, not an author developing an argument. Each article should introduce its own evidence.

**Framing Device Fatigue:** Is a recurring analogy, parallel, or metaphor (e.g., "cloud infrastructure faced the same problem") still earning its keep in later installments? A framing device established in article #1 should be referenced lightly in #2-3, then retired. If it's being re-established from scratch in every article, it's a crutch.

**Argument Development:** Are later articles building on earlier ones, or restating the same thesis with different examples? A series should have arc — each installment should move the argument forward, not sideways. Map the series as: Article N adds [what] to the argument that Articles 1 through N-1 didn't cover.

**Product Creep:** Track mentions of the author's product across the series. If the product-as-solution ratio increases over the series, the series is drifting from editorial to marketing. Flag the inflection point.

**Series-Level Output:**
```
SERIES ANALYSIS
===============
TOTAL ARTICLES:       [N]
ARGUMENT ARC:         [Does the series develop or repeat?]
STAT RECYCLING:       [List any facts/stats appearing 3+ times]
FRAMING DEVICE:       [Still earning its keep? Y/N — which article 
                       it should have been retired]
PRODUCT CREEP:        [Clean / Drifting / Marketing by article N]
TIER RANKING:         [Strong / Solid / Needs Work / Rethink per article]
RECOMMENDED CUTS:     [Which articles to kill, merge, or fundamentally 
                       reframe]
SEQUENCING:           [Optimal publication order if different from 
                       current]
```

## Audit Mode

When the writer provides existing published or drafted content (not raw input for a new pitch), switch to audit mode. This runs the critic loop in reverse — evaluating what was written rather than what could be written.

**Audit Process:**

1. **Extract the implicit pitch.** Read the article and reverse-engineer what the pitch block *should have been*. Fill in all fields. This often reveals that the article doesn't have a clear insight, or that the insight got buried under tangential material.

2. **Run the full critic loop** (all six critics) against the extracted pitch. Score it the same way. This tells you whether the article that was written *should have been* written in its current form.

3. **Gap Analysis.** Compare what the article promises (title, introduction, framing) against what it delivers (actual content, evidence, conclusions). Flag:
   - Promises made but not delivered
   - Sections that don't serve the insight
   - Evidence that's asserted but not grounded
   - Places where the article wanders from its own thesis

4. **Salvage Assessment.** For articles that don't pass the critic loop, answer: is there a better article hiding inside this one? If yes, produce a new pitch block for that better article. If no, recommend killing it.

**Audit Output:**
```
CONTENT AUDIT
═════════════════════════════════════
ARTICLE:          [Title]
EXTRACTED PITCH:  [Reverse-engineered pitch block]

CRITIC REPORT:    [Full six-critic report]

GAP ANALYSIS:
  PROMISED:       [What the article set up]
  DELIVERED:      [What it actually provided]
  GAPS:           [Specific mismatches]

SALVAGE:          [KEEP AS-IS / REVISE / EXTRACT BETTER ARTICLE / KILL]
BETTER ARTICLE:   [If applicable: new pitch block]
═════════════════════════════════════
```

## What This Skill Does NOT Do

- It does not write articles. It produces briefs.
- It does not do SEO keyword research. That's the writing agent's job.
- It does not produce social copy, distribution plans, or formatting. Downstream.
- It does not soften bad news. If an idea isn't worth writing, it says so directly.
