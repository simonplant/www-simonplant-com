# Promotion & attribution

Every link you share to drive traffic must be UTM-tagged, using **canonical**
parameter values, so PostHog can tell you which channel actually works.

## Why canonical values matter

`utm_source=hn`, `utm_source=hackernews`, and `utm_source=HN` become **three
separate rows** on the dashboard's "Traffic by UTM source" tile. Pick one
spelling per channel and never deviate. The generator enforces this.

## Generate a tagged link

```sh
npm run utm -- <url> <source> [campaign]

# examples
npm run utm -- https://www.simonplant.com/projects/clawhq hn clawhq-launch
npm run utm -- https://www.simonplant.com/blog/the-cpanel-moment reddit
npm run utm -- --list      # show known sources
```

Output is the tagged URL — copy it into the post/share. The `utm_medium` is
derived automatically (e.g. `hn → social`, `newsletter → email`). To add a new
channel, edit `SOURCES` in `scripts/utm.mjs` — don't hand-write a new spelling.

## How it closes the loop

```
tagged link → PostHog parses utm_source/medium/campaign
            → "Traffic by UTM source" tile shows clicks per channel
            → session replays show what each channel's visitors actually do
```

Pageviews tell you which channel sends *traffic*; the custom events
(`read_complete`, `outbound_click`, scroll depth) and replays tell you which
channel sends traffic that *engages*. Optimize for the second.
