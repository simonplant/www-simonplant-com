# Promotion & attribution

Tag every shared link with UTM parameters using canonical source values, so
PostHog attributes traffic per channel without fragmenting (`hn` vs `hackernews`
vs `HN` would split into three rows).

## Generate a link

```sh
npm run utm -- <url> <source> [campaign]
npm run utm -- https://www.simonplant.com/projects/clawhq hn clawhq-launch
npm run utm -- --list      # known sources
```

`utm_medium` is derived from the source (`hn → social`, `newsletter → email`).
Add new channels by editing `SOURCES` in `scripts/utm.mjs`.

## Mark each launch

When a link goes out, annotate the timeline so the traffic shows context:

```sh
npm run annotate -- "Posted clawhq to HN"
```

## Attribution

Tagged traffic appears on the dashboard's "Traffic by UTM source" tile.
Pageviews show reach; the `read_complete` / `outbound_click` events and session
replays show engagement per channel.
