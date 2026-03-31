---
title: "Why Every Markdown Editor Gets It Wrong"
description: "The core design mistake in every markdown editor I've used — and what building easy-markdown taught me about what writers actually need."
publishedDate: 2026-03-07
tags: ["markdown", "ios", "design", "easy-markdown"]
tier: signal
status: review
---

I've used a lot of markdown editors. I've used them seriously, for years, across platforms. And I've reached a conclusion that sounds harsh but I think is accurate:

**Every popular markdown editor is wrong about what the product is.**

They've built the wrong thing, optimized for the wrong user, and in doing so, created a category of software that's more complicated than the format it was designed to serve.

Here's what I mean.

---

## The Core Mistake: The Vault

Obsidian is the dominant markdown editor of 2024–2026. It's genuinely impressive software. The plugin ecosystem alone is a remarkable community achievement.

And yet Obsidian's central design decision — the vault — is the thing that makes it wrong for most use cases.

A vault is a local database of your markdown files, managed by Obsidian, organized the way Obsidian expects. Open a vault and you open a system. Open a folder — a real folder, your folder — and Obsidian treats it like it needs to own it.

This creates friction at the edges. Want to open a single `.md` file from a Git repo? You're either opening the whole repo as a vault or you're fighting the software. Want to edit a markdown file that lives in your Dropbox notes folder, your iCloud Drive, or a shared work repository? Same problem.

The vault is a database pretending to be a file system. And markdown is a file format that doesn't need a database.

---

## Why This Happened

The vault model evolved because linked documents needed more than a flat file system. Backlinks, graph views, transclusion — these features require Obsidian to know about all your files at once. The vault became the container for that knowledge graph.

That's a legitimate product choice. If you're building a personal knowledge management system, a vault is probably right.

But most markdown users aren't building a PKM. They're writing documents. They're editing README files. They're maintaining notes that live in Git repos alongside code. They're journaling into iCloud Drive. They're writing posts that go somewhere — a blog, a docs site, a PR description.

For those users, the vault is overhead. It's a system they're maintaining to do a thing that shouldn't require a system.

---

## Bear Is Lovely and Also Wrong

Bear is my second-most-used editor, and I have genuine affection for it. The typography is beautiful. The UX is tight. It's the best-feeling editor on iOS by a significant margin.

But Bear uses proprietary storage. Your notes live in a SQLite database. The file is not the truth — Bear's database is the truth.

Export is good. You can get your markdown out. But you can't open a `.md` file from your file system and edit it in Bear. You import into Bear; Bear owns it; you export back out if you need it somewhere else.

This is the right trade-off for a certain kind of user — someone who wants their notes in one beautiful place forever and doesn't need to share files with other tools. For anyone with a more fluid workflow, it's a hard wall.

---

## Notion Is a Database, Not an Editor

Notion is genuinely useful software. I've built project trackers, wikis, and CRMs in it.

It is not a markdown editor.

Notion's "markdown-style" formatting is a UI affordance, not a first-class format. Your content is stored in Notion's block model. The markdown you import gets translated. The markdown you export is a best-effort reconstruction.

Most importantly: Notion doesn't work offline. For a tool I'm supposed to use for thinking and writing, requiring a network connection is a hard no. The moment a plane takes off, I lose my writing environment.

---

## The iA Writer Counterexample

iA Writer is close to right. It opens real files from real locations. It has no vault. It's genuinely focused on writing prose.

Where it falls short, in my view:

1. **No real AI integration.** The Authorship feature tracks AI-generated text, but iA Writer isn't built for AI-assisted editing. There's no streaming inference, no action bar, no on-device model support.

2. **No power user surface.** iA Writer is deliberately minimal — which is right for literary writing, but wrong for technical writing. There's no table editing, no document diagnostics, no formatter.

3. **Markdown rendering is static.** You're either in edit mode or preview mode, not both at once in a way that feels fluid.

iA Writer got the file model right. It got the minimalism right. It didn't get the technical writing surface right.

---

## What a Markdown Editor Should Actually Be

I built [easy-markdown](https://github.com/simonplant/easy-markdown) because none of these tools satisfied the brief I actually needed to fill. Here's what I think is correct:

### 1. The file is the truth.

No database. No vault. No proprietary storage. You point the editor at a `.md` file — from iCloud Drive, Dropbox, a Git repo, your Downloads folder, wherever — and you edit it. When you save, the file is updated. That's it. Other tools can read it, commit it, diff it, share it.

This is not a novel idea. This is what text editors have always done. The markdown editor category inexplicably forgot it.

### 2. On-device AI is a first-class feature, not a subscription add-on.

Apple Silicon hardware since the A16 has enough horsepower to run capable language models locally. Every iPhone 14 Pro and later, every M1+ Mac. That's most of the installed base.

A markdown editor in 2026 that doesn't offer on-device AI assistance is leaving the most important feature on the table. Local inference means: works offline, no API key required, no data leaving the device. For a writing tool that handles your notes, drafts, and documents, privacy isn't a premium feature — it's baseline.

### 3. Rendering and editing should coexist.

Preview mode and edit mode are a legacy distinction. Modern text rendering is fast enough — specifically, TextKit 2 on Apple platforms — to render markdown formatting inline, live, without a separate preview pane. You see the formatted output while you type. No mode switching.

### 4. Technical writing needs real tools.

Tables, code blocks, heading structure, link checking — technical documents have structure, and structure requires tools. A formatter that auto-aligns table columns on every keystroke isn't a luxury feature for technical writers; it's table stakes (sorry). Document diagnostics that flag broken links and orphaned sections catch errors before they ship.

### 5. No lock-in, ever.

The editor should be replaceable. Your files are your files. If easy-markdown disappeared tomorrow, every file you edited in it would open perfectly in any other editor, because they're `.md` files. There's no export step. There's no format to migrate.

---

## The Underlying Problem Is Incentives

Why did this category go wrong? Because lock-in is a business model.

Vaults and proprietary storage create switching costs. Switching costs reduce churn. Reduced churn makes subscription revenue predictable. This is the playbook and it works — for the company.

For the user, it means you're not buying a tool; you're joining a system. That's fine if the system is worth it. But for most markdown writing, you don't need a system. You need a sharp editor that opens files.

The best tools don't extract value from lock-in. They create value from quality. The user stays because the tool is better, not because leaving is painful.

---

## Where Things Are Going

AI changes the calculus here in a specific way.

The primary value of markdown editors has always been the writing experience — clarity, focus, good typography. AI adds a second value: active assistance during writing. Summarize this. Improve this paragraph. Fix the grammar. Continue this thought.

If AI assistance becomes table-stakes (and I think it will), the editors that win will be the ones that integrate AI into the writing flow without requiring a cloud account, without charging a subscription for basic inference, and without making you leave your files behind to access it.

The vault model, the proprietary database model, the "AI as cloud add-on" model — these all move in the wrong direction from where this needs to go.

The right answer is the same as it always was: open a file, write in it, save it, close it. Now with a capable AI that runs on your device, offline, on your terms.

That's what I'm building.

---

*Simon Plant is a fractional CTO and AI-accelerated developer. easy-markdown is at [github.com/simonplant/easy-markdown](https://github.com/simonplant/easy-markdown) — Apache 2.0, open to contributors.*
