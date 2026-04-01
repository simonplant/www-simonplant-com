---
title: Easy Markdown
tagline: Structured content rendering pipeline
description: A content processing library that transforms markdown with structured frontmatter into type-safe, validated content collections. Designed for sites where content is produced by both humans and AI agents.
status: beta
role: Content Processing & Rendering
github: https://github.com/simonplant/easy-markdown
tags: [markdown, content-pipeline, frontmatter, type-safety]
order: 3
relatedProducts: [clawdius, clawhq]
---

## Problem

When AI agents produce content, you need more than a markdown parser. You need schema validation, editorial workflow enforcement, and type-safe frontmatter — all at build time, not runtime. Content that passes schema validation but reads like garbage is still a problem.

## Architecture

Easy Markdown provides:

- **Schema-first content** — Zod schemas define frontmatter structure, enforced at build time
- **Editorial workflow** — status-based publishing gates (idea, draft, review, published)
- **Collection types** — support for different content shapes (articles, KB entries, product pages)
- **Build-time validation** — catch structural errors before they reach production

## Current Status

Beta. Core parsing and validation pipeline is stable. Used in production on this site for series, commentary, and architecture KB content.

## Quickstart

```bash
git clone https://github.com/simonplant/easy-markdown
cd easy-markdown
npm install
npm run build
```

## How It Fits

Easy Markdown is the content layer. Clawdius produces markdown content that flows through Easy Markdown's validation pipeline. The schemas defined here enforce the quality bar — missing fields, invalid status values, and malformed frontmatter get caught before merge.
