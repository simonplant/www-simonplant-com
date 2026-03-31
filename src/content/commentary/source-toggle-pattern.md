---
title: "The Source Toggle Pattern: How to Show Raw Markdown Without Losing Your Editor"
description: "A TextKit 2 cursor synchronization pattern that lets markdown editors show rendered preview and raw source without losing the user's position."
publishedDate: 2026-03-21
tags: ["ios", "swift", "textkit", "markdown"]
tier: deep-dive
status: review
---

**Tool:** easy-markdown  
**Queue entry:** up-005

---

Users want to see the markdown. They also want the rendered view. Most editors force you to choose.

The typical approach — two modes, one buffer, a button to switch — sounds simple. In practice it's a usability trap. Every editor that implements it has the same flaw: cursor position resets to the top when you switch views. You're 600 words into a document, reading the rendered output, you switch to raw to fix a footnote reference, and the editor drops you back at line 1. So you stop switching. The raw view becomes vestigial.

## Why Naive Mode-Switching Fails

The root problem is that "rendered view" and "source view" feel like different things, so developers implement them as different things — separate view controllers, separate scroll positions, separate cursor state.

But they're not different things. They're two representations of the same buffer, at the same cursor position, with different rendering applied.

When the views aren't synchronized at the document model level, any switch discards your position. The editor doesn't know where you *were* in the source — it only knows where you are in the rendered layout, and those coordinate spaces don't map directly.

The result: users do one of two things. They stay in rendered mode and never look at source. Or they stay in raw mode and miss the layout benefits. The toggle becomes decoration.

## The Fix: Shared Cursor Position via TextKit 2

The fix is to make cursor synchronization part of the architecture, not a bolt-on.

In TextKit 2, the document model (NSTextContentStorage) and the layout engine (NSTextLayoutManager) are separate. That separation is the key. The cursor position in the text storage is a character offset into the raw string — it doesn't change when you change how you *render* that string.

Here's the pattern, implemented in [easy-markdown](https://github.com/simonplant/easy-markdown):

```swift
// Store cursor position as character offset before switching
var savedOffset: Int = 0

func toggleSourceMode() {
    // Capture current position in document model (not layout)
    if let selection = textView.textLayoutManager?.textSelections.first,
       let position = selection.textRanges.first?.location,
       let offset = textView.textContentStorage?.offset(from: textView.textContentStorage!.documentRange.location, to: position) {
        savedOffset = offset
    }

    isSourceMode.toggle()
    applyRenderer(isSourceMode ? .raw : .richText)

    // Restore position after renderer switch
    DispatchQueue.main.async {
        self.restoreCursor(to: self.savedOffset)
    }
}

func restoreCursor(to offset: Int) {
    guard let contentStorage = textView.textContentStorage,
          let layoutManager = textView.textLayoutManager else { return }

    // Walk from document start by character offset
    let docStart = contentStorage.documentRange.location
    guard let targetLocation = contentStorage.location(docStart, offsetBy: offset) else { return }

    let selection = NSTextSelection(
        range: NSTextRange(location: targetLocation),
        affinity: .downstream,
        granularity: .character
    )
    layoutManager.textSelections = [selection]
    textView.scrollToVisible(textView.caretRect(for: targetLocation) ?? .zero)
}
```

The critical line is the character offset calculation against the text content storage — not against the layout manager. The content storage is renderer-agnostic. Whether you're in rich text or raw source mode, a character offset of 847 points to the same character in the underlying document string. The layout changes. The content doesn't.

A few implementation details that matter:

**Dispatch to next run loop cycle.** The renderer switch happens asynchronously (layout invalidation, relayout). If you try to restore cursor position in the same tick, the layout manager may not have finished repositioning its coordinate space. The `DispatchQueue.main.async` ensures the restore happens after layout completes.

**Clamp the offset.** If the user switches to source mode after the document has been edited and the offset now exceeds the document length (e.g., you're at the end of a file and a rendering artifact adds padding), clamp to `max(0, min(offset, documentLength - 1))`.

**Don't try to convert between rendered coordinates and source coordinates.** You don't need to. Store the raw offset and restore it. The rendered position will be close enough — within the same sentence, which is what users actually want.

## Real Example

During easy-markdown's FEAT-014 implementation, the first attempt used the standard approach: save the visible rect (scroll position) and restore it after the mode switch. This kept the visible window roughly stable, but cursor position still jumped — if you were mid-word in an edited line, you'd come back to the line start.

The fix came from recognizing that `NSTextContentStorage` holds the canonical character offset independent of rendering mode. Switching to offset-based synchronization meant:

- Tap source toggle at cursor position 1,247
- Raw markdown shows at character 1,247 — which puts you in the same paragraph, same line
- Fix the footnote reference
- Tap toggle back
- Rendered view restores at character 1,247 — same sentence, same position

In practice, position accuracy is sub-sentence. Users don't notice the cursor is at character 1,247 vs 1,253 — they notice they're *in the right paragraph*, which is the actual expectation.

## When This Pattern Matters Most

The source toggle becomes genuinely useful — rather than a checkbox feature — when the mapping is tight enough that users *stop thinking about switching*. That's the bar. If switching requires the user to re-orient after every toggle, they'll avoid it. If it's seamless, the toggle becomes part of normal editing flow: write in rich text, verify the syntax in source, switch back.

That's the productivity pattern easy-markdown is built around: treat markdown as a document format with two views, not two modes with an escape hatch between them.

## Takeaway

A source toggle that doesn't preserve cursor position isn't a feature — it's a footgun with a button. Store the character offset against the document model, not the layout, and restore it after the renderer switch. The math is two lines. The usability difference is significant.

---

*easy-markdown is a native iOS markdown editor built on SwiftUI and TextKit 2. [Source on GitHub.](https://github.com/simonplant/easy-markdown)*
