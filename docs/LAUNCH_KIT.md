# Launch Kit — Patterns + Security + Sterling

A ready-to-fire promotion kit for the July 2026 content wave. Nothing here is
automated — it's copy and commands for you to run when you decide to publish and
promote. Regenerate any link with `npm run utm -- <url> <source> <campaign>`.

## Pre-flight (do first)

1. **Publish the review queue.** Flip `status: review` → `published` on what you
   want live (all at architecture-pattern / defense-forward level, owner-only):
   - `src/content/commentary/why-my-trading-agent-cant-trade.md` (Sterling launch)
   - `src/content/security/*.md` (4 entries — publish as a batch; they cross-link)
   - `src/content/commentary/the-cpanel-moment.md` (verify its 2 `[VERIFY]` stats first)
2. `npm run build` — confirm 0 errors.
3. Commit + push. Cloudflare Pages deploys `main`.
4. **Annotate the deploy in PostHog** so the traffic spike is labelled:
   `npm run annotate -- "Published agent patterns + security KB + Sterling post"`

## The three things worth promoting (in order)

### 1. Sterling launch post — the human-interest hook

The most shareable single piece. Leads with a hook ("my trading agent can't
trade"), pays off with architecture. Best for LinkedIn.

- Link: `https://www.simonplant.com/blog/why-my-trading-agent-cant-trade?utm_source=linkedin&utm_medium=social&utm_campaign=sterling-launch`
- Suggested LinkedIn copy:

  > I built an AI agent that watches the market all day, briefs me, and proposes
  > trades against a locked plan. It has never placed an order — and it
  > structurally *can't*. There's no broker code in the system at all.
  >
  > Most people think that's the unfinished 90%. I think the constraint is the
  > whole point. When an agent operates somewhere mistakes are expensive and
  > irreversible, you don't gate the dangerous action behind a config flag you
  > can turn off — you make it structurally impossible, enforced below the model
  > where the guarantee actually holds.
  >
  > Wrote up why, and the five design patterns the constraint forced:

### 2. The architecture patterns hub — the credibility play

For your professional network: signals depth, not novelty.

- Hub link: `https://www.simonplant.com/architecture?utm_source=linkedin&utm_medium=social&utm_campaign=patterns-launch`
- Strongest single pattern to lead with:
  `https://www.simonplant.com/architecture/advisory-only-agents?utm_source=linkedin&utm_medium=social&utm_campaign=patterns-launch`

### 3. The cPanel Moment — the Hacker News play (hold until verified)

The most HN-shaped thing you have: a contrarian infrastructure thesis with
historical pattern-matching. Do NOT post until the two `[VERIFY]` stats are
sourced or softened — HN will find them.

- `npm run utm -- https://www.simonplant.com/blog/the-cpanel-moment hn cpanel-thesis`
- Post as "Show HN"-adjacent or a blog submission; be in the thread to respond.

## Channel discipline

Always route through `npm run utm` — consistent `utm_source` spelling is what
keeps the PostHog "Traffic by UTM source" tile from fragmenting (`hn` vs `HN` vs
`hackernews` = three rows). Known sources: `npm run utm -- --list`.

## What to watch afterward (your stated goal: who's visiting)

Two questions matter more than pageviews:

1. **Where do readers arrive from?** PostHog → the UTM source tile. Tells you
   which channel is worth repeating.
2. **What gets read to completion?** The `read_complete` event and the "Reads
   completed by article" tile. A high open / low completion split means the hook
   works and the body doesn't — fix the piece, not the promotion.

If a pattern entry gets real read-through, that's the signal to write the next
one in that vein. Let the data pick the cadence.
