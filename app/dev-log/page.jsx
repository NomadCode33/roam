"use client";
import { useState, useEffect, useRef } from "react";
//import Sidebar from "../../components/dev-log/Sidebar";
import "../../css/devlog.css";

// ─── Tab Config ───────────────────────────────────────────────────────────────
const TABS = [
  { id: "progression", icon: "🚀", label: "Progression",    sublabel: "Updates & milestones", section: "PROGRESS" },
  { id: "future",      icon: "🔮", label: "Future Updates", sublabel: "Planned features",     section: "PROGRESS" },
  { id: "optimize",    icon: "⚡", label: "Optimizations",  sublabel: "Performance & refactors", section: "PROGRESS" },
  { id: "learned",     icon: "🧠", label: "What I Learned", sublabel: "Lessons & insights",   section: "PROGRESS" },
  { id: "bugs",        icon: "🐛", label: "Bug Log",         sublabel: "Issues & fixes",       section: "PROGRESS" },
  { id: "stack",       icon: "⚙️", label: "Tech Stack",     sublabel: "Tools & deps",         section: "REFERENCE" },
  { id: "snippets",    icon: "📎", label: "Code Snippets",  sublabel: "Reusable refs",        section: "REFERENCE" },
  { id: "resources",   icon: "🔗", label: "Resources",      sublabel: "Docs & links",         section: "REFERENCE" },
];

// ─── Pinned Cards — FEATURE REFERENCE (read this once, it covers everything) ──
// Optional card shown at the top of a tab, inside the content header (below
// the description/count line, above the horizontal rule). Defined once per
// entry in PINNED, keyed by the tab it "lives on" — but a single entry can
// also be projected onto other tabs via `appliesTo` (see below), so you never
// have to duplicate the same card data across multiple tab keys.
//
// ── Card fields ──
//   label:   small eyebrow tag above the title, e.g. "PINNED" (optional)
//   title:   card title (required)
//   body:    string or array of strings, same rules as card `body` (optional)
//   linkText / linkUrl: single CTA link, e.g. a Trello board (optional)
//   links:   array of { text, url } for multiple CTAs, e.g. one per phase
//            (optional — use this instead of linkText/linkUrl when you need
//            more than one link on the same card)
//   linksLayout: "horizontal" (default) or "vertical" — only matters when
//            `links` is used. Horizontal = row, wraps if it runs out of space.
//            Vertical = stacked list, one per line.
//   If both `links` and `linkText`/`linkUrl` are present, `links` takes priority.
//
// ── Multi-tab targeting: `appliesTo` (NEW) ──
// By default a card only shows on the tab it's keyed under. Add `appliesTo`
// to also surface that exact same card on other tabs, without copy-pasting it:
//   appliesTo: ["stack", "snippets"]   // show on these specific tabs too
//   appliesTo: "all"                   // show on every tab, current or future
// The home tab (the PINNED key it's defined under) does NOT need to be listed
// in `appliesTo` — it always shows there regardless. Direct entries always win:
// if a target tab has its own PINNED[id] defined, that tab keeps its own card
// instead of inheriting one via appliesTo.
// "all" is resolved dynamically off the TABS list, so it auto-covers any tab
// you add later — no need to touch appliesTo when the tab count grows past 8.
//
// ── Section-wide targeting: "section:<SECTION>" (NEW) ──
// Broadcast a card to every tab within one sidebar section only — PROGRESS or
// REFERENCE — instead of every tab site-wide. Also resolved live off TABS, so
// any tab you add later to that section automatically inherits it too, no
// PINNED edits required.
//   appliesTo: "section:PROGRESS"      // every tab under PROGRESS, current or future
//   appliesTo: "section:REFERENCE"     // every tab under REFERENCE, current or future
// Same precedence rule applies: a tab's own direct PINNED[id] entry always
// wins over a section-wide inherited one.
//
// To take a card down entirely, delete its entry (or set it to null/undefined)
// and redeploy — no separate on/off flag needed.
//
// ── Examples ──
// Single link, home tab only:
//   progression: {
//     label: "PINNED",
//     title: "Roadmap board",
//     body: "Live task tracking for what's in progress right now.",
//     linkText: "Open Trello →",
//     linkUrl: "https://trello.com/b/yourboard",
//   },
//
// Multiple links (e.g. one per phase), horizontal (default):
//   progression: {
//     label: "PINNED",
//     title: "Roadmap",
//     body: "Phase boards for the current build-out.",
//     links: [
//       { text: "Phase 1 →", url: "https://trello.com/b/phase1" },
//       { text: "Phase 2 →", url: "https://trello.com/b/phase2" },
//     ],
//   },
//
// Same, but stacked vertically:
//   progression: {
//     ...
//     linksLayout: "vertical",
//     links: [ ... ],
//   },
//
// One card, shown on 3 tabs (defined under "progression", also appears on
// "optimize" and "learned"):
//   progression: {
//     label: "PINNED",
//     title: "Roadmap",
//     body: "Phase boards for the current build-out.",
//     linkText: "Open Trello →",
//     linkUrl: "https://trello.com/b/yourboard",
//     appliesTo: ["optimize", "learned"],
//   },
//
// One card, shown everywhere (defined under "resources", broadcast to all tabs):
//   resources: {
//     title: "House rules",
//     body: "Same conventions apply across every log entry.",
//     appliesTo: "all",
//   },
//
// One card, shown on every PROGRESS tab only (current + future ones):
//   progression: {
//     title: "Sprint board",
//     body: "Live task tracking for the current sprint.",
//     linkText: "Open Trello →",
//     linkUrl: "https://trello.com/b/yourboard",
//     appliesTo: "section:PROGRESS",
//   },
//
// One card, shown on every REFERENCE tab only (current + future ones):
//   stack: {
//     title: "House rules",
//     body: "Same conventions apply across every reference doc.",
//     appliesTo: "section:REFERENCE",
//   },
//
// Leave a tab's entry out entirely (or null) to show no pinned card there
// (unless it's inheriting one from another tab's `appliesTo`).
const PINNED = {
  progression: {
    label: "PINNED",
     title: "Project Hub",
     body: "Repo, board, and design files for the current build.",
     links: [
      { text: "Website →", url: "https://roam-dusky-alpha.vercel.app/" },
      { text: "Roam GitHub Repo →", url: "https://github.com/NomadCode33/roam" }, 
      { text: "Phase 1 (Kanban) →", url: "https://trello.com/b/6ZvbHk51/roam-phase-1" },
      { text: "Figma →", url: "https://www.figma.com/design/YZmwBodxfLgd2Nq0umAsRZ/Roam-Website-Flowmap?node-id=0-1&p=f" },
     ],
     appliesTo: ["future", "optimize", "learned", "bugs"]
     // card on other tabs, or set to "all" to broadcast it everywhere.
  },
  future: null,
  optimize: null,
  learned: null,
  bugs: null,
  stack: null,
  snippets: null,
  resources: null,
};

// ─── Content Data ─────────────────────────────────────────────────────────────
// HOW TO ADD MEDIA TO A CARD:
// Add a `mediaItems` array to any card entry. Each item in the array is one
// piece of media. They stack vertically in the order you list them, with
// spacing between each one. You can mix types freely — images, videos, iframes.
//
// Was `media` (single object). Now `mediaItems` (array of objects).
// This lets you add as many media items as you need per card.
//
// Each media item has:
//   type:    "image" | "video" | "youtube"
//   src:     URL or path (for image/video)
//   id:      YouTube video ID e.g. "dQw4w9WgXcQ" (for youtube only)
//   caption: optional text shown below that specific item
//
// Examples:
//
// Single image:
//   mediaItems: [
//     { type: "image", src: "/images/screenshot.png", caption: "DevTools error" }
//   ]
//
// Multiple mixed media:
//   mediaItems: [
//     { type: "image",   src: "/images/before.png",  caption: "Before the fix" },
//     { type: "image",   src: "/images/after.png",   caption: "After the fix" },
//     { type: "youtube", id: "dQw4w9WgXcQ",          caption: "Video walkthrough" },
//     { type: "video",   src: "/videos/demo.mp4",    caption: "Local recording" },
//   ]
//
// Leave out `mediaItems` entirely if you don't want any media on that card.
//
// ─────────────────────────────────────────────────────────────────────────────
// HOW TO USE MULTIPLE PARAGRAPHS IN `body`:
// `body` now accepts either a plain string (single paragraph, same as before)
// OR an array of strings (one string = one paragraph, rendered with spacing between them).
//
// Single paragraph (unchanged from before):
//   body: "This is one paragraph of text."
//
// Multiple paragraphs:
//   body: [
//     "This is the first paragraph.",
//     "This is the second paragraph, separated by space above.",
//     "And a third if you need it.",
//   ]
//
// Both formats work everywhere — progression, future, learned, bugs, snippets, resources.
// ─────────────────────────────────────────────────────────────────────────────
// HOW TO EMBED BULLETS INSIDE `body` (mixed array):
// Instead of using the separate `bullets` field, you can embed bullet lists
// directly inside `body` by putting `{ bullets: [...] }` objects in the array.
// Paragraphs and bullet lists render in the exact order you write them, so
// you can freely interleave text and bullets within a single card.
//
// The `{ bullets: [...] }` objects inside body support the exact same nested
// bullet syntax as the standalone `bullets` field — flat strings, objects with
// `text` + `children`, any depth. See the bullet points section below for details.
//
// Paragraph → bullets → paragraph:
//   body: [
//     "Intro paragraph before the bullets.",
//     { bullets: ["First point", "Second point"] },
//     "Closing paragraph after the bullets.",
//   ]
//
// Multiple bullet blocks with paragraphs between them:
//   body: [
//     "First section intro.",
//     { bullets: ["Point A", "Point B"] },
//     "Second section intro.",
//     { bullets: ["Point C", { text: "Point D", children: ["Sub-detail"] }] },
//   ]
//
// Bullets only (no paragraphs):
//   body: [
//     { bullets: ["Just bullets", "No paragraphs needed"] },
//   ]
//
// NOTE: The standalone `bullets` field on the card still works exactly as before
// and renders after the body. Use whichever approach fits your content better —
// embed bullets in `body` when they're part of a flowing explanation, use the
// standalone `bullets` field when they're a simple list at the end of the card.
// ─────────────────────────────────────────────────────────────────────────────
// HOW TO USE `code` ON A CARD (works in every tab, not just Code Snippets):
// Add `code` (string) and optional `lang` (string, e.g. "sql", "js") directly
// to any card entry, in any tab. It renders as its own block, after body and
// bullets — same look as Code Snippets, everywhere else too.
//
//   { id: 1, topic: "...", body: "...", code: "SELECT 1;", lang: "sql" }
//
// You are NOT limited to one code block per card — see below for embedding
// multiple code blocks (and bullets, and paragraphs) inside `body` itself.
// ─────────────────────────────────────────────────────────────────────────────
// HOW TO INTERLEAVE TEXT + CODE SEAMLESSLY INSIDE `body`:
// Any string used as `body` (or inside a `body` array) is scanned for
// markdown-style fenced code blocks. Everything outside the fences renders as
// normal paragraph text; everything inside renders as a code block — in the
// exact order you write them, mixed freely with as many fences as you like.
//
//   body: "Drop and recreate it:\n```sql\nALTER TABLE ...;\n```\nApplies to X."
//
// This means text → code → text → code, or bullets in between (see the
// mixed-array bullets section above) — all in one `body` value. The fence
// language tag (```sql, ```js, ```bash, etc.) is optional; the tag itself is
// not shown in the block, it's only used to label it if you choose to style
// per-language later.
//
// You can also drop an explicit `{ code: "...", lang: "..." }` object directly
// into a `body` array instead of using a fence — useful when the code has its
// own backticks in it and you'd rather not escape a fence:
//
//   body: [
//     "Intro paragraph.",
//     { code: "SELECT * FROM users;", lang: "sql" },
//     "Closing paragraph.",
//     { bullets: ["Point A", "Point B"] },
//     { code: "npm run build" },
//   ]
//
// All of the above compose freely with bullets and multi-paragraph arrays —
// text, code, and bullet blocks can appear in any order, any number of times.
// ─────────────────────────────────────────────────────────────────────────────
// HOW TO USE BULLET POINTS IN A CARD:
// Add a `bullets` array to any card entry alongside (or instead of) `body`.
// Each item is either a plain string (flat bullet) or an object with `text`
// and optional `children` for nested sub-bullets. Nesting is unlimited.
//
// LEVEL MARKERS (styled in CSS):
//   Level 1 (*):  filled cyan circle   — main point
//   Level 2 (**): hollow cyan circle   — sub-point
//   Level 3 (^):  en-dash              — detail
//   Level 4 (#):  right guillemet ›    — further detail
//   Level 5 (!):  asterisk *           — edge case / warning
//
// Flat bullets (same as before — backwards compatible):
//   bullets: ["First point", "Second point"]
//
// Nested bullets:
//   bullets: [
//     "Top-level point",
//     { text: "Another top-level", children: [
//       "Sub-point under it",
//       { text: "Sub-point with child", children: [
//         "Third-level detail",
//       ]},
//     ]},
//   ]
//
// Works in all tabs: progression, optimize, future, learned, bugs, snippets, resources.
// ─────────────────────────────────────────────────────────────────────────────
// HOW TO USE MULTIPLE TAGS PER CARD:
// The `tag` field (single string) still works as before.
// To add multiple tags, use `tags` (array of strings) instead, or both together.
// Duplicates are automatically removed.
//
// Single tag (unchanged):
//   tag: "refactor"
//
// Multiple tags:
//   tags: ["refactor", "performance"]
//
// Both tag and tags together (deduplicated automatically):
//   tag: "deployment", tags: ["feature"]   →  shows both badges
//
// MAX TAGS DISPLAYED: no hard cap by default. To limit how many tags show,
// find the Tags component below and change `.map(...)` to `.slice(0, N).map(...)`
// where N is your desired maximum. Example: .slice(0, 2) shows at most 2 tags.
// ─────────────────────────────────────────────────────────────────────────────
// HOW TO ADD OPTIMIZATIONS (optimize tab):
// Each entry in DATA.optimize needs a `month` field (e.g. "March 2026").
// Cards are grouped by month — all cards sharing the same `month` string
// appear under that month heading. Within a month, cards are shown in the
// order they appear in the array, so put newest first if you want that.
//
// Required fields per entry: id, date, title, month
// Optional fields:           body, bullets, tag, tags, mediaItems
//
// Example:
//   {
//     id: 1,
//     month: "March 2026",
//     date: "Mar 23, 2026",
//     title: "Lazy-loaded Characters page",
//     body: "Reduced initial bundle size.",
//     bullets: ["Cut JS payload by 38kb", "First paint improved by ~200ms"],
//     tags: ["performance", "refactor"],
//   }


// ── Inline text formatting reference ──
// Bold:          **text**
// Italic:        *text*  or  _text_
// Underline:     ++text++
// Strikethrough: ~~text~~
// Inline code:   `text`
// Combos (nest freely): **bold *italic* text**
//                        ++underlined ~~struck~~ text++
//                        **bold ~~struck~~ ++underlined++**
//
// Escaping a marker to show it literally — in the RENDERED string you need
// a single backslash before the character: \* \_ \~ \+
// BUT in your JS source, a single backslash before a non-special char gets
// silently dropped by JS itself (e.g. "\_" becomes just "_" at runtime) —
// so in code you must write DOUBLE backslashes: \\* \\_ \\~ \\+
//   title: "comments\\_insert\\_own"   →  renders as: comments_insert_own
//   title: "comments\_insert\_own"     →  BROKEN: JS eats the \, renders italic
// ─────────────────────────────────────────────────────────────────────────────

// 6 total
/* 
    {
      id: ,
      date: "Jly, 2026",
      title: "",
      body: "",
      tag: ""
    },
    Jy, 2026
*/
const DATA = {
  // ── progression: flat list, rendered by ProgressionPane ──────────────────
  // Fields per entry: id, date, title, body (string/array), tag/tags (optional)
  progression: [
    {
      id: 58,
      date: "August 04, 2026",
      title: "Local Postgres CLI Tools Not on PATH",
      body: "`createdb: command not found` in Terminal despite Postgres.app running. Root cause: Postgres.app's CLI binaries live inside the app bundle, not the shell's default PATH. Fixed by writing `/Applications/Postgres.app/Contents/Versions/14/bin` into `/etc/paths.d/postgresapp` and restarting the terminal session.",
      tag: "fixed"
    },
    {
      id: 57,
      date: "August 04, 2026",
      title: "First Verified Backup Landed in R2",
      body: "Workflow ran green end-to-end. Verified directly in the Cloudflare dashboard (not just the Actions log): `roam-backup-2026-08-04T08-03-07Z.sql`, 348.26 KB, `application/sql`, correct timestamp. Closed the Phase E verification requirement with a real inspected object, not an inferred checkmark.",
      tag: "deployment"
    },
    {
      id: 56,
      date: "August 04, 2026",
      title: "AWS CLI Install Step Failing on Ubuntu Runner",
      body: "`apt-get install awscli` failed with `Package 'awscli' has no installation candidate`, dropped from Ubuntu `noble`'s default repos. First fix attempt (curl + official installer) then failed with `Found preexisting AWS CLI installation`, since `ubuntu-latest` ships AWS CLI pre-installed. Final fix: replaced the install step entirely with a one-line `aws --version` check.",
      tag: "fixed"
    },
    {
      id: 55,
      date: "August 04, 2026",
      title: "Backup Job Failing — IPv6 Unreachable",
      body: "`pg_dump` failed with `Network is unreachable` against the direct Supabase connection string. Root cause: GitHub Actions runners don't support IPv6 egress, and the direct connection host resolves IPv6-only. Fixed by swapping `SUPABASE_DB_URL` to the Transaction Pooler connection string (IPv4).",
      tag: "fixed"
    },
    {
      id: 54,
      date: "August 04, 2026",
      title: "GitHub Push Rejected — Missing Workflow Scope",
      body: "`git push` failed with `refusing to allow a Personal Access Token to create or update workflow... without workflow scope`. Regenerated the PAT with the `workflow` scope explicitly checked. Push succeeded on retry.",
      tag: "fixed"
    },
    {
      id: 53,
      date: "August 04, 2026",
      title: "GitHub Actions Backup Workflow Built",
      body: "Authored `.github/workflows/db-backup.yml`, daily cron (3:00 AM UTC) plus manual `workflow_dispatch` trigger. Pipeline: install Supabase CLI → dump database → verify dump non-empty → verify AWS CLI available → upload to R2 with dated filename → verify uploaded object size directly in R2 → prune backups older than 30 days.",
      tag: "feature"
    },
    {
      id: 52,
      date: "August 04, 2026",
      title: "GitHub Repository Secrets Configured",
      body: "Set repository secrets in project repo.",
      tag: "deployment"
    },
    {
      id: 51,
      date: "August 04, 2026",
      title: "R2 Bucket + Scoped API Token Provisioned",
      body: "Created `roam-db-backups` bucket on Cloudflare R2 (Automatic location, Standard storage class, Public Access disabled). Generated an Account API token, not User API token, since this is a service/production context scoped to Object Read & Write on this bucket only, TTL set to Forever for unattended scheduled use.",
      tag: "deployment"
    },
    {
      id: 50,
      date: "August 03, 2026",
      title: "Tracking doc merged to v3, session handoff doc produced",
      body: "`roam_flagged_items_v3.md` reconciles all prior open items with this session's resolutions. `roam_session_handoff.md` produced for pasting into the next conversation (starting ROA-014), including the new standing verification rule below.",
      tag: "deployment"
    },
    {
      id: 49,
      date: "August 03, 2026",
      title: "Unblock-doesn't-restore-follows behavior independently tested",
      body: "Previously assumed true because no restore trigger exists. Directly verified: no follow existed pre-unblock, unblock ran, block's removal confirmed via direct `SELECT`, follows table confirmed still empty afterward.",
      tag: "feature"
    },
    {
      id: 48,
      date: "August 03, 2026",
      title: "Blocklist privacy guarantee independently tested, both directions",
      body: "`blocks_select_own` had never been tested from the blocked party's side. Confirmed: blocker sees their own block row (`visible_to_blocker = 1`), blocked party sees nothing (`visible_to_blocked = 0`).",
      tag: "feature"
    },
    {
      id: 47,
      date: "August 03, 2026",
      title: "False-positive restore-on-unblock result caught and corrected",
      body: "The first 'restore' test passed for the wrong reason. The block row was never actually deleted, so the save was never really hidden by an active block during that check. Re-run with an independently verified delete, producing a genuine pass. Full detail in Bug Log.",
      tag: "fixed"
    },
    {
      id: 46,
      date: "August 03, 2026",
      title: "`saves_select_own` — blocking check added and verified",
      body: "Rewrote the SELECT policy on `saves` to hide a saved post when the post's author is blocked (either direction), via `is_blocked_either_direction()`. Verified with real inserted data: hidden while blocked (`visible_saves = 0`), confirmed restored after unblock (`visible_saves = 1`) on a corrected second pass. Full detail in Bug Log.",
      tag: "fixed"
    },
    {
      id: 45,
      date: "August 03, 2026",
      title: "`saves_select_own` — rewritten (not yet verified)",
      body: "Rewritten to hide saves of a blocked party's posts, using the same `is_blocked_either_direction()` function. SQL provided and explained; not yet executed or tested as of the end of this session, flagged as the immediate next step.",
      tag: "refactor"
    },
    {
      id: 44,
      date: "August 03, 2026",
      title: "Full blocking product spec agreed",
      body: "Locked in: full mutual content invisibility everywhere (posts, comments, follows, saves) both directions; one deliberate exception for direct profile navigation showing a 'you're blocked' UI state (frontend, deferred to profile-page build); blocker retains blocklist visibility for unblocking; unblocking does not auto-restore a prior follow relationship; saves from a blocked party are hidden (not deleted) and auto-restore on unblock.",
      tag: "feature"
    },
    {
      id: 43,
      date: "August 02, 2026",
      title: "`remove_follows_on_block()` trigger",
      body: "`AFTER INSERT` trigger on `blocks`, force-deletes any existing follow relationship in both directions the moment a block is created. Verified with real data: a pre-existing follow row survived a `blocks` DELETE unchanged, then was deleted immediately upon a fresh `blocks` INSERT for the same pair — proving the trigger fires on genuine INSERT events, not just that it compiles.",
      tag: "feature"
    },
    {
      id: 42,
      date: "August 02, 2026",
      title: "`posts_select_not_deleted`, `comments_select_not_deleted`, `follows_select_all` rewritten",
      body: "All three policies rewritten to call `is_blocked_either_direction()` instead of querying `blocks` directly. Each re-tested with real inserted data using the exact impersonation test that originally caught the bug; all three flipped from returning the blocked user's content to returning `0 rows`.",
      tag: "refactor"
    },
    {
      id: 41,
      date: "August 02, 2026",
      title: "`is_blocked_either_direction()` SECURITY DEFINER function",
      body: "Built as the fix for the RLS-blocks-RLS bug. It bypasses `blocks`' own RLS internally, returns only a boolean, never exposes the underlying row to a query the blocked user could run themselves. Verified via `pg_proc` and functionally tested for symmetry (both argument orders return `true` on a real blocked pair).",
      tag: "feature"
    },
    {
      id: 40,
      date: "August 02, 2026",
      title: "Blocking mutual-isolation bug (RLS-blocks-RLS)",
      body: "Discovered via ad-hoc functional testing (not a formal ROA ticket) that `blocks_select_own`'s narrow policy (`auth.uid() = blocker_id` only) silently broke `EXISTS` subqueries against `blocks` from `posts`/`comments`/`follows` SELECT policies. Those subqueries are themselves subject to `blocks`' own RLS, so the blocked party could never see the row that should trigger their own hide-condition. Root-caused through a multi-step elimination process (ruled out owner-bypass, type mismatch, `auth.uid()` resolution failure) before finding the actual policy gap.",
      tag: "fixed"
    },
    {
      id: 39,
      date: "August 02, 2026",
      title: "ROA-012: Missing `blocks.blocked_id` index",
      body: "Live-checked ROA-001's actual RLS policy SQL and found `blocked_id` was queried standalone in OR branches across `comments`/`follows`/`posts` policies. The pre-existing `blocks_unique_pair` composite index didn't cover this on its own. Added `idx_blocks_blocked_id`.",
      tag: "fixed"
    },
    {
      id: 38,
      date: "August 02, 2026",
      title: "ROA-012: Database Indexes (full description-list build)",
      body: "Built every index from ROA-012's description, not just the doneWhen checklist. GIST on `places.coordinates`, GIN on `posts.vibe_tags`/`places.categories`, B-tree indexes across `places`, `posts`, `post_points`, `comments`, `reactions`, `follows`, `saves`, `notifications`, and `blocks`. Verified via `pg_indexes` and cross-checked against the Supabase dashboard UI. Confirmed `places_place_id_key` already covered the unique index requirement (skipped as a duplicate).",
      tag: "feature"
    },
    {
      id: 37,
      date: "August 01, 2026",
      title: "ROA-011 confirmed live in Supabase dashboard",
      body: "All four functions and three triggers confirmed present and enabled under Database → Functions and Database → Triggers.",
      tag: "deployment"
    },
    {
      id: 36,
      date: "August 01, 2026",
      title: "RLS vs. grants layering confirmed on `places`",
      body: "Verified that blocking client writes to `places` counters holds at both the grant layer and the RLS layer independently, by temporarily granting `UPDATE`, confirming RLS still blocked the write, then revoking and re-verifying the grant was gone.",
      tag: "fixed"
    },
    {
      id: 35,
      date: "August 01, 2026",
      title: "ROA-011 end-to-end verification",
      body: "Ran real insert and delete tests against posts, reactions, and saves, confirming both the increment and decrement paths update `post_count`, `total_upvotes`, `save_count`, `popularity_score`, and `heatmap_weight` correctly, not just 'success' messages.",
      tag: "feature"
    },
    {
      id: 34,
      date: "August 01, 2026",
      title: "Schema mismatch: trigger functions referencing wrong column",
      body: "Discovered `places.place_id` is a text slug, not the identifier other tables reference — `posts`, `reactions`, and `saves` all point at `places.id` (uuid). Rewrote all four functions to filter on `id`.",
      tag: "fixed"
    },
    {
      id: 33,
      date: "August 01, 2026",
      title: "ROA-011: Place counter triggers built",
      body: "Built `recalc_place_metrics()` plus three trigger functions (`trg_posts_count`, `trg_reactions_count`, `trg_saves_count`) and their triggers, so `post_count`, `total_upvotes`, and `save_count` on `places` update automatically from real app activity instead of manual seeding.",
      tag: "feature"
    },
    {
      id: 32,
      date: "July 31, 2026",
      title: "Standing ROA Walkthrough Format Locked In",
      body: "Established that all future ROA ticket walkthroughs across all conversations use the ROA-001 visual widget format (phases, code blocks, why/trade-off/quiz blocks, Done-When checklist), with sendPrompt branching buttons reserved only for tickets with genuine independent sub-tasks. Saved as a persistent memory rule.",
      tag: "refactor"
    },
    {
      id: 31,
      date: "July 31, 2026",
      title: "ROA-005: Terms of Service Page Live (Content Incomplete)",
      body: "Built `/terms` using the same `dangerouslySetInnerHTML` pattern as `/privacy`. Route renders and is reachable, but see Bug Log — underlying content has unresolved template fields.",
      tag: "feature"
    },
    {
      id: 30,
      date: "July 31, 2026",
      title: "Next.js Upgraded to Current LTS",
      body: "Ran `npm install next@latest`, confirmed already on current LTS (16.2.12) via live search verification. Confirmed `npm audit --force`'s proposed downgrade to `next@9.3.3` was a false-positive resolution path tied to a `postcss`/`sharp` transitive dependency, not a real fix — avoided.",
      tag: "deployment"
    },
    {
      id: 29,
      date: "July 31, 2026",
      title: "Removed Accidental TypeScript Toolchain",
      body: "A `.tsx` file mistakenly introduced during the ROA-005 walkthrough caused Next.js to auto-scaffold a full TypeScript toolchain (`tsconfig.json`, `@types/react`, `next-env.d.ts`) into a JSX-only project. All three artifacts identified and removed; project confirmed to still be pure `.jsx`.",
      tag: "fixed"
    },
    {
      id: 28,
      date: "July 31, 2026",
      title: "ROA-005: Privacy Policy Page Live",
      body: "Built and deployed `/privacy` as a publicly accessible Next.js App Router route, rendering a Termly-generated privacy policy via `dangerouslySetInnerHTML`. Confirmed working in production by user.",
      tag: "feature"
    },
    {
      id: 27,
      date: "July 31, 2026",
      title: "Service Role Key Rotation",
      body: "Rotated off the leaked legacy Supabase `service_role` key after it was exposed via an uploaded `.env.local` file. Generated new secret key (`sb_secret_...`) under the non-legacy tab, confirmed no codebase dependencies existed yet (pre-auth-integration stage), and deleted the old legacy key. Confirmed by user as defunct.",
      tag: "deployment"
    },
    {
      id: 26,
      date: "July 30, 2026",
      title: "Live Supabase service\\_role key exposure remediated",
      body: "Uploaded a live `.env.local` into chat, exposing the anon key, service_role key, and Mapbox token. Corrected remediation path researched live (Supabase's key system changed in 2025–2026): generate a new `sb_secret_...` key under the non-legacy tab, migrate server code, then delete the old legacy `service_role` key — avoiding a full JWT-secret rotation that would've invalidated the anon key and dropped all connections unnecessarily.",
      tag: "fixed"
    },
    {
      id: 25,
      date: "July 30, 2026",
      title: "Full Phase 1 dependency-respecting build order established",
      body: "Confirmed and locked the 8-wave sequencing for all remaining Phase 1 tickets (30+ items), based on real dependency chains rather than ticket number order. ROA-002 selected as the priority pick within Wave 1 since it unblocks the most downstream work (003, 008, 015, 017, 018, 021, 024).",
      tag: "deployment"
    },
    {
      id: 24,
      date: "July 30, 2026",
      title: "ROA-002 interactive walkthrough built",
      body: "Created the environment-variable-management walkthrough as an interactive widget matching the ROA-001 format: verify current state, create `.env.local`, protect it via `.gitignore`/`.env.example`, test, Done-When checklist, and sendPrompt buttons routing to the next tickets.",
      tag: "feature"
    },
    {
      id: 23,
      date: "July 29, 2026",
      title: "Full RLS Re-Verification With Seeded Data",
      body: "All prior impersonation tests on the 10 affected tables were re-run individually (not batched) against real seeded data (one place, one post, a second test user), since the missing grants meant earlier 'passing' tests may have failed for the wrong reason the whole time.",
      tag: "refactor"
    },
    {
      id: 22,
      date: "July 29, 2026",
      title: "Missing Base Table Grants Across 12 Tables",
      body: "Discovered `authenticated` had zero SELECT/INSERT/UPDATE/DELETE grants on `users` and `datasets` — RLS policies were unreachable underneath a permission-denied wall. Generalized the check project-wide and found the same gap on 10 more tables (`blocks`, `comments`, `follows`, `hidden_posts`, `post_photos`, `post_points`, `post_subscriptions`, `posts`, `reactions`, `saves`). Granted correct privileges to each based on intended access.",
      tag: "fixed"
    },
    {
      id: 21,
      date: "July 29, 2026",
      title: "`datasets` Table RLS Policies (ROA-001 closeout)",
      body: "Wrote and verified `datasets_write_admin_only` (admin-gated ALL) and `datasets_select_all` (open read). This was the last blocked item preventing ROA-001 from being marked fully done.",
      tag: "feature"
    },
    {
      id: 20,
      date: "July 29, 2026",
      title: "Leftover Permissive UPDATE Policy on `users`",
      body: "`users_update_own` (no role protection) was still active alongside the correct `users_update_own_not_role` policy. Postgres OR's applicable policies together, so the old one silently permitted client-side self-promotion to admin. Dropped it.",
      tag: "fixed"
    },
    {
      id: 19,
      date: "July 29, 2026",
      title: "Duplicate CHECK Constraint on `users.role`",
      body: "Found two conflicting constraints active on the same column simultaneously (`users_role_check` and stale `users_role_values`), silently blocking the `moderator` value even though the newer constraint allowed it. Dropped the stale one.",
      tag: "fixed"
    },
    {
      id: 18,
      date: "July 29, 2026",
      title: "Admin Role Field (ROA-009)",
      body: "Added a tiered `role` column (`user` / `moderator` / `admin`) to the `users` table with a CHECK constraint. Developer account manually promoted to `admin` via direct SQL, never through client-facing code.",
      tag: "feature"
    },
    {
      id: 17,
      date: "July 28, 2026",
      title: "RLS policies: places, saves",
      body: "`places` fully locked to client writes (SELECT only, verified via failed impersonation INSERT test). `saves` locked to owner, with a soft-delete-aware SELECT filter for post-saves.",
      tag: "feature"
    },
    {
      id: 16,
      date: "July 28, 2026",
      title: "saves table schema migration",
      body: "Replaced polymorphic `item_id` (uuid, no FK) + `item_type` (text) with typed `post_id`/`place_id` foreign keys and a `saves_exactly_one_target` CHECK constraint. Verified table was empty (`COUNT = 0`) before dropping columns.",
      tag: "refactor"
    },
    {
      id: 15,
      date: "July 28, 2026",
      title: "RLS policies: reactions",
      body: "Owner-only write. Self-reaction blocking was initially implemented via trigger, then explicitly reversed per product decision (see Bug Log — not a bug, but treated as a build-then-revert).",
      tag: "feature"
    },
    {
      id: 14,
      date: "July 28, 2026",
      title: "can\\_comment\\_on\\_post() helper function",
      body: "Consolidated two separate `posts` lookups (soft-delete check + block check) inside `comments_insert_own` into one `SECURITY DEFINER`, `STABLE` SQL function.",
      tag: "refactor"
    },
    {
      id: 13,
      date: "July 28, 2026",
      title: "Insert-level block enforcement: comments, follows",
      body: "Extended beyond visibility-only blocking — a blocked user can no longer create a comment or follow request at all, not just have it hidden after the fact.",
      tag: "feature"
    },
    {
      id: 12,
      date: "July 28, 2026",
      title: "Mutual block isolation added to posts, comments, follows",
      body: "Rewrote SELECT policies on all three to exclude content between blocked users in either direction, via `NOT EXISTS` subqueries against `blocks`.",
      tag: "feature"
    },
    {
      id: 11,
      date: "July 28, 2026",
      title: "RLS policies: follows, notifications",
      body: "`follows` public read with self-follow guard; `notifications` private to recipient, no client-facing INSERT (service-role/trigger only).",
      tag: "feature"
    },
    {
      id: 10,
      date: "July 28, 2026",
      title: "RLS policies: posts, comments",
      body: "Public read (soft-delete aware via `deleted_at IS NULL`), owner-only write. Later extended with mutual block-exclusion in SELECT.",
      tag: "feature"
    },
    {
      id: 9,
      date: "July 28, 2026",
      title: "RLS policies: hidden\\_posts, post\\_subscriptions, blocks",
      body: "Direct-ownership pattern, no UPDATE policy (binary state, un-hide/un-block = delete). `blocks` includes a self-block guard (`blocker_id != blocked_id`).",
      tag: "feature"
    },
    {
      id: 8,
      date: "July 28, 2026",
      title: "RLS policies: post\\_points, post\\_photos",
      body: "Ownership enforced via parent-post lookup (`EXISTS` subquery against `posts.user_id`) since neither table has its own `user_id` column. Later extended to check `posts.deleted_at IS NULL` on insert/update.",
      tag: "feature"
    },
    {
      id: 7,
      date: "July 28, 2026",
      title: "RLS policies: users table",
      body: "Wrote and ran SELECT (public) and UPDATE (owner-only) policies for `users`. Discovered mid-session that this table's policy had never actually been executed despite being marked done in a prior handoff — corrected and verified via `pg_policies`.",
      tag: "feature"
    },
    {
      id: 6,
      date: "July 28, 2026",
      title: "ROA-010 closed — Core database schema complete",
      body: "All 14 tables created with correct structure, constraints, and foreign key relationships. PostGIS confirmed. Schema verified. ROA-010 moved to Done.",
      tag: "feature"
    },
    {
      id: 5,
      date: "July 28, 2026",
      title: "Full schema verification completed",
      body: "Ran three confirmation queries against `information_schema.tables`, `information_schema.columns`, and `information_schema.table_constraints`. All 14 tables confirmed present. All named constraints verified. Column types and nullability correct across all tables.",
      tag: "feature"
    },
    {
      id: 4,
      date: "July 28, 2026",
      title: "Remaining 9 tables created",
      body: [
        "Created `comments`, `reactions`, `follows`, `saves`, `blocks`, `hidden_posts`, `post_subscriptions`, `notifications`, and `datasets`.",
        "All include appropriate CHECK constraints, UNIQUE constraints, and foreign key relationships. Reactions locked to upvote/downvote for Phase 1. Follows include self-follow prevention. Blocks include self-block prevention. Saves use polymorphic `item_id` + `item_type` pattern.",
      ],
      tag: "feature"
    },
    {
      id: 3,
      date: "July 28, 2026",
      title: "post\\_points\\_unique\\_order constraint added",
      body: "Added `UNIQUE (post_id, order_index)` to `post_points` as a separate ALTER TABLE after identifying the gap. This prevents two points on the same post from occupying the same slot — the BETWEEN constraint alone was insufficient.",
      tag: "feature"
    },
    {
      id: 2,
      date: "July 28, 2026",
      title: "users and places tables created",
      body: "Created the `users` table with UUID primary key referencing `auth.users(id)`, soft-deletable profile fields, role system with CHECK constraint, and confirmed-age boolean. Created the `places` table with PostGIS `geometry(Point, 4326)` coordinates column, Mapbox-compatible `place_id` deduplication key, heatmap weight, category array, and all counter columns defaulting to 0.",
      tag: "feature"
    },
    {
      id: 1,
      date: "July 28, 2026",
      title: "PostGIS Extension Enabled",
      body: "Enabled the PostGIS extension in Supabase via `CREATE EXTENSION IF NOT EXISTS postgis`. Confirmed active at version 3.3.7 via `pg_extension` verification query. Required first step before any geometry columns could be created.",
      tag: "feature"
    }
  ],

  // ── future: grouped by priority ("high" | "medium" | "low") in FuturePane ─
  // Fields per entry: id, title, priority, body (string/array), mediaItems (optional)
  future: [
    { id: 2, 
      title: "ROA-008 — Auth (Google + Apple + email/password) + public.users trigger",
      priority: "high",  
      body: "`auth.users` gets a row automatically on signup; `public.users` does not — without this trigger, signed-up users have no row in the app's own users table, breaking everything downstream that joins against it (posts, follows, blocks). Also unblocks ROA-003 Phase D, since `/api/auth/login` doesn't exist until this ships."
    },
    { id: 1, 
      title: "Migrate middleware.js → proxy.js/proxy.ts",
      priority: "high",  
      body: "Next.js 16.2.12 logs this as deprecated at every dev server start. Low cost to fix now; becomes actual tech debt if more routes get built against the old convention first. Needs resolving before ROA-003 Phase D is trusted as 'tested against current Next.js behavior.'"
    }
    /*{ id: 2, 
      title: "Skeleton Loading & Tile Routes",
      priority: "high",  
      body: [
        "Needs to be in the codebase to handle high network traffic. Currently, all the data is loaded at once. If a lot of users hit the site at once, it could cause performance issues.",
        "I also need to tile routing (signified by the '#' in url) for users to go back to a character they just searched. When you click the back button on the current build, takes you back to the home page. Tile routing allows for a better user experience and to easily navigate back to characters they just searched for without having to search again."
      ],
      mediaItems: [
        { type: "image", src: "/img/planning-development/skeleton-button-tile-links.png", caption: "Example of skeleton loading states and character tile routing." },
      ]
    },*/
  ],

  // ── Optimizations data ────────────────────────────────────────────────────
  // Cards are grouped by `month` in OptimizePane. Add new months freely —
  // the pane auto-discovers all unique months from this array in order.
  // Put the most recent entries at the top within each month.

  // HOW TO ADD OPTIMIZATIONS (optimize tab):
// Each entry in DATA.optimize needs a `month` field (e.g. "March 2026").
// Cards are grouped by month — all cards sharing the same `month` string
// appear under that month heading. Within a month, cards are shown in the
// order they appear in the array, so put newest first if you want that.
//
// Required fields per entry: id, date, title, month
// Optional fields:           body, bullets, tag, tags, mediaItems
//
// Example:
//   {
//     id: 1,
//     month: "March 2026",
//     date: "Mar 23, 2026",
//     title: "Lazy-loaded Characters page",
//     body: "Reduced initial bundle size.",
//     bullets: ["Cut JS payload by 38kb", "First paint improved by ~200ms"],
//     tags: ["performance", "refactor"],
//   }
// ─────────────────────────────────────────────────────────────────────────────

/*
{
      id: 5,
      month: "February 2026",
      date: "Feb 26, 2026",
      title: "Dynamic API URLs",
      body: "I refactored the SearchBox.jsx component to detect the current page and filter the API accordingly. I also changed the javascript in the backend to have dynamic routing based on the URL. It fetches from the correct collection based on the URL.",
      bullets: [
        "This alone cut memory usage by roughly 20% and, more importantly, made the project scalable and automated",
        "To add a new page with the corresponding API endpoint and route, I simply added a new route to the backend and updated the frontend to detect the current page and filter the API accordingly",
        "No more manual page-building required for each new page — just add the content to the database and the API and frontend will handle the rest!"
      ],
      tags: ["refactor", "performance"]
    },

    {
      id: 1,
      month: "March 2026",
      date: "Mar 23, 2026",
      title: "Example optimization entry",
      body: "Replace this with a real optimization. Bullets are optional — remove the bullets field if not needed.",
      bullets: [
        "First specific improvement made",
        "Second specific improvement made",
        "Third specific improvement made",
      ],
      tag: "performance",
    },
    {
      id: 2,
      month: "March 2026",
      date: "Mar 19, 2026",
      title: "Another March optimization",
      body: "Body text is also optional — a card can have bullets only, body only, or both.",
      tag: "refactor",
    },
*/  

// ── optimize: grouped by `month` in OptimizePane (see full field docs above) ─
// 1 total
   /*
   {
      id: 2,
      month: "July 2026",
      date: "July 26, 2026",
      title: "",
      body: "",
      bullets: [
        "",
        "",
        "",
        ""
      ],
      tags: "refactor"
    }, 
    */
optimize: [
    {
      id: 10,
      month: "August 2026",
      date: "August 04, 2026",
      title: "AWS CLI Install Step: Multi-Method → Single Version Check",
      body: "I initially treated 'install the AWS CLI' as a fixed requirement without questioning whether the runner already had it. That cost two separate failed iterations (apt package missing, then official installer conflicting with a pre-existing install) before I checked what `ubuntu-latest` actually ships with by default.",
      bullets: [
        "Replaced a 4-line curl/unzip/install sequence with a single `aws --version` step",
        "Removed an unnecessary `sudo apt-get update` call that was only there to support the now-removed install step",
        "Net result: one fewer network dependency in the pipeline, one fewer thing that can fail between commits"
      ],
      tags: "refactor"
    }, 
    {
      id: 9,
      month: "August 2026",
      date: "August 03, 2026",
      title: "`saves_select_own`: static bolt-on avoided in favor of live re-evaluation",
      body: "Considered a simpler fix — a stored `is_hidden` flag on `saves`, toggled by a trigger on block/unblock. Rejected: a cached flag needs its own restore-on-unblock mechanism and can go stale. Went with a live check inside the RLS policy instead:",
      bullets: [
        "`is_blocked_either_direction()` re-evaluates on every query, so there's no cached decision to invalidate.",
        "Hidden-while-blocked and restored-on-unblock both fall out of the same mechanism, with no separate 'restore' code path needed.",
        "Trade-off: one extra subquery against `posts` per row read, accepted because `saves` is read relatively rarely compared to `posts` itself, and correctness mattered more than shaving a subquery."
      ],
      tags: "refactor"
    },   
    {
      id: 8,
      month: "August 2026",
      date: "August 03, 2026",
      title: "`follows_select_all`: four-branch OR logic → two function calls",
      body: "Realized the original four-branch `OR` check was really just the same two-person check applied twice (once per participant column on a follow row). Collapsing it to `NOT is_blocked_either_direction(auth.uid(), follower_id) AND NOT is_blocked_either_direction(auth.uid(), following_id)` covers all four original branches with clearer, shorter logic.",
      bullets: [
        "Each function call already internally checks both directions between two people",
        "Applying it once per participant column (`follower_id`, `following_id`) mathematically covers all four original OR branches",
        "Avoids reinventing the function's internal OR logic at the call site"
      ],
      tags: "refactor"
    }, 
    {
      id: 7,
      month: "August 2026",
      date: "August 02, 2026",
      title: "RLS Policy Architecture: Direct `blocks` queries → centralized SECURITY DEFINER function",
      body: "Realized that scattering `EXISTS (SELECT 1 FROM blocks WHERE ...)` logic across every blocking-aware policy was both repetitive and fragile. The same bug (RLS-blocks-RLS) would have to be independently rediscovered and fixed per table. Centralizing the check into one function fixed all three tables' bugs from a single source of truth and makes any future blocking-aware table (like `saves`) a one-line addition instead of a re-derivation.",
      bullets: [
        "Function bypasses `blocks`' RLS internally via `SECURITY DEFINER`, closing the exact hole that caused the original bug",
        "Returns boolean only — no row data ever leaves the function, preserving the 'blocked user gets zero confirmation' privacy requirement",
        "`SET search_path = public` included specifically to close a known privilege-escalation vector for `SECURITY DEFINER` functions"
      ],
      tags: "refactor"
    }, 
    {
      id: 6,
      month: "August 2026",
      date: "August 01, 2026",
      title: "Trigger functions: `place_id` → `id` column reference",
      body: "Realized partway through testing that the trigger functions were built against an assumed column name rather than the verified schema. Once the actual foreign key relationships were checked directly:",
      bullets: [
        "All four functions (`recalc_place_metrics`, `trg_posts_count`, `trg_reactions_count`, `trg_saves_count`) updated to filter `WHERE id = ...` instead of `WHERE place_id = ...`",
        "Confirmed via `information_schema.columns` and a foreign key lookup query before rewriting, rather than guessing again"
      ],
      tags: "refactor"
    },   
    {
      id: 5,
      month: "July 2026",
      date: "July 31, 2026",
      title: "npm Vulnerability Resolution Strategy",
      body: "Initially defaulted toward the 'fix everything' instinct implied by `npm audit fix --force`. Realized mid-session that npm's auto-resolver was proposing a 6-major-version downgrade of `next` to satisfy a transitive `postcss`/`sharp` advisory — which would have silently gutted App Router support. Shifted approach to: read the 'Will install X, which is a breaking change' line before ever running `--force`, and resolve the actual outdated package directly (`npm install next@latest`) instead of trusting the automated resolution path.",
      bullets: [
        "Verified current LTS version via live web search rather than relying on training-data memory, after an earlier session's version-recall error",
        "Distinguished real risk (dev-only tooling vulnerabilities vs. user-facing runtime exposure) rather than chasing a zero-finding `npm audit` output at a pre-launch stage"
      ],
      tags: "refactor"
    },  
    {
      id: 4,
      month: "July 2026",
      date: "July 29, 2026",
      title: "RLS Verification Process: Batched → Isolated Testing",
      body: "I realized running eight impersonation tests in one pasted block was actively hiding information. When the second test threw an error, I couldn't confirm what the first test had actually done, because the SQL editor only surfaces the result of whichever statement executed most recently. A test that 'looked' like it passed might never have been genuinely observed.",
      bullets: [
        "Switched from one large multi-statement paste to one `BEGIN`/test/`ROLLBACK` block run at a time",
        "Every result is now something directly seen, not inferred from what came after it",
        "Applied this consistently across all 7 re-verified tables (`comments`, `follows`, `reactions`, `blocks`, `saves`, `hidden_posts`, `post_subscriptions`)"
      ],
      tags: "refactor"
    },
    {
      id: 3,
      month: "July 2026",
      date: "July 28, 2026",
      title: "saves: eliminate ghost-save risk at the schema level",
      body: "Realized the original `item_id` design pushed a data-integrity guarantee onto the application layer instead of the database, which meant it could silently fail.",
      bullets: [
        "Split `item_id` into `post_id` and `place_id`, each with a real foreign key to its own table",
        "Added `saves_exactly_one_target` CHECK constraint so a row can never reference both or neither",
        "Dropped the now-redundant `item_type` column once the two typed columns made it derivable rather than independently tracked"
      ],
      tags: "refactor"
    }, 
    {
      id: 2,
      month: "July 2026",
      date: "July 28, 2026",
      title: "comments\\_insert\\_own: consolidate duplicate lookups",
      body: "Realized the policy was hitting `posts` twice for the same row — once for the soft-delete check, once inside the block check. Extracted both into a single `SECURITY DEFINER` function:",
      bullets: [
        "`can_comment_on_post(p_post_id, p_commenter_id)` does one lookup against `posts`, returning a single boolean covering both conditions",
        "Policy body simplified to a single function call instead of two inline `EXISTS` subqueries",
        "Traded a small amount of guaranteed speedup (unmeasured, not guaranteed by Postgres's planner) for real maintainability — one source of truth instead of duplicated logic that could drift out of sync"
      ],
      tags: "refactor"
    },  
    {
      id: 1,
      month: "July 2026",
      date: "July 26, 2026",
      title: "post_points: Composite UNIQUE constraint added post-creation",
      body: "I realized that the `order_index BETWEEN 0 AND 4` constraint alone only prevents a sixth point from being inserted, it does nothing to prevent two points on the same post sharing the same slot index. A post with five rows all at `order_index = 0` would pass the BETWEEN check but completely break ordered rendering on the map.",
      bullets: [
        "Added `CONSTRAINT post_points_unique_order UNIQUE (post_id, order_index)` via `ALTER TABLE` after initial table creation",
        "Composite unique means the *combination* of `post_id` and `order_index` must be unique — different posts can share an index value, but the same post cannot have two points at the same position",
        "Two constraints working together: BETWEEN caps the range, UNIQUE prevents collisions within that range",
        "Enforced at the database level — no application code or race condition can bypass it"
      ],
      tags: "refactor"
    }
  ],

  // ── learned: flat list, numbered by array position in LearnedPane ────────
  // Fields per entry: id, topic (title), body (string/array)
  learned: [
    { id: 1, topic: "Correct ticket execution order matters", body: "ROA-010 (schema) must come before ROA-001 (RLS). You cannot write RLS policies on tables that don't exist. The kanban dependency graph exists for a reason, pulling tickets out of order creates work that has to be thrown away." },
    { id: 2, topic: "CREATE EXTENSION IF NOT EXISTS vs CREATE EXTENSION", body: "Without `IF NOT EXISTS`, running `CREATE EXTENSION postgis` on an already-installed extension throws an error and stops script execution. The `IF NOT EXISTS` variant skips silently. It protects the script, not the extension itself." },
    { id: 3, topic: "EPSG 4326 is WGS84 — the coordinate system of the web", body: "`4326` is the EPSG code for WGS84, the coordinate system GPS and every web mapping platform (Mapbox, Google Maps, Leaflet) uses. Storing coordinates in any other system and feeding them to Mapbox causes pins to land in the wrong place or fail to render entirely." },
    { id: 4, topic: "geometry(Point, 4326) over separate lat/lng float columns", body: "Plain float columns cannot support PostGIS spatial queries like `ST_DWithin` for proximity deduplication. With geometry columns you write `ST_DWithin(coordinates, ST_MakePoint(lng, lat)::geography, 20)` and PostGIS handles the math with a GIST index. Roam needs this for the 20-meter community pin deduplication logic." },
    { id: 5, topic: "Supabase does NOT auto-create public profile rows on signup", body: "Supabase auth creates a row in `auth.users` internally, my public `users` table gets nothing automatically. A trigger or server-side function is required to insert the profile row on signup. Missing this means authenticated users have no profile and every join to `users` returns nothing." },
    { id: 6, topic: "Soft delete: NULL means alive, timestamp means dead", body: "`deleted_at IS NULL` = post is alive, show it. `deleted_at IS NOT NULL` = post is deleted, hide it. The row stays in the database either way. Every feed query must include `WHERE deleted_at IS NULL` or deleted content surfaces." },
    { id: 7, topic: "RLS on with zero policies blocks everything", body: "Enabling RLS on a table without writing any policies means nobody can access that table — not even authenticated users. RLS enabled + no policies = total lockout. Always write policies immediately after enabling RLS." },
    { id: 8, topic: "Database constraints are the last line of defense", body: "Application code can have bugs. Direct SQL calls bypass your app entirely. Database-level constraints (CHECK, UNIQUE, FOREIGN KEY) enforce rules regardless of how a write reaches the database. Always enforce critical rules at the database level, not just in code." },
    { id: 9, topic: "Self-referencing foreign keys", body: ["A table can have a foreign key that references itself. `posts.repost_of` references `posts(id)`. This is called a self-referencing foreign key.", "Real-world examples: employees table with `manager_id` referencing the same table, comment threads with `parent_comment_id`."]},
    { id: 10, topic: "ON DELETE SET NULL vs ON DELETE CASCADE — a product decision", body: "`ON DELETE CASCADE` deletes child rows when the parent is deleted. `ON DELETE SET NULL` nullifies the foreign key but keeps the child row. The choice is a product decision: `posts.repost_of` uses SET NULL because a repost is its own piece of content. `notifications.actor_id` uses SET NULL because a notification surviving with a null actor is better UX than silently disappearing." },
    { id: 11, topic: "Polymorphic associations trade referential integrity for flexibility", body: "`saves.item_id` has no foreign key because it references two different tables (`posts` and `places`). Postgres foreign keys point to one table only. The `item_id + item_type` pattern enables this at the cost of losing database-enforced referential integrity — ghost saves (pointing at deleted rows) become a real risk that must be handled at the application layer." },
    { id: 12,
      topic: "CHECK constraint migration pattern in Postgres",
      // Text and code interleaved in one string, fenced with ```sql like markdown.
      // CardBody splits this into paragraph → code block → paragraph automatically.
      body: "I cannot add a value to an existing CHECK constraint. I had to drop and recreate it:\n```sql\nALTER TABLE [table] DROP CONSTRAINT [constraint_name];\nALTER TABLE [table] ADD CONSTRAINT [constraint_name]\n  CHECK ([column] IN (...existing values..., 'new_value'));\n```\nThis applies to `notifications.type` and `users.role` when new values are needed in Phase 2.",
    },
    { id: 13, topic: "RLS policies are bypassed entirely by the service role", body: "Any backend code using the service role key (triggers, Edge Functions, admin scripts) skips RLS checks completely. Rules that must hold universally, like blocking self-reactions, can't live in RLS alone; they need a table-level trigger as a second, unbypassable enforcement layer." },
    { id: 14, topic: "A missing policy for a command is an implicit deny, not an open door", body: " If RLS is enabled on a table and no policy exists for a given command (e.g., no INSERT policy), that command is refused by default for the roles it would otherwise apply to — no explicit 'block' rule is needed, just the absence of a 'grant' rule." },
    { id: 15, topic: "A single column can't hold two different foreign keys", body: "This is *why* the original `saves.item_id` polymorphic design was structurally unable to have real referential integrity, a column can only reference one table. The fix isn't a smarter constraint, it's splitting into multiple typed columns, each with its own FK." },
    { id: 16, topic: "USING vs WITH CHECK serve different moments in a write", body: "`USING` gates which existing rows a caller is even allowed to attempt to touch; `WITH CHECK` gates what the resulting row is allowed to look like after the write. For simple ownership checks they often look identical, but they diverge the moment a policy needs to prevent a user from changing a value they shouldn't be able to (e.g., escalating their own role)." },
    { id: 17, topic: "CHECK constraints can't run subqueries — RLS policies and triggers can", body: "Repeated pattern this session: assuming a policy/column/index from an earlier message was run, when it wasn't (`users`, `follows`, `notifications` column name, near-miss on `saves`). The fix is procedural, not clever — always verify current state via `pg_policies` / `information_schema.columns` / direct catalog lookups before writing code that depends on it, especially before any `DROP`." },
    { id: 18, topic: "Never trust that previously-discussed SQL was actually executed", body: "Repeated pattern this session: assuming a policy/column/index from an earlier message was run, when it wasn't (`users`, `follows`, `notifications` column name, near-miss on `saves`). The fix is procedural, not clever — always verify current state via `pg_policies` / `information_schema.columns` / direct catalog lookups before writing code that depends on it, especially before any `DROP`." },
    { id: 19, topic: "Multiple Postgres CHECK Constraints on One Column Are ALL Enforced Simultaneously", body: "Postgres doesn't let you 'choose' between multiple CHECK constraints on the same column, it enforces every one of them on every write. A duplicate or stale constraint left in place silently narrows what a newer, more permissive constraint would otherwise allow, with no warning that the older one still exists." },
    { id: 20, topic: "Multiple RLS Policies for the Same Command Are OR'd Together", body: "If two UPDATE policies apply to the same row, a user's write succeeds if it satisfies *either* one. A narrowly-written restrictive policy provides zero real protection if an older, more permissive policy covering the same action is still active on the table." },
    { id: 21, topic: "Table-Level GRANTs and Row-Level Security Are Two Separate Gates", body: "Enabling RLS and writing correct policies means nothing if the underlying Postgres role (`authenticated`) was never granted base SELECT/INSERT/UPDATE/DELETE privileges on the table. A request denied at the grant layer produces the same `42501` error code as one denied by an RLS policy — the only way to tell them apart is reading the exact error text (`permission denied for table X` vs. `new row violates row-level security policy for table X`) or checking `information_schema.role_table_grants` directly." },
    { id: 22, topic: "`auth.users` and `public.users` Are Not Automatically Linked", body: "Supabase Auth creating a row in `auth.users` on signup does not create a corresponding row in a custom `public.users` profile table. That link has to be built explicitly, usually via a Postgres trigger. Without it, an authenticated user with no profile row will fail every join that assumes one exists." },
    { id: 23, topic: "A 'Success' Result Only Proves What You Actually Isolated and Watched", body: "Running several test statements in one batched script means an error partway through can hide or overwrite the result of an earlier statement in the same output panel. A clean-looking result at the end of a multi-statement script is not proof every individual statement inside it behaved as expected. Only isolated, one-at-a-time execution gives that proof." },
    { id: 24, topic: "Legacy vs. new Supabase key systems are not interchangeable in how they rotate", body: "The old JWT-based `service_role`/`anon` pair shares one signing secret. Rotating it invalidates both keys and restarts the project, killing connections. The newer `sb_publishable_...` / `sb_secret_...` keys are independently revocable, so a single leaked key can be replaced without touching anything else." },
    { id: 25, topic: "Table-level grants and RLS policies are separate failure layers", body: "A `42501` permission error can mean either 'RLS correctly blocked this' or 'the grant doesn't exist and RLS was never reached'. From prior sessions, I discovered 10+ tables where grants were silently missing despite policies appearing to pass tests." },
    { id: 26, topic: "A flagged-items backlog is a set of tripwires, not a parallel task queue", body: "Every flag in the tracking doc is gated behind a ticket that doesn't exist yet (auth, block/unblock feature, post creation). Checking it for 'what can I do right now' independent of active ticket work produces false leads." },
    { id: 27, topic: "`.tsx` Files Trigger Automatic TypeScript Bootstrapping", body: "Next.js detects the presence of a single `.tsx` file anywhere in the project and automatically installs `@types/react`, generates `tsconfig.json`, and creates `next-env.d.ts` — even in a project that was never intended to use TypeScript. One misnamed file extension can pull an entire toolchain in silently." },
    { id: 28, topic: "`npm audit fix --force` Optimizes for 'a fix,' not 'the right fix'", body: "npm's automated resolver will walk a dependency tree backward to whatever version satisfies the advisory chain, even if that means reverting a core framework by six major versions. The 'Will install X, which is a breaking change' line in the output is the signal to stop and investigate manually rather than trust the tool's proposed path." },
    { id: 29, topic: "`dangerouslySetInnerHTML` Is About Content Origin, Not Content Subject Matter", body: "The API name implies broad danger, but the actual risk model is narrow: it's unsafe for rendering user-submitted content (XSS risk), not for any content that happens to be about sensitive topics like privacy or legal data. A static, developer-authored HTML file, even a privacy policy, carries no additional risk from this API versus any other static content." },
    { id: 30, topic: "JSX and Raw Generator HTML Are Different Syntaxes That Only Look Similar", body: "Termly-style exports use `class` instead of `className`, unclosed void tags (`<br>` instead of `<br />`), string-based inline styles instead of JS style objects, and can contain genuinely malformed nesting that a browser will silently repair but a JSX compiler will hard-fail on. Pasting generator HTML directly into a JSX return statement isn't a stylistic mismatch, it doesn't compile." },
    { id: 31, topic: "Grants and RLS are separate enforcement layers", body: "A `permission denied` error means Postgres never reached the RLS policy, it was blocked earlier at the table-grant level. A clean '0 rows updated' with no error means RLS itself did the blocking. The two look similar from the outside but prove different things; a passing test at one layer doesn't confirm the other layer is also correct." },
    { id: 32, topic: "`CREATE OR REPLACE FUNCTION` succeeding doesn't confirm which version is live", body: "A 'Success' message only means the SQL was syntactically valid — not that it's the version you meant to run, especially mid-session when several corrections happen in quick succession. `SELECT prosrc FROM pg_proc WHERE proname = '...'` checks the actual stored function body against the database, catching mismatches before they surface as a downstream runtime error." },
    { id: 33, topic: "RLS Policies Are Subject to Other Tables' RLS", body: "Any RLS policy that checks another table via a subquery (e.g. `EXISTS (SELECT 1 FROM blocks WHERE ...)`) is itself subject to that other table's RLS. If the referenced table's own policy is narrower than the subquery assumes, the subquery can silently return nothing for the 'wrong' party, even though the outer policy's logic reads correctly on paper. This is a structural gotcha in Postgres RLS, not a typo-class bug, and it's easy to miss because the SQL looks completely correct in isolation." },
    { id: 34, topic: "The Empty-Test Trap Applies to Every New Test, Not Just the First One", body: "A `0 rows` (or otherwise 'expected') impersonation-test result is not proof of anything unless real data was independently confirmed to exist first. This session hit the exact same trap three separate times in a row (posts, comments, follows) even after catching it the first time. Each new table's first-pass test looked like a pass but was actually testing against a user with zero rows in that table." },
    { id: 35, topic: "`FORCE ROW LEVEL SECURITY` and Owner Bypass Are Real, Separate Failure Modes", body: "`relrowsecurity = true` does not mean RLS applies to everyone. Table owners and superusers bypass RLS entirely unless `relforcerowsecurity` is also set to true. This was investigated and ruled out as the cause of the blocking bug in this session, but it's a real thing worth checking whenever an impersonation test's result seems inconsistent with the policy text." },
    { id: 36, topic: "Composite Indexes Only Serve Leftmost-Column Lookups", body: "A composite index like `blocks_unique_pair` on `(blocker_id, blocked_id)` efficiently serves lookups filtering on `blocker_id` (the leftmost column) but does not efficiently serve lookups filtering on `blocked_id` alone. This was previously assumed to be 'covered' in an earlier session and was corrected this session by checking actual query patterns against the real index definition." },
    { id: 37, topic: "A 'Success' message from Supabase's SQL editor does not mean rows were affected", body: "`INSERT`/`UPDATE`/`DELETE` statements report 'Success. No rows returned' even when the `WHERE` clause matches nothing. This is indistinguishable from a real success unless followed by a direct `SELECT` confirming the actual state change. This directly caused the false-positive restore-on-unblock result in this session. A `DELETE` against `blocks` silently affected 0 rows, and the test that followed appeared to pass for an unrelated reason." },
    { id: 38, topic: "An 'expected' empty test result proves nothing without confirming real data existed first", body: "Recurring pattern across this project: an impersonation test returning 0 rows looks identical whether the policy correctly blocked access, or whether there was never any data for it to find in the first place. Always run a plain `count(*)` check before trusting either outcome of an impersonation test." },
    { id: 39, topic: "Live re-evaluation vs. cached state changes what 'restore' logic requires", body: "A policy that recomputes a boolean condition (like blocking status) on every query never needs explicit 'undo' logic when the underlying condition changes, the next read is simply correct. Cached/denormalized state (a stored flag, a materialized column) always needs a second, explicit mechanism to stay in sync. Worth checking which category any future flag or permission check falls into before assuming a fix is complete." },
    { id: 40, topic: "GitHub Runners Are IPv4-Only for Egress", body: "GitHub Actions hosted runners cannot make outbound IPv6 connections. Any external service whose 'direct' connection resolves IPv6-only (as Supabase's direct DB connection can) will fail from CI even though it works fine locally or from an IPv6-capable network. The fix is almost always a documented IPv4-compatible alternative (here, Supabase's Transaction Pooler)." },
    { id: 41, topic: "A Green Checkmark Only Proves the Shell Exited 0 — Not That the Output Is Correct", body: "A pipe like `supabase db dump ... > backup.sql` can fail mid-stream (auth expiry, network blip, wrong flag) while the outer shell still reports success, because the failure happens inside the redirected command, not at the top level. The only way to actually know the output is good is to inspect the artifact directly — file size, content, row counts — not the job's pass/fail status." },
    { id: 42, topic: "`supabase db dump` Defaults to Schema-Only", body: "Without `--data-only` (or an equivalent explicit flag), Supabase's CLI dump command backs up structure — tables, indexes, triggers, functions — but not row data. This is easy to miss because the dump file is large, looks complete, and every `CREATE TABLE` statement runs successfully; the absence is a missing category of statement (`COPY ... FROM stdin`), not an error." },
    { id: 43, topic: "GitHub Actions Executes the Workflow File Version Live at Trigger Time", body: "A workflow run uses whichever version of the `.yml` file existed in the repo at the moment it was triggered, not whatever is currently committed. Re-running an old failed job, or triggering before a push finishes landing, replays the old (broken) version and can look identical to a fresh bug. Always check the run's timestamp against the relevant commit before debugging further." },
    { id: 44, topic: "RLS Subqueries Are Themselves Subject to RLS", body: "When one table's RLS policy checks another table via `EXISTS (SELECT 1 FROM other_table WHERE ...)`, that subquery is evaluated under the querying user's row-level security on `other_table` too. A narrow policy on the referenced table (e.g., only exposing rows where you're the owner) can silently make the subquery return nothing for the 'wrong' party, even though the outer policy's logic is written correctly. The fix is a `SECURITY DEFINER` function that bypasses RLS for just the boolean check, without exposing the underlying row." },
    { id: 45, topic: "Postgres.app's CLI Tools Are Not on PATH by Default", body: "Postgres.app installs `psql`, `createdb`, `pg_restore`, etc. inside its own `.app` bundle rather than a standard system bin directory. Any terminal session started before this is configured (via `/etc/paths.d/` or similar) will not find these commands, even though the server itself is running and reachable." },
    //{ id: 10, topic: "", body: "" },
  ],

  // ── bugs: flat list, status drives the open/fixed counts in BugsPane ─────
  // Fields per entry: id, title, status ("fixed" | "open" | anything else →
  // shown as "investigating"), date (optional), body
  /* 
    { 
      id: 2, 
      title: "", 
      status: "fixed", 
      date: "Mar 25, 2026", 
      body: [
        "",
        "",
        ""
      ] 
    },
  */
  bugs: [
    { 
      id: 19, 
      title: "`createdb: command not found` on Local Machine", 
      status: "fixed", 
      date: "August 04, 2026", 
      body: [
        "**Symptom:** running `createdb roam_restore_test` in Terminal returned `command not found`, despite Postgres.app showing the server as Running.",
        "**Root cause:** Postgres.app's CLI binaries are bundled inside the app package, not linked into the shell's default PATH.",
        "**Fix:** created `/etc/paths.d/postgresapp` containing the app's bin path, fully quit and reopened Terminal to force a fresh PATH read, confirmed via `which createdb`."
      ] 
    },
    { 
      id: 18, 
      title: "AWS CLI Install Step Failing (Two Sequential Errors)", 
      status: "fixed", 
      date: "August 04, 2026", 
      body: [
        "**Symptom 1:** `E: Package 'awscli' has no installation candidate`, exit code 100 — Ubuntu `noble` no longer carries `awscli` in its default apt repos.",
        "**Symptom 2:** (after switching to the official curl-based installer): `Found preexisting AWS CLI installation... rerun with --update`, exit code 1. `ubuntu-latest` already ships AWS CLI pre-installed, and the fresh installer refused to overwrite it.",
        "**Fix:** removed the install step entirely, replaced with a single `aws --version` check to confirm the pre-installed CLI is present and usable."
      ] 
    },
    { 
      id: 17, 
      title: "Backup Job Failing at Dump Step — Network Unreachable", 
      status: "fixed", 
      date: "August 04, 2026", 
      body: [
        "**Symptom:** `pg_dump: error: connection ... failed: Network is unreachable`, followed by Supabase CLI's own diagnostic noting IPv6 is required for direct connections.",
        "**Root cause:** GitHub-hosted runners have no IPv6 egress; the direct Supabase connection string resolves to an IPv6 address only.",
        "**Fix:** replaced `SUPABASE_DB_URL` secret value with the Transaction Pooler connection string (IPv4-compatible, different port)."
      ] 
    },
    { 
      id: 16, 
      title: "Git Push Rejected on Workflow File", 
      status: "fixed", 
      date: "August 04, 2026", 
      body: [
        "**Symptom:** `git push` returned `! [remote rejected] main -> main (refusing to allow a Personal Access Token to create or update workflow .github/workflows/db-backup.yml without workflow scope)`.",
        "**Root cause:** the cached PAT lacked the `workflow` OAuth scope, which GitHub requires specifically for pushes touching `.github/workflows/`, regardless of the token's other repo permissions.",
        "**Fix:** regenerated a classic PAT with `workflow` checked alongside `repo`, re-authenticated, push succeeded."
      ] 
    },
    { 
      id: 15, 
      title: "False-positive proof of 'restore visibility on unblock' for `saves`", 
      status: "fixed", 
      date: "August 03, 2026", 
      body: [
        "**Symptom:** An impersonation test after 'unblocking' two test users showed `visible_saves = 1`, taken as proof the restore-on-unblock behavior worked.",
        "**Root cause:** The `DELETE FROM blocks` statement that was supposed to remove the block matched 0 rows and did nothing, the block row was still present the entire time. A direct `SELECT * FROM blocks WHERE ...` afterward showed the original row, same `id`, still there. The passing test result had nothing to do with unblocking; it was measured under conditions nobody had actually verified.",
        "**Fix:** Ran the `DELETE` again, confirmed via a direct `SELECT` that the row was genuinely gone (`0 rows`), then re-ran the impersonation test. It correctly returned `visible_saves = 1` this time, with the unblocked state independently verified beforehand. Added a permanent verification rule (see What I Learned #01) so this class of false positive can't recur silently."
      ] 
    },
    { 
      id: 14, 
      title: "`blocks.blocked_id` had no dedicated index despite being queried standalone", 
      status: "fixed", 
      date: "August 03, 2026", 
      body: [
        "**Symptom:** none yet in production. Caught proactively during ROA-012 by reading the actual ROA-001 policy SQL instead of trusting an earlier session's assumption that `blocks_unique_pair` already covered this.",
        "**Root cause:** the composite unique index on `(blocker_id, blocked_id)` only serves `blocker_id`-first lookups; `blocked_id` was being queried standalone in OR branches across multiple tables' RLS policies.",
        "**Fix:** added `idx_blocks_blocked_id`, verified present via `pg_indexes` and the Supabase dashboard.",
      ] 
    },
    { 
      id: 13, 
      title: "Blocked users could still see the blocking user's posts, comments, and follow relationships", 
      status: "fixed", 
      date: "August 02, 2026", 
      body: [
        "**Symptom:** an impersonation test as the blocked user (User B) against the blocking user's (User A) posts returned 1 row instead of the expected 0, mutual isolation only worked in one direction.", 
        "**Root cause:** `blocks_select_own`'s policy only exposed rows where the current user was the `blocker_id`, so `EXISTS` subqueries in `posts`/`comments`/`follows` policies checking `blocks` from the blocked party's session could never see the relevant row.",
        "**Fix:** built `is_blocked_either_direction()` as a `SECURITY DEFINER` function to bypass this RLS layer internally, then rewrote all three affected policies to call it. Verified fixed on all three tables using the exact impersonation tests that originally caught the bug.",
      ] 
    },
    { 
      id: 12, 
      title: "Trigger functions silently running an old, incorrect body", 
      status: "fixed", 
      date: "August 01, 2026", 
      body: [
        "**Symptom:** three separate times, a corrected `CREATE OR REPLACE FUNCTION` reported success, but the next `INSERT`/`DELETE` test threw `operator does not exist: text = uuid`, pointing at the old `WHERE place_id = ...` logic still being live.", 
        "**Root cause:** `places.place_id` (text) and `places.id` (uuid) were being confused as the same column. The corrected function body hadn't actually been the last one executed before the test ran.",
        "**Fix:** re-ran the corrected `CREATE OR REPLACE FUNCTION` block in isolation for each of the three functions, confirmed via direct schema inspection which column was correct, and adopted the `pg_proc` verification habit going forward to catch this before testing instead of after.",
      ] 
    },
    { 
      id: 11, 
      title: "React Hydration Mismatch on `/terms` Route", 
      status: "fixed", 
      date: "July 31, 2026", 
      body: [
        "**Symptom:** console warning on page load reading 'A tree hydrated but some attributes of the server rendered HTML didn't match the client properties,' pointing at the `dangerouslySetInnerHTML` prop on the Terms component.", 
        "**Root cause:** confirmed via direct file inspection: malformed nesting in the raw Termly export (e.g., unclosed `<strong>` wrapping an `<h1>`, mismatched `<bdt>` tags) parsed inconsistently between server-render and client-hydration passes."
      ] 
    },
    { 
      id: 10, 
      title: "`npm audit --force` Proposing Major Framework Downgrade", 
      status: "fixed", 
      date: "July 31, 2026", 
      body: [
        "**Symptom:** running `npm audit fix --force` offered to resolve `postcss` and `sharp` advisories by installing `next@9.3.3` — a 2020-era release predating App Router entirely.",
        "**Root cause:** the vulnerable packages were buried deep in `next`'s own transitive dependency tree, and npm's resolver found the oldest compatible version rather than the correct upstream fix.",
        "**Fix:** avoided `--force`, ran `npm install next@latest` directly instead, verified against live search that 16.2.12 is genuinely current (not a stale/broken tag).",
      ] 
    },
    { 
      id: 9, 
      title: "Stray TypeScript Scaffolding in JSX Project", 
      status: "fixed", 
      date: "July 31, 2026", 
      body: [
        "**Symptom:** `npm install` output showed `@types/react` being auto-installed and a message reading 'We detected TypeScript in your project and created a tsconfig.json file for you,' despite the project being JSX-only.", 
        "**Root cause:** an incorrectly named `page.tsx` file (introduced via an earlier walkthrough error) triggered Next.js's automatic TypeScript detection.",
        "**Fix:** deleted `page.tsx`, `tsconfig.json`, uninstalled `@types/react`, and manually located and removed the also-auto-generated `next-env.d.ts`.",
      ] 
    },
    { 
      id: 8, 
      title: "Same Missing-Grant Pattern Found on 10 Additional Tables", 
      status: "fixed", 
      date: "July 29, 2026", 
      body: [
        "**Symptom:** the `users`/`datasets` grant gap raised the question of whether other tables had the same issue.", 
        "**Root cause:** a project-wide `information_schema.role_table_grants` query confirmed `blocks`, `comments`, `follows`, `hidden_posts`, `post_photos`, `post_points`, `post_subscriptions`, `posts`, `reactions`, and `saves` all had the identical gap. Which meant that prior sessions' 'passed' RLS tests on these tables may never have reached the policy layer at all.",
        "**Fix:** granted correct privileges per table (full CRUD for owned-content tables, SELECT-only for `notifications` and `places` per existing product decisions), then re-verified every table's ownership boundaries individually with real seeded data.",
      ] 
    },
    { 
      id: 7, 
      title: "`42501: permission denied for table users` During RLS Testing", 
      status: "fixed", 
      date: "July 29, 2026", 
      body: [
        "**Symptom:** an impersonation test expected to be blocked by RLS instead failed with a raw permission error before RLS logic ever ran.", 
        "**Root cause:** the `authenticated` Postgres role had never been granted base SELECT/UPDATE privileges on `users`, only `TRIGGER`, `REFERENCES`, and `TRUNCATE` were present.",
        "**Fix:** ran `GRANT SELECT, UPDATE ON public.users TO authenticated;`, re-tested, and confirmed the failure then correctly came from RLS instead.",
      ] 
    },
    { 
      id: 6, 
      title: "Client-Side Self-Promotion to Admin Was Possible", 
      status: "fixed", 
      date: "July 29, 2026", 
      body: [
        "**Symptom:** a correctly-written role-protection policy (`users_update_own_not_role`) existed, but self-promotion should have been tested as still open.", 
        "**Root cause:** an older, unrestricted UPDATE policy (`users_update_own`) was still active on the same table, and Postgres OR's all applicable policies together. The permissive one silently overrode the restrictive one.",
        "**Fix:** dropped `users_update_own`, leaving only the role-protected policy.",
      ] 
    },
    { 
      id: 5, 
      title: "Duplicate `users.role` CHECK Constraint Blocking `moderator`", 
      status: "fixed", 
      date: "July 29, 2026", 
      body: [
        "**Symptom:** adding `'moderator'` to the role constraint appeared to succeed, but a second, older constraint (`users_role_values`, two-value only) was still silently active on the same column.", 
        "**Root cause:** Postgres enforces all CHECK constraints on a column at once — the older one was never dropped when the newer one was added in an earlier session.",
        "**Fix:** identified both constraints via `pg_constraint`, dropped `users_role_values`, kept `users_role_check`.",
      ] 
    },
    { 
      id: 4, 
      title: "datasets policy: assumed is_admin column that doesn't exist", 
      status: "fixed", 
      date: "July 28, 2026", 
      body: [
        "**Symptom:** policy drafted referencing `users.is_admin`, a column that was never built.", 
        "**Root cause:** guessed a column name matching a common pattern instead of checking the real schema, same category of mistake as the notifications bug. Caught *before* running (not after, this time) via a schema check that showed the real column is `users.role`, currently unconstrained.",
        "**Fix:** not yet applied — policy correctly held back, flagged as blocked on ROA-009 rather than run against a guessed column.",
      ] 
    },
    { 
      id: 3, 
      title: "notifications: wrong column name (recipient\\_id vs user\\_id)", 
      status: "fixed", 
      date: "July 28, 2026", 
      body: [
        "**Symptom:** `ERROR 42703: column 'recipient_id' does not exist` when running the notifications policy set.", 
        "**Root cause:** assumed a column name instead of verifying the real schema.",
        "**Fix:** queried `information_schema.columns`, found the real column was `user_id`, rewrote all three policies using the correct name."
      ] 
    },
    { id: 2, 
      title: "users RLS policy: enabled but zero policies (locked to nobody)", 
      status: "fixed", 
      date: "July 28, 2026", 
      body: [
        "**Symptom:** `rowsecurity = true` on `users`, but `pg_policies` returned 0 rows — meaning the table was inaccessible to everyone.", 
        "**Root cause:** the session-1 handoff had marked this table's RLS SQL as 'written' and was mistakenly treated as 'executed' without verification.",
        "**Fix:** ran the actual `CREATE POLICY` statements for `users_select_all` and `users_update_own`, then confirmed via `pg_policies`."
      ] 
    },
    { 
      id: 1, 
      title: "follows table: only 1 of 3 required policies existed", 
      status: "fixed", 
      date: "July 28, 2026", 
      body: [
        "**Symptom:** after adding the block-aware `follows_select_all`, `follows_insert_own` and `follows_delete_own` were assumed to already exist and hadn't been run — meaning follow/unfollow was completely non-functional.", 
        "**Root cause:** same as above, assumed-executed SQL that wasn't.",
        "**Fix:** ran both missing policies, verified 3 total rows in `pg_policies` for `follows`."
      ] 
    }
  ],

  // ── stack: tile grid in StackPane, not card-based (no body/bullets/media) ─
  // Fields per entry: id, name, icon, version (optional), role (optional)
  stack: [
    { id: 1, name: "React 19",     icon: "⚛️", version: "^19.2.4",   role: "Frontend UI library" },
    { id: 2, name: "Next.js",      icon: "🔼", version: "^16.2.12",  role: "Full-stack React framework" },
    { id: 3, name: "Tailwind v4",  icon: "🎨", version: "^4.2.4",    role: "Utility-first styling" },
    { id: 4, name: "Mapbox GL JS", icon: "📍", version: "^3.28.1",   role: "Interactive client-side maps" },
    { id: 5, name: "react-map-gl",      icon: "🗺️", version: "^8.1.1",    role: "React wrapper for Mapbox GL" },
    { id: 6, name: "Turf.js",           icon: "📐", version: "^7.3.5",    role: "Client-side geospatial analysis" },
    { id: 7, name: "shadcn/ui",         icon: "🧩", version: "4.16.x",   role: "Accessible unstyled components" },
    { id: 8, name: "TanStack Query",    icon: "🔄", version: "^5.100.6",   role: "Client-side state & caching" },
    { id: 9, name: "Supabase",     icon: "⚡", version: "^2.112.2",   role: "Backend-as-a-Service (BaaS)" },
    { id: 10, name: "PostgreSQL",   icon: "🐘", version: "^18.4.0",   role: "Relational database engine" },
    { id: 11, name: "PostGIS",      icon: "🗺️", version: "^3.3.7",    role: "Spatial database extension" },
    { id: 12, name: "Cloudflare R2",    icon: "📦", version: "S3 API Compatible", role: "S3-compatible object storage for database backups" },
    { id: 13, name: "AWS CLI",          icon: "💻", version: "^2 (Pre-installed)", role: "S3 client used for backup orchestration" },
    { id: 14, name: "Vercel",       icon: "☁️", version: "Hosting",   role: "Deployment platform" },

    // { id: 6, name: "MongoDB",      icon: "🍃", version: "Atlas",    role: "NoSQL database" },
  ],

  // ── snippets: flat list, lang shown once as a meta badge (see SnippetsPane) ─
  // Fields per entry: id, title, lang, body (string/array, optional), code
  snippets: [
    {
      id: 1,
      title: "Vercel Build Command",
      lang: "bash",
      body: "Zero-config build — Vercel natively detects the root Next.js project framework configuration.",
      code: "next build",
    },
    {
      id: 2,
      title: "Enable PostGIS Extension",
      lang: "sql",
      body: " Run once per Supabase project before creating any geometry columns. Safe to re-run — `IF NOT EXISTS` prevents errors if already installed.",
      code: `CREATE EXTENSION IF NOT EXISTS postgis;\nSELECT extname, extversion\nFROM pg_extension\nWHERE extname = 'postgis';`,
    },
    {
      id: 3,
      title: "Verify all tables exist",
      lang: "sql",
      body: "Run after completing schema creation to confirm all 14 tables are present in the public schema.",
      code: `SELECT table_name\nFROM information_schema.tables\nWHERE table_schema = 'public'\nORDER BY table_name;`,
    },
    {
      id: 4,
      title: "Verify all columns across all tables",
      lang: "sql",
      body: "Spot-check: `places.coordinates` should show `USER-DEFINED`, array columns should show `ARRAY`, `posts.deleted_at` should show `is_nullable = YES`.",
      code: `SELECT table_name, column_name, data_type, is_nullable, column_default\nFROM information_schema.columns\nWHERE table_schema = 'public'\nORDER BY table_name, ordinal_position;`,
    },
    /*{
      id: 2,
      title: "Express Static Serve (Vite build)",
      lang: "js",
      body: "Serve the Vite dist folder from Express. Must come after all API routes.",
      code: `import path from 'path';\nimport { fileURLToPath } from 'url';\n\nconst __dirname = path.dirname(fileURLToPath(import.meta.url));\n\napp.use(express.static(path.join(__dirname, 'react-frontend/dist')));\n\napp.get('*', (req, res) => {\n  res.sendFile(path.join(__dirname, 'react-frontend/dist/index.html'));\n});`,
    },
    {
      id: 2,
      title: "Express Static Serve (Vite build)",
      lang: "js",
      body: "Serve the Vite dist folder from Express. Must come after all API routes.",
      code: `import path from 'path';\nimport { fileURLToPath } from 'url';\n\nconst __dirname = path.dirname(fileURLToPath(import.meta.url));\n\napp.use(express.static(path.join(__dirname, 'react-frontend/dist')));\n\napp.get('*', (req, res) => {\n  res.sendFile(path.join(__dirname, 'react-frontend/dist/index.html'));\n});`,
    },
    {
      id: 2,
      title: "Express Static Serve (Vite build)",
      lang: "js",
      body: "Serve the Vite dist folder from Express. Must come after all API routes.",
      code: `import path from 'path';\nimport { fileURLToPath } from 'url';\n\nconst __dirname = path.dirname(fileURLToPath(import.meta.url));\n\napp.use(express.static(path.join(__dirname, 'react-frontend/dist')));\n\napp.get('*', (req, res) => {\n  res.sendFile(path.join(__dirname, 'react-frontend/dist/index.html'));\n});`,
    },
    {
      id: 2,
      title: "Express Static Serve (Vite build)",
      lang: "js",
      body: "Serve the Vite dist folder from Express. Must come after all API routes.",
      code: `import path from 'path';\nimport { fileURLToPath } from 'url';\n\nconst __dirname = path.dirname(fileURLToPath(import.meta.url));\n\napp.use(express.static(path.join(__dirname, 'react-frontend/dist')));\n\napp.get('*', (req, res) => {\n  res.sendFile(path.join(__dirname, 'react-frontend/dist/index.html'));\n});`,
    },
    {
      id: 2,
      title: "Express Static Serve (Vite build)",
      lang: "js",
      body: "Serve the Vite dist folder from Express. Must come after all API routes.",
      code: `import path from 'path';\nimport { fileURLToPath } from 'url';\n\nconst __dirname = path.dirname(fileURLToPath(import.meta.url));\n\napp.use(express.static(path.join(__dirname, 'react-frontend/dist')));\n\napp.get('*', (req, res) => {\n  res.sendFile(path.join(__dirname, 'react-frontend/dist/index.html'));\n});`,
    },
    {
      id: 2,
      title: "Express Static Serve (Vite build)",
      lang: "js",
      body: "Serve the Vite dist folder from Express. Must come after all API routes.",
      code: `import path from 'path';\nimport { fileURLToPath } from 'url';\n\nconst __dirname = path.dirname(fileURLToPath(import.meta.url));\n\napp.use(express.static(path.join(__dirname, 'react-frontend/dist')));\n\napp.get('*', (req, res) => {\n  res.sendFile(path.join(__dirname, 'react-frontend/dist/index.html'));\n});`,
    },*/
  ],

  // ── resources: flat list; title becomes a link when `url` is set ─────────
  // Fields per entry: id, title, url (optional — plain text if omitted),
  // category, note (used as the card body, not `body`)

  resources: [
    { id: 1, title: "npm audit Documentation", url: "https://docs.npmjs.com/cli/v8/commands/npm-audit", category: "security & vulnerability remediation",    note: "Referenced conceptually while diagnosing the `next@9.3.3` false-positive downgrade path. Covers how `npm audit fix --force` resolves transitive dependency chains and why 'breaking change' warnings should be read before accepting a proposed fix." },
    { id: 2, title: "Tailwind CSS v4 Docs", url: "https://tailwindcss.com/docs", category: "styling",    note: "v4 uses @theme in CSS instead of tailwind.config.js." },
    { id: 3, title: "Supabase Docs", url: "https://supabase.com/docs", category: "backend",    note: "Full documentation for Supabase database, auth, storage, RLS, and JavaScript client. Primary reference for all backend work on Roam." },
    { id: 4, title: "Supabase RLS Guide", url: "https://supabase.com/docs/guides/database/postgres/row-level-security", category: "styling",    note: "Row Level Security concepts, USING vs WITH CHECK distinction, policy creation patterns, and testing approaches." },
    { id: 5, title: "Supabase Auth Guide", url: "https://supabase.com/docs/guides/auth", category: "auth",    note: "Session management, user management, OAuth providers, and auth hooks." },
    { id: 6, title: "Supabase PostGIS Guide", url: "https://supabase.com/docs/guides/database/extensions/postgis", category: "database",    note: "PostGIS extension setup, geometry column types, spatial query functions, and GIST indexing. Reference for all coordinate and proximity query work." },
    { id: 7, title: "Supabase JavaScript Client Reference", url: "https://supabase.com/docs/reference/javascript/introduction", category: "backend",    note: "Complete API reference for the Supabase JS client. Every Supabase query written in Next.js uses this reference for syntax." },
    { id: 8, title: "Supabase CLI — `db dump` Reference", url: "https://supabase.com/docs/reference/cli/introduction", category: "deployment",    note: "Covers the full flag set for `supabase db dump`, including `--data-only`, `--schema-only` (the current default behavior), and connection string requirements." },
    { id: 9, title: "Cloudflare R2 — S3 Compatibility API", url: "https://developers.cloudflare.com/r2/api/s3/api/", category: "database",    note: "Documents R2's S3-compatible endpoint structure and authentication, needed for pointing the AWS CLI at R2 instead of actual AWS S3 (`--endpoint-url` usage)." },

    // { id: 4, title: "Tailwind CSS v4 Docs", url: "https://tailwindcss.com/docs", category: "styling",    note: "v4 uses @theme in CSS instead of tailwind.config.js." },
  ],
};

// ─── Style maps ───────────────────────────────────────────────────────────────
const TAG_STYLES = {
  // ── deployment: pushed off cyan toward a deeper, more saturated blue so it
  // reads distinctly from feature's cyan while still popping against the bg.
  deployment:  { bg: "rgba(47,111,255,0.12)", color: "#2f6fff", border: "rgba(47,111,255,0.3)" },
  feature:     { bg: "rgba(34,211,238,0.1)",  color: "#22d3ee", border: "rgba(34,211,238,0.25)" },
  fix:         { bg: "rgba(255,201,60,0.1)",  color: "#ffc93c", border: "rgba(255,201,60,0.25)" },
  // ── fixed: explicit entry so it stops silently falling back to
  // TAG_STYLES.feature — pairs with the red "open" status in the Bug Log.
  fixed:       { bg: "rgba(0,229,160,0.1)",   color: "#00e5a0", border: "rgba(0,229,160,0.25)" },
  refactor:    { bg: "rgba(167,139,250,0.1)", color: "#a78bfa", border: "rgba(167,139,250,0.25)" },
  // ── performance: lightened toward near-white so it's actually legible —
  // previous slate was too close to bg/muted text to register as a tag.
  performance: { bg: "rgba(221,226,234,0.14)", color: "#dde2ea", border: "rgba(221,226,234,0.4)" },
};

const PRIORITY_STYLES = {
  high:   { color: "#ff4d6a", label: "▲ High priority" },
  medium: { color: "#ffc93c", label: "◆ Medium priority" },
  low:    { color: "#00e5a0", label: "● Low priority" },
};

// ─── Tags helper ──────────────────────────────────────────────────────────────
// Replaces the old single-value Tag component.
// Accepts `tag` (string) and/or `tags` (array of strings) — both are normalised
// into one deduplicated list and rendered as individual badge spans.
//
// To cap the number of displayed tags, change the comment line below:
//   tagList.map(...)        → no cap (default)
//   tagList.slice(0, 2).map → show at most 2 tags
//   tagList.slice(0, 3).map → show at most 3 tags
const Tags = ({ tag, tags }) => {
  // Normalise: merge singular `tag` and plural `tags` into one flat array,
  // then deduplicate so the same label never appears twice on a card.
  const tagList = [
    ...(tags ? (Array.isArray(tags) ? tags : [tags]) : []),
    ...(tag  ? (Array.isArray(tag)  ? tag  : [tag])  : []),
  ].filter((v, i, arr) => arr.indexOf(v) === i); // deduplicate

  if (tagList.length === 0) return null;

  // Remove or replace `.slice(0, N)` below to set a maximum tag display count.
  // Default: no cap — all tags in the array are shown.
  return (
    <>
      {tagList.map((t) => {
        // Neutral fallback instead of TAG_STYLES.feature — an unmapped tag
        // silently inheriting feature's color is exactly how fixed/feature
        // collided in the first place.
        const s = TAG_STYLES[t] || { bg: "rgba(221,226,234,0.14)", color: "#dde2ea", border: "rgba(221,226,234,0.4)" };
        return (
          <span key={t} className="dn-tag" style={{ background: s.bg, color: s.color, borderColor: s.border }}>
            {t}
          </span>
        );
      })}
    </>
  );
};

// ─── CardBody helper ──────────────────────────────────────────────────────────
// New helper that handles both single-string and array-of-strings body.
// If body is a string → renders one .dn-card-body paragraph (same as before).
// If body is an array → renders each string as its own .dn-card-body paragraph
// with natural spacing between them (handled by the gap on .dn-card-body + margin-top).

// Handles all content formats for the `body` field on a card:
//
// 1) String — single paragraph (unchanged from before):
//      body: "This is one paragraph."
//
// 2) Array of strings — multiple paragraphs:
//      body: ["First paragraph.", "Second paragraph."]
//
// 3) Mixed array — paragraphs and bullet lists in any order:
//      body: [
//        "Intro paragraph.",
//        { bullets: ["Point one", "Point two"] },
//        "Closing paragraph.",
//        { bullets: [
//            "Another point",
//            { text: "Nested point", children: ["Sub-detail"] },
//          ]
//        },
//      ]
//
// When a `{ bullets: [...] }` object appears in the array, it renders using
// the same CardBullets component (same nested levels, same CSS markers).
// The standalone `bullets` field on the card data still works exactly as
// before — this just adds the option to embed bullets inside `body` too.
// ─── parseBodySegments helper ─────────────────────────────────────────────────
// Scans a single body string for markdown-style fenced code blocks
// (```lang\n...code...\n```) and splits it into an ordered list of segments:
//   { type: 'text', value }              — rendered as a paragraph
//   { type: 'code', value, lang }        — rendered as a code block
// This is what lets `body` mix prose and code seamlessly in one string instead
// of needing a separate `code` field disconnected from the surrounding text.
// Text segments are trimmed and dropped if empty (e.g. two fences back-to-back
// with no prose between them), so nothing renders as a blank paragraph.
const parseBodySegments = (text) => {
  const FENCE = /```(\w*)\n([\s\S]*?)```/g;
  const segments = [];
  let lastIndex = 0;
  let match;

  while ((match = FENCE.exec(text)) !== null) {
    const [full, lang, code] = match;
    const before = text.slice(lastIndex, match.index).trim();
    if (before) segments.push({ type: 'text', value: before });
    segments.push({ type: 'code', value: code.replace(/\n$/, ''), lang: lang || null });
    lastIndex = match.index + full.length;
  }

  const rest = text.slice(lastIndex).trim();
  if (rest) segments.push({ type: 'text', value: rest });

  // No fences at all — whole string is just one paragraph
  if (segments.length === 0 && text.trim()) {
    segments.push({ type: 'text', value: text.trim() });
  }

  return segments;
};

// ─── parseInlineSegments / InlineText helpers ──────────────────────────────────
// Handles single-backtick inline code spans (`like_this`) inside plain prose —
// as opposed to the ```fenced``` blocks parseBodySegments/CardCode handle above.
// These render as small <code> chips (.dn-inline-code, see devlog.css) instead
// of showing the literal backtick characters, which is what was happening
// anywhere a card's body/bullet text used single backticks for things like
// table or column names.
//
// A backtick can be escaped with a backslash (\`) to render as a literal `
// character instead of opening/closing a code span, for the rare case that's
// needed. Any text that isn't wrapped in backticks is left completely as-is.
const parseInlineSegments = (text) => {
  const ESCAPE_TOKEN = '\u0000'; // placeholder while splitting, restored below
  const protectedText = text.replace(/\\`/g, ESCAPE_TOKEN);
  const parts = protectedText.split(/`([^`]+)`/g);
  // String.split with a capturing group alternates [text, code, text, code, ...]
  return parts
    .map((value, i) => ({
      type: i % 2 === 1 ? 'inline-code' : 'text',
      value: value.replace(new RegExp(ESCAPE_TOKEN, 'g'), '`'),
    }))
    .filter((seg) => seg.value !== '');
};

// ─── parseFormatSegments helper (REWRITTEN — single-pass, no regex) ────────
// Handles emphasis markup inside prose text: **bold**, *italic* / _italic_,
// ++underline++, ~~strikethrough~~, and nested combinations of all of them.
// Only runs on plain-text segments (i.e. text NOT already inside a backtick
// code span — InlineText below keeps inline-code segments untouched).
//
// FIX: the previous version used recursive regex (`[\s\S]+?` non-greedy
// alternation, re-parsed per match) to support nesting. That's vulnerable to
// catastrophic backtracking — any card body with a lot of stray/unbalanced
// *, _, ~, + characters (code snippets, math, typos) could make the regex
// engine blow up in time/memory with NO thrown error, which is exactly what
// caused the dev server to OOM and hang instead of showing a JS error.
//
// This version is a single left-to-right scan with an explicit stack —
// O(n) in the length of the text, no backtracking possible no matter how
// many marker characters (balanced or not) appear. A marker only closes
// the INNERMOST currently-open span of the same type (standard well-nested
// behavior — same rule as HTML/markdown), so **bold *italic* text** nests
// correctly. Any span that's opened but never closed is safely demoted back
// to literal text at the end instead of swallowing the rest of the string.
//
// A marker character can be escaped with a backslash (\*, \_, \~, \+) to
// render as a literal character instead of opening/closing a span.
const FORMAT_MARKERS = [
  { token: '**', type: 'bold' },          // checked before single '*' so ** isn't seen as two italics
  { token: '++', type: 'underline' },
  { token: '~~', type: 'strikethrough' },
  { token: '*',  type: 'italic' },
  { token: '_',  type: 'italic' },
];

const parseFormatSegments = (text) => {
  const root = { type: null, token: null, children: [] };
  const stack = [root]; // stack of currently-open spans; root is always index 0
  let textBuf = '';

  const flushText = () => {
    if (textBuf) {
      stack[stack.length - 1].children.push({ type: 'text', value: textBuf });
      textBuf = '';
    }
  };

  let i = 0;
  while (i < text.length) {
    const ch = text[i];

    // Escaped marker char (\*, \_, \~, \+) — emit the literal character
    if (ch === '\\' && '*_~+'.includes(text[i + 1])) {
      textBuf += text[i + 1];
      i += 2;
      continue;
    }

    // Try each marker token at this position, longest first (** before *)
    const marker = FORMAT_MARKERS.find((m) => text.startsWith(m.token, i));
    if (marker) {
      const top = stack[stack.length - 1];
      if (top.type === marker.type && top.token === marker.token) {
        // Matches the innermost open span of the same type — close it
        flushText();
        const closed = stack.pop();
        stack[stack.length - 1].children.push({ type: closed.type, children: closed.children });
      } else {
        // No matching open span at the top — treat as an opening marker
        flushText();
        stack.push({ type: marker.type, token: marker.token, children: [] });
      }
      i += marker.token.length;
      continue;
    }

    textBuf += ch;
    i += 1;
  }
  flushText();

  // Any spans that opened but never found their closing marker — demote
  // back to plain text (marker shown literally) instead of losing content
  while (stack.length > 1) {
    const frame = stack.pop();
    const parent = stack[stack.length - 1];
    parent.children.push({ type: 'text', value: frame.token });
    parent.children.push(...frame.children);
  }

  return root.children.length ? root.children : [{ type: 'text', value: '' }];
};

// ─── FormatSegments renderer (NEW) ─────────────────────────────────────────
// Recursively renders the segment tree from parseFormatSegments. Text leaves
// render as-is; every other type wraps its own recursively-rendered children
// in the matching tag, which is what lets combos like bold+italic stack
// correctly (outer <strong> wrapping an inner <em>, etc.).
const FormatSegments = ({ segments }) =>
  segments.map((seg, i) => {
    if (seg.type === 'text') return <span key={i}>{seg.value}</span>;
    const inner = <FormatSegments segments={seg.children} key={i} />;
    switch (seg.type) {
      case 'bold':          return <strong className="dn-text-bold" key={i}>{inner}</strong>;
      case 'italic':        return <em className="dn-text-italic" key={i}>{inner}</em>;
      case 'underline':     return <u className="dn-text-underline" key={i}>{inner}</u>;
      case 'strikethrough': return <s className="dn-text-strikethrough" key={i}>{inner}</s>;
      default:               return inner;
    }
  });

// Drop-in replacement for rendering a plain string that may contain inline
// code spans — use anywhere `{someText}` was rendered directly (card titles,
// body paragraphs, bullets). Renders untouched if there are no backticks.
// Non-code text is also scanned for **bold**, *italic*/_italic_,
// ++underline++, and ~~strikethrough~~ markup via parseFormatSegments —
// markers can now nest/combine (e.g. **bold *and italic***) — so any card
// body/bullet/title text can emphasize individual words.
const InlineText = ({ text }) => {
  if (!text) return null;
  return parseInlineSegments(text).map((seg, i) => {
    if (seg.type === 'inline-code') {
      return <code className="dn-inline-code" key={i}>{seg.value}</code>;
    }
    return <FormatSegments segments={parseFormatSegments(seg.value)} key={i} />;
  });
};

// ─── CardCode helper ───────────────────────────────────────────────────────────
// Renders one code block. Used for:
//   1) the standalone `code` (+ optional `lang`) field on any card, in any tab
//   2) fenced/explicit code segments found inside `body` by CardBody below
// `lang` is optional and purely a label — omit it and the block still renders.
const CardCode = ({ code, lang }) => {
  if (!code) return null;
  return (
    <pre className="dn-code-block">
      {lang && <div className="dn-code-lang">{lang}</div>}
      <code>{code}</code>
    </pre>
  );
};

// CardBody now takes `code`/`lang` as well as `body`, so a single component
// call — <CardBody body={item.body} code={item.code} lang={item.lang} /> —
// covers every content combination a card can have. `code`/`lang` render as
// one block at the end, after everything in `body`.
const CardBody = ({ body, code, lang }) => {
  // Normalise: no body at all → empty array, string → single-item array,
  // array → itself. Everything below flows through one loop either way.
  const entries = !body ? [] : Array.isArray(body) ? body : [body];

  return (
    <>
      {entries.map((entry, i) => {
        // Object with bullets key — inline bullet list (unchanged behaviour)
        if (entry && typeof entry === 'object' && entry.bullets) {
          return <CardBullets key={i} bullets={entry.bullets} />;
        }
        // Object with an explicit code key — e.g. { code: "...", lang: "sql" }
        // dropped directly into a body array, no fence needed
        if (entry && typeof entry === 'object' && entry.code) {
          return <CardCode key={i} code={entry.code} lang={entry.lang} />;
        }
        // Object with a text key — plain paragraph, still fence-scanned so
        // code can appear inside it the same as a bare string entry can
        if (entry && typeof entry === 'object' && entry.text) {
          return parseBodySegments(entry.text).map((seg, j) =>
            seg.type === 'code'
              ? <CardCode key={`${i}-${j}`} code={seg.value} lang={seg.lang} />
              : <div className="dn-card-body" key={`${i}-${j}`}><InlineText text={seg.value} /></div>
          );
        }
        // Plain string — scanned for ```fenced``` code blocks so text and code
        // can be interleaved within one paragraph's worth of content. Each
        // resulting text segment is then run through InlineText so single
        // `backticks` inside it render as inline code chips too.
        if (typeof entry === 'string') {
          return parseBodySegments(entry).map((seg, j) =>
            seg.type === 'code'
              ? <CardCode key={`${i}-${j}`} code={seg.value} lang={seg.lang} />
              : <div className="dn-card-body" key={`${i}-${j}`}><InlineText text={seg.value} /></div>
          );
        }
        return null;
      })}
      {/* Standalone `code` field on the card itself — renders after body,
          identically in every tab, not just Code Snippets. */}
      <CardCode code={code} lang={lang} />
    </>
  );
};

// ─── CardBullets helper ───────────────────────────────────────────────────────
// Optional nested bullet list that can be added to any card alongside body text.
// Each item in the `bullets` array is either:
//   - a plain string → flat bullet at the current depth level
//   - an object { text, children } → bullet with optional nested sub-list
//
// The `depth` prop is used internally for recursion — never pass it manually.
// CSS classes dn-bullet-level-0 through dn-bullet-level-4 control the marker
// style at each nesting depth (filled circle → hollow circle → dash → › → *).
// Nesting deeper than level 4 reuses level-4 styling.
const CardBullets = ({ bullets, depth = 0 }) => {
  if (!bullets || bullets.length === 0) return null;

  // Clamp depth to 0–4 so CSS level classes stay valid
  const levelClass = `dn-bullet-level-${Math.min(depth, 4)}`;

  return (
    <ul className={`dn-card-bullets${depth > 0 ? ' dn-card-bullets--nested' : ''}`}>
      {bullets.map((point, i) => {
        // Plain string — no children
        if (typeof point === 'string') {
          return (
            <li key={i} className={`dn-card-bullet-item ${levelClass}`}>
              <InlineText text={point} />
            </li>
          );
        }
        // Object with text + optional children array
        return (
          <li key={i} className={`dn-card-bullet-item ${levelClass}`}>
            <InlineText text={point.text} />
            {/* Recurse one level deeper for any children */}
            {point.children && point.children.length > 0 && (
              <CardBullets bullets={point.children} depth={depth + 1} />
            )}
          </li>
        );
      })}
    </ul>
  );
};

// ─── CardMedia helper ─────────────────────────────────────────────────────────
// Was CardMedia({ media }) accepting a single object.
// Now accepts `mediaItems` — an array of media objects.
// Renders each item stacked vertically with spacing via .dn-card-media-item.
// Each item can be image, video, or youtube independently.
// If mediaItems is missing or empty, renders nothing.
const CardMedia = ({ mediaItems }) => {
  if (!mediaItems || mediaItems.length === 0) return null;

  return (
    // Outer wrapper now contains multiple .dn-card-media-item children
    <div className="dn-card-media">
      {mediaItems.map((media, index) => (
        // Each media item gets its own .dn-card-media-item wrapper
        // which handles the spacing between stacked items
        <div className="dn-card-media-item" key={index}>

          {media.type === "image" && (
            <img src={media.src} alt={media.caption || ""} loading="lazy" />
          )}

          {media.type === "video" && (
            <video controls preload="metadata">
              <source src={media.src} />
              Your browser does not support the video tag.
            </video>
          )}

          {media.type === "youtube" && (
            <iframe
              src={`https://www.youtube.com/embed/${media.id}`}
              title={media.caption || "YouTube video"}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          )}

          {media.caption && (
            <div className="dn-card-media-caption">{media.caption}</div>
          )}

        </div>
      ))}
    </div>
  );
};

// ─── Pinned Card resolution ───────────────────────────────────────────────────
// All valid tab ids, pulled live from TABS — this is what makes appliesTo:
// "all" future-proof (adding a 9th tab to TABS just works, no PINNED edits).
const TAB_IDS = TABS.map((t) => t.id);

// Map of tab id → section name (e.g. "progression" → "PROGRESS"), also pulled
// live from TABS. Used to resolve "section:<NAME>" appliesTo targeting below.
const TAB_SECTION = Object.fromEntries(TABS.map((t) => [t.id, t.section]));

// Resolves which pinned card config (if any) should render on a given tab id.
// Order of precedence:
//   1. A direct PINNED[id] entry always wins if present.
//   2. Otherwise, scan PINNED for any entry whose `appliesTo` covers this id —
//      an explicit array of tab ids, the string "all", or "section:<NAME>"
//      (matches every tab whose TABS.section equals <NAME>).
//   3. No match on either front → no pinned card for this tab.
function resolvePinnedConfig(id) {
  if (PINNED[id]) return PINNED[id];

  for (const key in PINNED) {
    const candidate = PINNED[key];
    if (!candidate || !candidate.appliesTo) continue;

    const applies = candidate.appliesTo;
    // "section:PROGRESS" / "section:REFERENCE" — matches every tab sharing
    // that section, resolved live off TAB_SECTION so future tabs inherit it.
    if (typeof applies === "string" && applies.startsWith("section:")) {
      const sectionName = applies.slice("section:".length);
      if (TAB_SECTION[id] === sectionName) return candidate;
      continue;
    }

    const targets = applies === "all" ? TAB_IDS : applies;
    if (targets.includes(id)) return candidate;
  }

  return null;
}

// ─── PinnedCard helper ────────────────────────────────────────────────────────
// Renders the optional pinned card for a tab, resolved via resolvePinnedConfig
// (handles both direct PINNED[id] entries and appliesTo-inherited ones).
// Returns null (renders nothing) if no config resolves for this tab — this is
// how a pinned card gets "taken down": delete/null the PINNED entry (and drop
// it from any appliesTo lists pointing at it), not a flag.
const PinnedCard = ({ id }) => {
  const config = resolvePinnedConfig(id);
  if (!config) return null;

  return (
    <div className="dn-pinned-card">
      {config.label && <div className="dn-pinned-label">{config.label}</div>}
      <div className="dn-pinned-title">{config.title}</div>
      {/* Reuses CardBody so pinned cards support string or array body, plus
          the standalone code/lang fields, same as regular cards */}
      <CardBody body={config.body} code={config.code} lang={config.lang} />
      {/* Multiple links (e.g. one per phase) — takes priority over linkText/linkUrl below.
          linksLayout controls row (default) vs stacked list. */}
      {config.links && config.links.length > 0 ? (
        <div className={`dn-pinned-links${config.linksLayout === "vertical" ? " dn-pinned-links--vertical" : ""}`}>
          {config.links.map((link, i) => (
            <a
              key={i}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="dn-pinned-link"
            >
              {link.text || "Open link ↗"}
            </a>
          ))}
        </div>
      ) : config.linkUrl && (
        <a href={config.linkUrl} target="_blank" rel="noopener noreferrer" className="dn-pinned-link">
          {config.linkText || "Open link ↗"}
        </a>
      )}
    </div>
  );
};

// ─── ScrollDock ───────────────────────────────────────────────────────────────
// Persistent bottom-right control cluster (lives outside .dn-pane so it never
// unmounts on tab switch — one instance, shared scroll container = .dn-main,
// the element that actually scrolls in this layout).
//
//   scrollRef:    ref to the scrollable container (.dn-main)
//   activeTab:    current tab id — position memory is scoped per tab, since
//                 "my spot" on Progression has nothing to do with "my spot"
//                 on Bug Log. Saved positions are kept in a ref keyed by tab id
//                 so switching tabs doesn't clobber a different tab's saved spot.
const SCROLL_EDGE_PX = 12;      // how close to top/bottom counts as "there" (fades arrow)
const TOAST_DURATION_MS = 1800; // how long "position saved/restored" stays visible

const ScrollDock = ({ scrollRef, activeTab }) => {
  const [atTop, setAtTop] = useState(true);
  const [atBottom, setAtBottom] = useState(false);
  const [canScroll, setCanScroll] = useState(false); // false when content is too short to scroll at all
  const [armed, setArmed] = useState(false);          // true once a position is saved for this tab
  const [toast, setToast] = useState("");             // current toast message ("" = hidden)

  // Saved scroll positions, one per tab id — ref (not state) since writing it
  // shouldn't trigger a re-render, only the button press that reads it should.
  const savedPositions = useRef({});
  const toastTimer = useRef(null);

  // Recomputes top/bottom/scrollable flags from the live scroll container.
  const measure = () => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    setAtTop(scrollTop <= SCROLL_EDGE_PX);
    setAtBottom(scrollTop + clientHeight >= scrollHeight - SCROLL_EDGE_PX);
    setCanScroll(scrollHeight - clientHeight > SCROLL_EDGE_PX * 2);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    measure();
    el.addEventListener("scroll", measure, { passive: true });
    // Content height changes on tab switch (different data) — re-measure,
    // and also drop the "armed" indicator since a new tab has no saved spot
    // (each tab's saved position lives independently in savedPositions.current).
    setArmed(Boolean(savedPositions.current[activeTab]));
    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(el);
    return () => {
      el.removeEventListener("scroll", measure);
      resizeObserver.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Shows a toast message briefly, replacing any toast already in flight.
  const showToast = (message) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), TOAST_DURATION_MS);
  };

  const scrollToTop = () => scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  const scrollToBottom = () => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  };

  // Save/restore toggle — one button, two behaviors depending on `armed`.
  // Not armed: capture the current scroll position for this tab, arm it.
  // Armed: smooth-scroll back to the captured position, then disarm.
  const handlePositionClick = () => {
    const el = scrollRef.current;
    if (!el) return;

    if (!armed) {
      savedPositions.current[activeTab] = el.scrollTop;
      setArmed(true);
      showToast("Position saved");
    } else {
      const target = savedPositions.current[activeTab] ?? 0;
      el.scrollTo({ top: target, behavior: "smooth" });
      setArmed(false);
      delete savedPositions.current[activeTab];
      showToast("Position restored");
    }
  };

  if (!canScroll) return null; // nothing to scroll — dock stays out of the way entirely

  return (
    <>
      <div className="dn-scrolldock">
        {/* Scroll to top — fades out once already at the top */}
        <button
          className={`dn-dock-btn dn-dock-pulse${atTop ? " dn-dock-hidden" : ""}`}
          onClick={scrollToTop}
          aria-label="Scroll to top"
          disabled={atTop}
        >
          ↑
          {/* CHANGED: was "Jump to latest entry" — same issue, inverted direction
              and date-dependent phrasing. "Scroll to top" is neutral and accurate. */}
          <span className="dn-dock-tooltip">Scroll to top</span>
        </button>

        {/* Scroll to bottom — fades out once already at the bottom.
            NEW: reordered below "scroll to top" so the stack reads top→bottom
            in the same direction as the actions themselves. */}
        <button
          className={`dn-dock-btn dn-dock-pulse${atBottom ? " dn-dock-hidden" : ""}`}
          onClick={scrollToBottom}
          aria-label="Scroll to bottom"
          disabled={atBottom}
        >
          ↓
          <span className="dn-dock-tooltip">Scroll to bottom</span>
        </button>

        {/* Save/restore position toggle — pulses with an offset timing/color
            so it doesn't beat in sync with the top/bottom buttons */}
        <button
          className={`dn-dock-btn dn-dock-pulse-alt${armed ? " dn-dock-armed" : ""}`}
          onClick={handlePositionClick}
          aria-label={armed ? "Return to saved position" : "Save current position"}
        >
          {armed ? "◎" : "○"}
          <span className="dn-dock-tooltip">
            {armed ? "Return to saved spot" : "Save your spot here"}
          </span>
        </button>
      </div>

      {/* Toast — "Position saved" / "Position restored" confirmation */}
      <div className={`dn-dock-toast${toast ? " dn-dock-toast-show" : ""}`}>
        {toast}
      </div>
    </>
  );
};

// ─── Tab Panes ────────────────────────────────────────────────────────────────

// ─── ProgressionPane ──────────────────────────────────────────────────────────
// Simplest pane shape — flat list, no grouping, no priority/status buckets.
// items:  DATA.progression, rendered in array order (no sort/filter applied).
// Header count line reads items.length directly.
// Per-card: tag/tags (via Tags), date, title, body (CardBody), bullets, mediaItems.
function ProgressionPane() {
  const items = DATA.progression;
  return (
    <>
      <div className="dn-content-header">
        <div className="dn-content-title">🚀 <span>Progression</span></div>
        <div className="dn-content-desc">Every milestone, fix, and feature shipped so far.</div>
        <div className="dn-count-line"><span>{items.length}</span> updates logged</div>
        {/* Pinned card slot for this tab — renders PINNED.progression, or an inherited card via appliesTo; see the Pinned Cards reference block near the top of the file */}
        <PinnedCard id="progression" />
      </div>
      <div className="dn-cards">
        {items.map((item) => (
          <div className="dn-card" key={item.id}>
            <div className="dn-card-meta">
              {/* Tags handles single tag or array of tags via `tag` or `tags` field */}
              <Tags tag={item.tag} tags={item.tags} />
              <span className="dn-date">{item.date}</span>
            </div>
            <div className="dn-card-title"><InlineText text={item.title} /></div>
            {/* Was {item.body && <div className="dn-card-body">{item.body}</div>} */}
            {/* CardBody handles string/array body, embedded bullets/code, and the standalone code+lang fields */}
            <CardBody body={item.body} code={item.code} lang={item.lang} />
            {/* Optional bullet list — omit bullets field on card data to hide */}
            <CardBullets bullets={item.bullets} />
            {/* Was media={item.media} — now mediaItems={item.mediaItems} */}
            <CardMedia mediaItems={item.mediaItems} />
          </div>
        ))}
      </div>
    </>
  );
}

// ─── FuturePane ───────────────────────────────────────────────────────────────
// Groups cards by `priority` instead of flat/date/month. Buckets are fixed —
// always "high", "medium", "low", in that order — unlike OptimizePane's months,
// which are dynamic. A bucket with zero matching items renders nothing (no
// empty heading).
// items:       DATA.future
// byPriority:  filters items down to one priority bucket
// PRIORITY_STYLES[p]: label text + color for each bucket's heading (defined
//   near the other style maps, alongside TAG_STYLES)
function FuturePane() {
  const items = DATA.future;
  const byPriority = (p) => items.filter((i) => i.priority === p);
  return (
    <>
      <div className="dn-content-header">
        <div className="dn-content-title">🔮 <span>Future Updates</span></div>
        <div className="dn-content-desc">What's coming next for Roam.</div>
        <div className="dn-count-line"><span>{items.length}</span> features planned</div>
        {/* Pinned card slot for this tab — renders PINNED.future, or an inherited card via appliesTo; see the Pinned Cards reference block near the top of the file */}
        <PinnedCard id="future" />
      </div>
      {["high", "medium", "low"].map((p) =>
        byPriority(p).length > 0 ? (
          <div className="dn-priority-group" key={p}>
            <div className="dn-priority-label" style={{ color: PRIORITY_STYLES[p].color }}>
              {PRIORITY_STYLES[p].label}
            </div>
            <div className="dn-cards">
              {byPriority(p).map((item) => (
                <div className="dn-card" key={item.id}>
                  <div className="dn-card-title"><InlineText text={item.title} /></div>
                  {/* CardBody handles string or array, plus standalone code+lang fields */}
                  <CardBody body={item.body} code={item.code} lang={item.lang} />
                  {/* Optional bullet list — omit bullets field on card data to hide */}
                  <CardBullets bullets={item.bullets} />
                  {/* Was media={item.media} — now mediaItems={item.mediaItems} */}
                  <CardMedia mediaItems={item.mediaItems} />
                </div>
              ))}
            </div>
          </div>
        ) : null
      )}
    </>
  );
}

// ─── OptimizePane ─────────────────────────────────────────────────────────────
// Groups cards by their `month` field (e.g. "March 2026").
// Each month renders as a heading with an underline, followed by its cards.
// Months appear in the order their first card appears in DATA.optimize —
// so put newer months at the top of the array to show them first.
// Total count shown in the header counts all entries across all months.
function OptimizePane() {
  const items = DATA.optimize;

  // Build an ordered list of unique months, preserving insertion order
  const months = [...new Set(items.map((i) => i.month))];

  return (
    <>
      <div className="dn-content-header">
        <div className="dn-content-title">⚡ <span>Optimizations</span></div>
        <div className="dn-content-desc">Performance improvements and code refactors.</div>
        <div className="dn-count-line"><span>{items.length}</span> optimizations logged</div>
        {/* Pinned card slot for this tab — renders PINNED.optimize, or an inherited card via appliesTo; see the Pinned Cards reference block near the top of the file */}
        <PinnedCard id="optimize" />
      </div>

      {/* Render one month group per unique month value */}
      {months.map((month) => {
        const monthItems = items.filter((i) => i.month === month);
        return (
          <div className="dn-optimize-month-group" key={month}>
            {/* Month heading with underline — styled via .dn-optimize-month-heading */}
            <div className="dn-optimize-month-heading">{month}</div>
            <div className="dn-cards">
              {monthItems.map((item) => (
                <div className="dn-card" key={item.id}>
                  <div className="dn-card-meta">
                    {/* Tags handles single tag or array of tags via `tag` or `tags` field */}
                    {/* Tag is optional on optimize cards — only renders if tag/tags field exists */}
                    <Tags tag={item.tag} tags={item.tags} />
                    <span className="dn-date">{item.date}</span>
                  </div>
                  <div className="dn-card-title"><InlineText text={item.title} /></div>
                  {/* CardBody handles string or array, plus standalone code+lang fields */}
                  <CardBody body={item.body} code={item.code} lang={item.lang} />
                  {/* Optional bullet list — omit bullets field on card data to hide */}
                  <CardBullets bullets={item.bullets} />
                  {/* Was media={item.media} — now mediaItems={item.mediaItems} */}
                  <CardMedia mediaItems={item.mediaItems} />
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </>
  );
}

// ─── LearnedPane ──────────────────────────────────────────────────────────────
// Flat list like ProgressionPane, but numbered instead of tagged/dated — each
// card shows a zero-padded index (#01, #02, ...) derived from its array
// position `i`, not from `item.id`. Renumbers automatically if you reorder
// or insert entries in DATA.learned.
// items:  DATA.learned
// Per-card: topic (title), body (CardBody), bullets, mediaItems.
function LearnedPane() {
  const items = DATA.learned;
  return (
    <>
      <div className="dn-content-header">
        <div className="dn-content-title">🧠 <span>What I Learned</span></div>
        <div className="dn-content-desc">Lessons and insights picked up while building Roam.</div>
        <div className="dn-count-line"><span>{items.length}</span> lessons logged</div>
        {/* Pinned card slot for this tab — renders PINNED.learned, or an inherited card via appliesTo; see the Pinned Cards reference block near the top of the file */}
        <PinnedCard id="learned" />
      </div>
      <div className="dn-cards">
        {items.map((item, i) => (
          <div className="dn-card" key={item.id}>
            <div className="dn-card-meta">
              <span style={{ color: "#00b4ff", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em" }}>
                #{String(i + 1).padStart(2, "0")}
              </span>
            </div>
            <div className="dn-card-title"><InlineText text={item.topic} /></div>
            {/* CardBody handles string or array, plus standalone code+lang fields */}
            <CardBody body={item.body} code={item.code} lang={item.lang} />
            {/* Optional bullet list — omit bullets field on card data to hide */}
            <CardBullets bullets={item.bullets} />
            {/* Was media={item.media} — now mediaItems={item.mediaItems} */}
            <CardMedia mediaItems={item.mediaItems} />
          </div>
        ))}
      </div>
    </>
  );
}

// ─── BugsPane ─────────────────────────────────────────────────────────────────
// Flat list, header count line splits into open/fixed instead of a single total.
// items:        DATA.bugs
// open/fixed:   counts derived from item.status, shown as two colored spans
//               in place of the usual "<span>{items.length}</span> ... logged" line
// statusClass:  maps item.status → CSS class for the pill (fixed/open/anything
//               else falls through to "investigating")
// statusLabel:  maps item.status → the pill's display text/icon
// Per-card: status pill + optional date, title, body (CardBody), bullets, mediaItems.
function BugsPane() {
  const items = DATA.bugs;
  const open  = items.filter((i) => i.status === "open").length;
  const fixed = items.filter((i) => i.status === "fixed").length;
  const statusClass = (s) => s === "fixed" ? "dn-bug-fixed" : s === "open" ? "dn-bug-open" : "dn-bug-investigating";
  const statusLabel = (s) => s === "fixed" ? "✓ fixed" : s === "open" ? "● open" : "◌ investigating";
  return (
    <>
      <div className="dn-content-header">
        <div className="dn-content-title">🐛 <span>Bug Log</span></div>
        <div className="dn-content-desc">Issues encountered and how they were resolved.</div>
        <div className="dn-count-line">
          <span style={{ color: "#ff4d6a" }}>{open} open</span>
          <span style={{ color: "#00e5a0" }}>{fixed} fixed</span>
        </div>
        {/* Pinned card slot for this tab — renders PINNED.bugs, or an inherited card via appliesTo; see the Pinned Cards reference block near the top of the file */}
        <PinnedCard id="bugs" />
      </div>
      <div className="dn-cards">
        {items.map((item) => (
          <div className="dn-card" key={item.id}>
            <div className="dn-card-meta">
              <span className={`dn-bug-status ${statusClass(item.status)}`}>{statusLabel(item.status)}</span>
              {item.date && <span className="dn-date">{item.date}</span>}
            </div>
            <div className="dn-card-title"><InlineText text={item.title} /></div>
            {/* CardBody handles string or array, plus standalone code+lang fields */}
            <CardBody body={item.body} code={item.code} lang={item.lang} />
            {/* Optional bullet list — omit bullets field on card data to hide */}
            <CardBullets bullets={item.bullets} />
            {/* Was media={item.media} — now mediaItems={item.mediaItems} */}
            <CardMedia mediaItems={item.mediaItems} />
          </div>
        ))}
      </div>
    </>
  );
}

// ─── StackPane ────────────────────────────────────────────────────────────────
// Not card-based like the other panes — renders DATA.stack straight into a
// grid of small icon tiles instead of `.dn-cards`/`.dn-card`. No CardBody,
// CardBullets, or CardMedia involved; no count line in the header either.
// Per-tile: icon, name (required), version (optional), role (optional).
function StackPane() {
  return (
    <>
      <div className="dn-content-header">
        <div className="dn-content-title">⚙️ <span>Tech Stack</span></div>
        <div className="dn-content-desc">Every tool and service powering Roam.</div>
        {/* Pinned card slot for this tab — renders PINNED.stack, or an inherited card via appliesTo; see the Pinned Cards reference block near the top of the file */}
        <PinnedCard id="stack" />
      </div>
      <div className="dn-stack-grid">
        {DATA.stack.map((item) => (
          <div className="dn-stack-card" key={item.id}>
            <div className="dn-stack-icon">{item.icon}</div>
            <div className="dn-stack-name">{item.name}</div>
            {item.version && <div className="dn-stack-version">{item.version}</div>}
            {item.role    && <div className="dn-stack-role">{item.role}</div>}
          </div>
        ))}
      </div>
    </>
  );
}

// ─── SnippetsPane ─────────────────────────────────────────────────────────────
// Flat list, back to the standard `.dn-cards`/`.dn-card` layout. Distinct
// from the other panes in one way: `lang` is shown once as a badge in the
// card meta row, so it's deliberately NOT also passed to CardBody (which
// would otherwise show a second lang label on the code block itself).
// Per-card: lang badge, title, body + code (CardBody, no lang prop), bullets, mediaItems.
function SnippetsPane() {
  return (
    <>
      <div className="dn-content-header">
        <div className="dn-content-title">📎 <span>Code Snippets</span></div>
        <div className="dn-content-desc">Useful patterns and reference code from the project.</div>
        {/* Pinned card slot for this tab — renders PINNED.snippets, or an inherited card via appliesTo; see the Pinned Cards reference block near the top of the file */}
        <PinnedCard id="snippets" />
      </div>
      <div className="dn-cards">
        {DATA.snippets.map((item) => (
          <div className="dn-card" key={item.id}>
            <div className="dn-card-meta">
              <span className="dn-snippet-lang">{item.lang}</span>
            </div>
            <div className="dn-card-title"><InlineText text={item.title} /></div>
            {/* CardBody handles string or array, plus the code field (lang badge above already
                shows the language, so no lang prop passed here — avoids showing it twice) */}
            <CardBody body={item.body} code={item.code} />
            {/* Optional bullet list — omit bullets field on card data to hide */}
            <CardBullets bullets={item.bullets} />
            {/* Was media={item.media} — now mediaItems={item.mediaItems} */}
            <CardMedia mediaItems={item.mediaItems} />
          </div>
        ))}
      </div>
    </>
  );
}

// ─── ResourcesPane ────────────────────────────────────────────────────────────
// Flat list. Title doubles as a link when item.url is present (opens in a new
// tab); falls back to plain text if url is omitted. Body is read from
// `item.note` here, not `item.body` — everything else feeds CardBody the same way.
// Per-card: category tag, title/link, note (CardBody), bullets, mediaItems.
function ResourcesPane() {
  return (
    <>
      <div className="dn-content-header">
        <div className="dn-content-title">🔗 <span>Resources</span></div>
        <div className="dn-content-desc">Documentation and useful links referenced during development.</div>
        {/* Pinned card slot for this tab — renders PINNED.resources, or an inherited card via appliesTo; see the Pinned Cards reference block near the top of the file */}
        <PinnedCard id="resources" />
      </div>
      <div className="dn-cards">
        {DATA.resources.map((item) => (
          <div className="dn-card" key={item.id}>
            <div className="dn-card-meta">
              <span className="dn-resource-category">{item.category}</span>
            </div>
            <div className="dn-card-title" style={{ marginTop: "0.25rem" }}>
              {item.url
                ? <a href={item.url} target="_blank" rel="noopener noreferrer" className="dn-resource-link">{item.title} ↗</a>
                : item.title
              }
            </div>
            {/* CardBody handles string or array (note field used here), plus standalone code+lang fields */}
            <CardBody body={item.note} code={item.code} lang={item.lang} />
            {/* Optional bullet list — omit bullets field on card data to hide */}
            <CardBullets bullets={item.bullets} />
            {/* Was media={item.media} — now mediaItems={item.mediaItems} */}
            <CardMedia mediaItems={item.mediaItems} />
          </div>
        ))}
      </div>
    </>
  );
}

// ─── Pane Map ─────────────────────────────────────────────────────────────────
const PANES = {
  progression: <ProgressionPane />,
  future:      <FuturePane />,
  // ── OptimizePane added to match the new tab entry above ───────────────────
  optimize:    <OptimizePane />,
  learned:     <LearnedPane />,
  bugs:        <BugsPane />,
  stack:       <StackPane />,
  snippets:    <SnippetsPane />,
  resources:   <ResourcesPane />,
};

// ─── Main Component ───────────────────────────────────────────────────────────
const DevLog = () => {
  // BEFORE: const [darkMode, setDarkMode] = useState(false);
  // AFTER: reads from localStorage on mount, same pattern as VerseHubLayout
  /*const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });*/

  // saves preference to localStorage whenever darkMode changes
  /*useEffect(() => {
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);*/

  const [activeTab, setActiveTab] = useState("progression");

  // Ref to the scrollable content container — passed to ScrollDock so it can
  // read/drive scroll position. .dn-main is the actual scrolling element in
  // this layout (sidebar + topbar stay fixed).
  const mainScrollRef = useRef(null);

  const sections = [...new Set(TABS.map((t) => t.section))];
  const getCount = (id) => { const d = DATA[id]; return Array.isArray(d) ? d.length : 0; };
  const formattedDate = new Date().toLocaleDateString("en-US", {
    weekday: "short", year: "numeric", month: "short", day: "numeric",
  });

  return (
    <div className="dn-page">
      {/* Sidebar lives outside <header> so its fixed overlay escapes the
          backdrop-filter stacking context that .dn-topbar creates */}
      {/*<Sidebar darkMode={darkMode} setDarkMode={setDarkMode} />*/}
      <header className="dn-topbar">
        <div className="dn-topbar-left">
          <div className="dn-logo-dot" />
          <span className="dn-topbar-title">Ro<span>am</span> — Dev Log</span>
        </div>
        <div className="dn-topbar-right">
          <span className="dn-live-badge">● live</span>
          <span className="dn-topbar-date">{formattedDate}</span>
        </div>
      </header>

      <div className="dn-body">
        <nav className="dn-sidebar">
          {sections.map((section) => (
            <div key={section}>
              <div className="dn-sidebar-section-label">{section}</div>
              {TABS.filter((t) => t.section === section).map((tab) => (
                <button
                  key={tab.id}
                  className={`dn-tab${activeTab === tab.id ? " active" : ""}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <span className="dn-tab-icon">{tab.icon}</span>
                  <span className="dn-tab-text">
                    <span className="dn-tab-label">{tab.label}</span>
                    <span className="dn-tab-sub">{tab.sublabel}</span>
                  </span>
                  {getCount(tab.id) > 0 && (
                    <span className="dn-tab-badge">{getCount(tab.id)}</span>
                  )}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <main className="dn-main" ref={mainScrollRef}>
          {TABS.map((tab) => (
            <div key={tab.id} className={`dn-pane${activeTab === tab.id ? " active" : ""}`}>
              {activeTab === tab.id && PANES[tab.id]}
            </div>
          ))}
        </main>
      </div>

      {/* Persistent scroll dock — lives outside .dn-main/.dn-pane so it never
          remounts on tab switch; fixed-position via CSS, bottom-right. */}
      <ScrollDock scrollRef={mainScrollRef} activeTab={activeTab} />
    </div>
  );
};

export default DevLog;
