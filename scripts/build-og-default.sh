#!/usr/bin/env bash
# Regenerate the default Open Graph / Twitter Card image.
# Output: public/og-default.png (1200x630)
#
# Uses ImageMagick `convert`. Brand fonts (DM Serif Display, Literata)
# aren't installed system-wide, so this uses Liberation Serif as the
# closest available fallback. The result is a functional placeholder;
# when the brand evolves, replace this with a designed card or a
# satori-based build-time generator.
set -euo pipefail

cd "$(dirname "$0")/.."

BG="#0a0a0f"
ACCENT="#d4a853"
TITLE_COLOR="#e8e6e1"
SUB_COLOR="#a0a0b0"
MUTED_COLOR="#6b6b7b"

OUT="public/og-default.png"

convert -size 1200x630 "xc:${BG}" \
  -fill "${ACCENT}" \
  -draw "rectangle 80,80 160,88" \
  -font Liberation-Serif -pointsize 120 -fill "${TITLE_COLOR}" \
  -gravity NorthWest -annotate +80+140 "Simon Plant" \
  -font Liberation-Serif-Italic -pointsize 42 -fill "${SUB_COLOR}" \
  -annotate +80+300 "Long-form series, commentary, architecture" \
  -font Liberation-Serif -pointsize 28 -fill "${MUTED_COLOR}" \
  -gravity SouthWest -annotate +80+80 "www.simonplant.com" \
  "${OUT}"

echo "Wrote ${OUT}"
