"use client";
import { useState, useEffect } from "react";
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
// Leave a tab's entry out entirely (or null) to show no pinned card there
// (unless it's inheriting one from another tab's `appliesTo`).
const PINNED = {
  progression: {
    label: "PINNED",
     title: "Roadmap",
     body: "Phase boards for the current build-out.",
     links: [
      { text: "Roam GitHub Repo →", url: "https://github.com/NomadCode33/roam" }, 
      { text: "Phase 1 →", url: "https://trello.com/b/phase1" },
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
// ─────────────────────────────────────────────────────────────────────────────

// 6 total
/* {
      id: 3,
      date: "July 28, 2026",
      title: "PostGIS Extension Enabled",
      body: "Enabled the PostGIS extension in Supabase via `CREATE EXTENSION IF NOT EXISTS postgis`. Confirmed active at version 3.3.7 via `pg_extension` verification query. Required first step before any geometry columns could be created.",
      tag: "feature",
    },
*/
const DATA = {
  // ── progression: flat list, rendered by ProgressionPane ──────────────────
  // Fields per entry: id, date, title, body (string/array), tag/tags (optional)
  progression: [
    {
      id: 1,
      date: "July 28, 2026",
      title: "ROA-010 closed — Core database schema complete",
      body: "All 14 tables created with correct structure, constraints, and foreign key relationships. PostGIS confirmed. Schema verified. ROA-010 moved to Done.",
      tag: "feature",
    },
    {
      id: 2,
      date: "July 28, 2026",
      title: "Full schema verification completed",
      body: "Ran three confirmation queries against `information_schema.tables`, `information_schema.columns`, and `information_schema.table_constraints`. All 14 tables confirmed present. All named constraints verified. Column types and nullability correct across all tables.",
      tag: "feature",
    },
    {
      id: 3,
      date: "July 28, 2026",
      title: "Remaining 9 tables created",
      body: [
        "Created `comments`, `reactions`, `follows`, `saves`, `blocks`, `hidden_posts`, `post_subscriptions`, `notifications`, and `datasets`.",
        "All include appropriate CHECK constraints, UNIQUE constraints, and foreign key relationships. Reactions locked to upvote/downvote for Phase 1. Follows include self-follow prevention. Blocks include self-block prevention. Saves use polymorphic `item_id` + `item_type` pattern.",
      ],
      tag: "feature",
    },
    {
      id: 4,
      date: "July 28, 2026",
      title: "post_points_unique_order constraint added",
      body: "Added `UNIQUE (post_id, order_index)` to `post_points` as a separate ALTER TABLE after identifying the gap. This prevents two points on the same post from occupying the same slot — the BETWEEN constraint alone was insufficient.",
      tag: "feature",
    },
    {
      id: 5,
      date: "July 28, 2026",
      title: "users and places tables created",
      body: "Created the `users` table with UUID primary key referencing `auth.users(id)`, soft-deletable profile fields, role system with CHECK constraint, and confirmed-age boolean. Created the `places` table with PostGIS `geometry(Point, 4326)` coordinates column, Mapbox-compatible `place_id` deduplication key, heatmap weight, category array, and all counter columns defaulting to 0.",
      tag: "feature",
    },
    {
      id: 6,
      date: "July 28, 2026",
      title: "PostGIS Extension Enabled",
      body: "Enabled the PostGIS extension in Supabase via `CREATE EXTENSION IF NOT EXISTS postgis`. Confirmed active at version 3.3.7 via `pg_extension` verification query. Required first step before any geometry columns could be created.",
      tag: "feature",
    },
  ],

  // ── future: grouped by priority ("high" | "medium" | "low") in FuturePane ─
  // Fields per entry: id, title, priority, body (string/array), mediaItems (optional)
  future: [
    { id: 1, 
      title: "ROA-008 — Auth (Google + Apple + email/password) + public.users trigger",
      priority: "high",  
      body: "`auth.users` gets a row automatically on signup; `public.users` does not — without this trigger, signed-up users have no row in the app's own users table, breaking everything downstream that joins against it (posts, follows, blocks). Also unblocks ROA-003 Phase D, since `/api/auth/login` doesn't exist until this ships."
    },
    { id: 2, 
      title: "Migrate middleware.js → proxy.js/proxy.ts",
      priority: "high",  
      body: "Next.js 16.2.12 logs this as deprecated at every dev server start. Low cost to fix now; becomes actual tech debt if more routes get built against the old convention first. Needs resolving before ROA-003 Phase D is trusted as 'tested against current Next.js behavior.'"
    },
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
optimize: [
    {
      id: 1,
      month: "July 2026",
      date: "July 26, 2026",
      title: "post_points: Composite UNIQUE constraint added post-creation",
      body: "I realized that the `order_index BETWEEN 0 AND 4` constraint alone only prevents a sixth point from being inserted — it does nothing to prevent two points on the same post sharing the same slot index. A post with five rows all at `order_index = 0` would pass the BETWEEN check but completely break ordered rendering on the map.",
      bullets: [
        "Added `CONSTRAINT post_points_unique_order UNIQUE (post_id, order_index)` via `ALTER TABLE` after initial table creation",
        "Composite unique means the *combination* of `post_id` and `order_index` must be unique — different posts can share an index value, but the same post cannot have two points at the same position",
        "Two constraints working together: BETWEEN caps the range, UNIQUE prevents collisions within that range",
        "Enforced at the database level — no application code or race condition can bypass it"
      ],
      tags: "refactor"
    },
  ],

  // ── learned: flat list, numbered by array position in LearnedPane ────────
  // Fields per entry: id, topic (title), body (string/array)
  // { id: 10, topic: "", body: "" },
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
  ],

  // ── bugs: flat list, status drives the open/fixed counts in BugsPane ─────
  // Fields per entry: id, title, status ("fixed" | "open" | anything else →
  // shown as "investigating"), date (optional), body
  /* 
    { 
      id: 2, 
      title: "nodemon/node scripts swapped in package.json", 
      status: "fixed", 
      date: "Mar 25, 2026", 
      body: [
        "The start script had nodemon and dev had node — completely backwards. Corrected so start uses node for Render and dev uses nodemon.",
      ] 
    },
  */
  bugs: [
    { id: 1, 
      title: "users RLS policy: enabled but zero policies (locked to nobody)", 
      status: "fixed", 
      date: "July 28, 2026", 
      body: [
        "Symptom: `rowsecurity = true` on `users`, but `pg_policies` returned 0 rows — meaning the table was inaccessible to everyone. Root cause: the session-1 handoff had marked this table's RLS SQL as 'written' and was mistakenly treated as 'executed' without verification.",
        "Fix: ran the actual `CREATE POLICY` statements for `users_select_all` and `users_update_own`, then confirmed via `pg_policies`."
      ] 
    },
    { 
      id: 2, 
      title: "follows table: only 1 of 3 required policies existed", 
      status: "fixed", 
      date: "July 28, 2026", 
      body: [
        "Symptom: after adding the block-aware `follows_select_all`, `follows_insert_own` and `follows_delete_own` were assumed to already exist and hadn't been run — meaning follow/unfollow was completely non-functional. Root cause: same as above, assumed-executed SQL that wasn't.",
        "Fix: ran both missing policies, verified 3 total rows in `pg_policies` for `follows`."
      ] 
    },
    /*{ 
      id: 3, 
      title: "nodemon/node scripts swapped in package.json", 
      status: "fixed", 
      date: "Mar 25, 2026", 
      body: [
        "The start script had nodemon and dev had node — completely backwards. Corrected so start uses node for Render and dev uses nodemon.",
      ] 
    },
    { 
      id: 4, 
      title: "nodemon/node scripts swapped in package.json", 
      status: "fixed", 
      date: "Mar 25, 2026", 
      body: [
        "The start script had nodemon and dev had node — completely backwards. Corrected so start uses node for Render and dev uses nodemon.",
      ] 
    },*/
  ],

  // ── stack: tile grid in StackPane, not card-based (no body/bullets/media) ─
  // Fields per entry: id, name, icon, version (optional), role (optional)
  // { id: 6, name: "MongoDB",      icon: "🍃", version: "Atlas",    role: "NoSQL database" },
  stack: [
    { id: 1, name: "React 19",     icon: "⚛️", version: "^19.2.4",   role: "Frontend UI library" },
    { id: 2, name: "Next.js",      icon: "🔼", version: "^16.2.12",  role: "Full-stack React framework" },
    { id: 3, name: "Tailwind v4",  icon: "🎨", version: "^4.2.4",    role: "Utility-first styling" },
    { id: 4, name: "Mapbox GL JS", icon: "📍", version: "^3.28.1",   role: "Interactive client-side maps" },
    { id: 5, name: "Supabase",     icon: "⚡", version: "^2.112.2",   role: "Backend-as-a-Service (BaaS)" },
    { id: 6, name: "PostgreSQL",   icon: "🐘", version: "^18.4.0",   role: "Relational database engine" },
    { id: 7, name: "PostGIS",      icon: "🗺️", version: "^3.3.7",    role: "Spatial database extension" },
    { id: 8, name: "Vercel",       icon: "☁️", version: "Hosting",   role: "Deployment platform" },
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

  // { id: 4, title: "Tailwind CSS v4 Docs", url: "https://tailwindcss.com/docs", category: "styling",    note: "v4 uses @theme in CSS instead of tailwind.config.js." },
  resources: [
    { id: 1, title: "Tailwind CSS v4 Docs", url: "https://tailwindcss.com/docs", category: "styling",    note: "v4 uses @theme in CSS instead of tailwind.config.js." },
    { id: 2, title: "Supabase Docs", url: "https://supabase.com/docs", category: "backend",    note: "Full documentation for Supabase database, auth, storage, RLS, and JavaScript client. Primary reference for all backend work on Roam." },
    { id: 3, title: "Supabase RLS Guide", url: "https://supabase.com/docs/guides/database/postgres/row-level-security", category: "styling",    note: "Row Level Security concepts, USING vs WITH CHECK distinction, policy creation patterns, and testing approaches." },
    { id: 4, title: "Supabase Auth Guide", url: "https://supabase.com/docs/guides/auth", category: "auth",    note: "Session management, user management, OAuth providers, and auth hooks." },
    { id: 5, title: "Supabase PostGIS Guide", url: "https://supabase.com/docs/guides/database/extensions/postgis", category: "database",    note: "PostGIS extension setup, geometry column types, spatial query functions, and GIST indexing. Reference for all coordinate and proximity query work." },
    { id: 6, title: "Supabase JavaScript Client Reference", url: "https://supabase.com/docs/reference/javascript/introduction", category: "backend",    note: "Complete API reference for the Supabase JS client. Every Supabase query written in Next.js uses this reference for syntax." },
  ],
};

// ─── Style maps ───────────────────────────────────────────────────────────────
const TAG_STYLES = {
  deployment:  { bg: "rgba(0,180,255,0.1)",   color: "#00b4ff", border: "rgba(0,180,255,0.25)" },
  feature:     { bg: "rgba(0,229,160,0.1)",   color: "#00e5a0", border: "rgba(0,229,160,0.25)" },
  fix:         { bg: "rgba(255,201,60,0.1)",  color: "#ffc93c", border: "rgba(255,201,60,0.25)" },
  refactor:    { bg: "rgba(167,139,250,0.1)", color: "#a78bfa", border: "rgba(167,139,250,0.25)" },
  // ── New tag for Optimizations tab ─────────────────────────────────────────
  performance: { bg: "rgba(255,150,0,0.1)",   color: "#ff9600", border: "rgba(255,150,0,0.25)" },
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
        const s = TAG_STYLES[t] || TAG_STYLES.feature;
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
              : <div className="dn-card-body" key={`${i}-${j}`}>{seg.value}</div>
          );
        }
        // Plain string — scanned for ```fenced``` code blocks so text and code
        // can be interleaved within one paragraph's worth of content
        if (typeof entry === 'string') {
          return parseBodySegments(entry).map((seg, j) =>
            seg.type === 'code'
              ? <CardCode key={`${i}-${j}`} code={seg.value} lang={seg.lang} />
              : <div className="dn-card-body" key={`${i}-${j}`}>{seg.value}</div>
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
              {point}
            </li>
          );
        }
        // Object with text + optional children array
        return (
          <li key={i} className={`dn-card-bullet-item ${levelClass}`}>
            {point.text}
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

// Resolves which pinned card config (if any) should render on a given tab id.
// Order of precedence:
//   1. A direct PINNED[id] entry always wins if present.
//   2. Otherwise, scan PINNED for any entry whose `appliesTo` covers this id
//      (either an explicit array of tab ids, or the string "all").
//   3. No match on either front → no pinned card for this tab.
function resolvePinnedConfig(id) {
  if (PINNED[id]) return PINNED[id];

  for (const key in PINNED) {
    const candidate = PINNED[key];
    if (!candidate || !candidate.appliesTo) continue;
    const targets = candidate.appliesTo === "all" ? TAB_IDS : candidate.appliesTo;
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
            <div className="dn-card-title">{item.title}</div>
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
                  <div className="dn-card-title">{item.title}</div>
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
                  <div className="dn-card-title">{item.title}</div>
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
            <div className="dn-card-title">{item.topic}</div>
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
            <div className="dn-card-title">{item.title}</div>
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
            <div className="dn-card-title">{item.title}</div>
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

        <main className="dn-main">
          {TABS.map((tab) => (
            <div key={tab.id} className={`dn-pane${activeTab === tab.id ? " active" : ""}`}>
              {activeTab === tab.id && PANES[tab.id]}
            </div>
          ))}
        </main>
      </div>
    </div>
  );
};

export default DevLog;
