// ─── devlog-data.js ─────────────────────────────────────────────────────────
// Server-safe module: TABS config, PINNED cards, DATA (all tab content), every
// pane component (ProgressionPane...ResourcesPane), and the shared rendering
// primitives (CardBody, CardBullets, CardMedia, InlineText, Tags, PinnedCard).
//
// No "use client" here on purpose — nothing in this file uses hooks or event
// handlers, so it runs on the server. That's what makes the dev log's actual
// content (cards, dates, text) appear in the raw HTML response instead of only
// existing after browser-side hydration.
//
// ScrollDock and the interactive shell (sidebar buttons, routing, topbar) live
// in TabNav.jsx instead — that's the one piece that genuinely needs a browser
// (useState/useEffect/onClick), so it's the only client boundary.
//
// No React hook imports needed here — every component below is a plain
// function returning JSX. The CSS import lives in page.jsx, not here.
//import Sidebar from "../../components/dev-log/Sidebar";

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

// ─── Badge count formatting ─────────────────────────────────────────────────
// Fixed-width sidebar badge: raw counts stay untouched everywhere else (DATA
// arrays, any real length checks) — this only governs what the pill DISPLAYS.
// Caps at 99+ so the badge never reflows the sidebar column regardless of
// how large a tab's dataset grows.
const BADGE_CAP = 99;
const formatCount = (n) => (n > BADGE_CAP ? `${BADGE_CAP}+` : String(n));

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
      date: "Jl0y, 2026",
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
      id: 259,
      date: "November 05, 2026",
      title: "Per-address cooldown verified with a control",
      body: "Two requests in a row to the recover endpoint on two addresses. Request 1 returned HTTP 200 and request 2 returned HTTP 429, so the 60-second interval works.",
      tag: "feature"
    },
    /*{
      id: 258,
      date: "November 05, 2026",
      title: "Gmail vacation responder on the sender mailbox",
      body: "The Gmail setting is named "Vacation responder", not "Out of office". It replies "This mailbox is not monitored" and was tested from a second inbox. Whether to keep it is undecided.",
      tag: "feature"
    },*/
    {
      id: 257,
      date: "November 05, 2026",
      title: "Both templates revised after the first send test",
      body: "Added 'The link works once.', the ignore wording (the reset email also tells users who keep getting these emails to reset from the login page), and an unmonitored-address notice. Both saved and persisted.",
      tag: "refactor"
    },
    {
      id: 256,
      date: "November 05, 2026",
      title: "Reset-password email template",
      body: "Same structure as the confirm template, subject 'Reset your Roam password'. It saved and persisted after a reload.",
      tag: "feature"
    },
    {
      id: 255,
      date: "November 05, 2026",
      title: "Confirm-signup email template",
      body: "Roam-branded and inline-styled, with a button plus a pasted-link fallback. It saved and persisted after a reload. The dashboard preview prints {{ .ConfirmationURL }} as literal text, which is normal; the real link appears only in a sent email.",
      tag: "feature"
    },
    {
      id: 254,
      date: "November 05, 2026",
      title: "Email limit set to 30 per hour, not 300",
      body: "Gmail's ceiling is about 500 messages a day (third-party sources, unconfirmed) and Supabase's limit is per hour, so 300 an hour would use the whole day in under 2 hours. I kept 30 for a small-scale launch and will raise it only if traffic grows, at which point the move is to a domain with Resend.",
      tag: "decision"
    },
    {
      id: 253,
      date: "November 05, 2026",
      title: "Custom SMTP enabled through Gmail",
      body: "After creating custom settings, the email limit became editable (default 30 per hour) and the per-address minimum interval became active.",
      tag: "feature"
    },
    {
      id: 252,
      date: "November 04, 2026",
      title: "Baseline of the Supabase auth settings",
      body: "Captured before changing anything. The built-in email service banner was showing, the email limit was locked at 2 per hour, and 'Minimum interval per user' (60 seconds) applied only with custom SMTP. Signups were OFF, Confirm email was ON, Site URL was already the production domain, and Redirect URLs listed 6 entries. I also read authLimiter in lib/ratelimit.js (5 requests per 60 seconds, keyed on x-forwarded-for).",
      tag: "documentation"
    },
    {
      id: 251,
      date: "November 04, 2026",
      title: "Interim Gmail SMTP instead of Resend",
      body: "Roam owns no domain and the project must stay free, so Resend (which needs a verified sending domain) was deferred. I compared a free eu.org subdomain, Resend's sandbox sender, and Mailtrap or local SMTP. Gmail SMTP needs no domain, so it became the interim sender.",
      tag: "decision"
    },
    {
      id: 250,
      date: "November 03, 2026",
      title: "ROA-044 design decisions recorded",
      body: "`getUser()` over `getSession()`. `confirmed_age` is the completion flag (set in both routes, kept). Admin-client write instead of a SECURITY DEFINER function. The x-vercel-ip-country header was not adopted. location_preference, TRUNCATE/TRIGGER grants, and a grant audit of other tables were parked.",
      tag: "decision"
    },
    {
      id: 249,
      date: "November 03, 2026",
      title: "Under-minimum rejections verified",
      body: "Production with a 2014 date of birth showed 'at least 13', and localhost showed 'at least 16' (lookup fails, strict fail-safe). The row stayed NULL/false after both.",
      tag: "documentation"
    },
    {
      id: 248,
      date: "November 03, 2026",
      title: "New-user flows on production after the lockdown",
      body: "A dashboard-created user, an email signup, and a Google signup each ended with the date of birth stored, `signup_country` US, and `confirmed_age` true. Each also showed /age-gate → /, a 409 on a second POST, and the row unchanged. Existing email and Google logins stayed on /.",
      tag: "deployment"
    },
    {
      id: 247,
      date: "November 03, 2026",
      title: "Post-lockdown tests as an impersonated user",
      body: "Reading B's secrets returned 42501, and B's profile read returned 1 row. A date of birth update returned 42501, own bio returned 1 row, and B's bio returned 0 rows. At 16:12 a DO-block harness printed DENIED 42501 for all six sensitive columns and ALLOWED for a bio control.",
      tag: "documentation"
    },
    {
      id: 246,
      date: "November 03, 2026",
      title: "Stored grants verified",
      body: "`role_table_grants` and `column_privileges` matched the plan. The four sensitive columns show only REFERENCES, and anon is unchanged.",
      tag: "documentation"
    },
    {
      id: 245,
      date: "November 03, 2026",
      title: "Column lockdown ran on public.users",
      body: "A single DO block revoked table-level SELECT and UPDATE from authenticated, then granted column-level access. The result was SELECT on 9 columns and UPDATE on 5 profile columns.",
      tag: "feature"
    },
    {
      id: 244,
      date: "November 03, 2026",
      title: "Age-gate page navigation: hard reload replaced with the router",
      body: "`window.location.href` became `router.replace('/')` plus `router.refresh()`, which cleared the lint warning (ROA-044 item 10).",
      tag: "refactor"
    },
    {
      id: 243,
      date: "November 03, 2026",
      title: "proxy.js guard rewritten around getUser()",
      body: "One block covers /dashboard and /age-gate: no valid user redirects to /login, an incomplete user on /dashboard goes to /age-gate, and a finished user on /age-gate goes to /. The leftover `-code-verifier` cookie no longer gets through.",
      tag: "fixed"
    },
    {
      id: 242,
      date: "November 03, 2026",
      title: "Completion check moved from three fields to one flag",
      body: "proxy.js and the OAuth callback read `confirmed_age` instead of `date_of_birth`, `signup_country`, and `tos_accepted_at`. The signup route also sets `confirmed_age: true`.",
      tag: "refactor"
    },
    {
      id: 241,
      date: "November 03, 2026",
      title: "/api/auth/age-gate is now write-once and server-written",
      body: "The route identifies the user with `getUser()` and writes through the service-role client, using `.eq('id', user.id).eq('confirmed_age', false)`, which sets `confirmed_age: true`. Zero rows returns 409, and the 500 path no longer leaks the raw database error.",
      tag: "feature"
    },
    {
      id: 240,
      date: "November 03, 2026",
      title: "Backfilled confirmed_age for finished users",
      body: "One UPDATE returned exactly 2 rows. A Step 6 re-run showed them true and the two incomplete users still false.",
      tag: "feature"
    },
    {
      id: 239,
      date: "November 03, 2026",
      title: "Baseline exposure proven (read and write)",
      body: "User A read User B's date of birth, country, consent time, and email. User A also rewrote all six protected columns on their own row in one statement (rolled back, original values confirmed at 13:44).",
      tag: "documentation"
    },
    {
      id: 238,
      date: "November 03, 2026",
      title: "Ship the code first, run the lockdown second",
      body: "The Supabase project is shared by preview and production (inferred), so permission changes hit production instantly. The age-gate and guard code went live before the column lockdown, so production never ran old code against locked columns.",
      tag: "decision"
    },
    {
      id: 237,
      date: "November 01, 2026",
      title: "Eight High Audit Findings Justified, Not Force-Fixed",
      body: "The final audit shows 35 findings with 0 critical and 8 high. Six come through the shadcn CLI (shadcn, @modelcontextprotocol/sdk, body-parser, systeminformation, undici, zod), and two come through build tooling (brace-expansion, source-map-js). The app imports none of them (git grep found nothing in app/, components/, lib/, proxy.js, or the root config files). `npm audit fix --force` would install shadcn@1.0.0, so it was declined. The six non-breaking fixes go to ROA-049.",
      tag: "decision"
    },
    {
      id: 236,
      date: "November 01, 2026",
      title: "Dev-Log Sync Check Becomes a Standing Rule",
      body: "I'm allowed to add dev-log entries on main. To keep `--ff-only` working, step 1 of every ROA and the step right before each production promotion now run `git fetch origin` and `git log --oneline staging..main`. If it prints anything, main is merged into staging first. This supersedes the 10/30 rule 'dev-log entries on staging only.'",
      tag: "decision"
    },
    {
      id: 235,
      date: "October 31, 2026",
      title: "Sentry Browser and Server Test Errors Verified After the Upgrade",
      body: "The three deleted ROA-017 example files were restored on a throwaway branch (tmp/roa-039-sentry-test, commit b1b3365) and the branch was deleted afterward. Frontend event 0c34bb06 (ROAM-2, app/sentry-example-page/page.jsx line 87) and server event 3b107b29 (ROAM-6, app/api/sentry-example-api/route.js line 14) both reached Sentry with release b1b3365, readable stack traces, and the same trace ID.",
      tag: "deployment"
    },
    {
      id: 234,
      date: "October 31, 2026",
      title: "Route Guard Passes on Stale Handshake Cookies",
      body: "proxy.js lines 52 and 108 count any cookie starting with `sb-` and containing `-auth-token` as a session. In a normal browser, leftover `...-code-verifier` cookies let a logged-out visitor see /age-gate and get a 404 on /dashboard. After clearing cookies, both redirected to login, and Incognito always did. proxy.js was unchanged by ROA-039. Added to ROA-044.",
      tag: "open"
    },
    {
      id: 233,
      date: "October 31, 2026",
      title: "Age-Gate Lint Warning: no-location-assign-relative-destination",
      body: "The post-upgrade lint run shows one new warning at app/(auth)/age-gate/page.js line 52 (window.location.href used for an internal page). It probably came with eslint-config-next 16.4.1. The full page reload may be deliberate, so it's recorded as ROA-044 item 10.",
      tag: "open"
    },
    {
      id: 232,
      date: "October 31, 2026",
      title: "js-yaml and nanoid Refreshed Inside Existing Ranges",
      body: "The Next.js bump did not clear them, because they came through eslint, shadcn, and Tailwind's postcss. `npm update js-yaml nanoid` changed only package-lock.json (js-yaml 4.3.0 to 4.3.2, nanoid 3.3.16 to 3.3.20), commit 4d955cc. Audit: 37 to 35 findings.",
      tag: "fixed"
    },
    {
      id: 231,
      date: "October 31, 2026",
      title: "Sentry withSentryConfig Import Moved to @sentry/nextjs/config",
      body: "The one import at next.config.mjs line 1 was changed in its own commit (8d56963). The local build log went from 4 matching lines to 0, and dev start-up, the preview, staging, and production builds show no warning.",
      tag: "fixed"
    },
    {
      id: 230,
      date: "October 31, 2026",
      title: "Next.js 16.2.12 to 16.4.1 Clears the Critical Advisories",
      body: "Commit 7c63051 also moved eslint-config-next from 16.2.4 to 16.4.1, pinned exact. The audit went from 39 findings (1 critical, 12 high) to 37 (0 critical, 10 high). postcss under next moved to 8.5.23 and sharp to 0.35.5.",
      tag: "fixed"
    },
    {
      id: 229,
      date: "October 31, 2026",
      title: "Before-Audit Snapshot and Code Search Recorded",
      body: "The before audit was saved to ~/audit-before-roa039.json (39 findings). Searches found no AVIF, no images.formats, remotePatterns, domains, or dangerouslyAllowSVG settings, no next/og or ImageResponse, and no use cache or cacheComponents. next/image is used only in app/(main)/page.js, and the landing page made no /_next/image request.",
      tag: "documentation"
    },
    {
      id: 228,
      date: "October 31, 2026",
      title: "Regression Scope Reduced to the Flows That Exist",
      body: "app/api/posts/route.js and app/api/posts/[id]/route.js are stubs that return {'status':'stub ok'}. The map and image upload screens are not built, so ROA-039's regression covered login, signup refusal, route guards, health, and page loads instead of the original post, map, and upload list.",
      tag: "decision"
    },
    {
      id: 227,
      date: "October 30, 2026",
      title: "Vercel Authentication Stays on Standard Protection",
      body: "Previews require a Vercel login and production stays public. 'All Deployments' was rejected because it would lock production and break the UptimeRobot monitor. The cross-device confirmation-link test must run on production or with protection off.",
      tag: "decision"
    },
    {
      id: 226,
      date: "October 30, 2026",
      title: "Production Health Verified",
      body: "/api/health returns {'status':'ok'}. UptimeRobot on roam-dusky-alpha.vercel.app/api/health shows 100% up for 1 month 15 days. The Aug 8 500 incident was resolved Sep 14.",
      tag: "deployment"
    },
    {
      id: 225,
      date: "October 30, 2026",
      title: "Step 25 Review: Oct 3 Build Failure and fad98f5 Diff",
      body: "Build 19410ba failed on 'Can't resolve @vercel/turbopack-next/internal/font/google/font' from the DM Sans import in app/layout.js. The commit never touched layout.js, and every later build is Ready. The fad98f5 diff (3 insertions, 5 deletions) only filled the empty Aug 25 'Auth Panel Layout' entry.",
      tag: "documentation"
    },
    {
      id: 224,
      date: "October 30, 2026",
      title: "Tickets Drafted and Updated",
      body: "Drafted ROA-047 (About page, footer link currently goes nowhere) and ROA-048 (dev-log INP). Added the Sentry import deprecation to ROA-039, two bullets to ROA-044 (test users, never-run checks), and the item 8 redirect cleanup and a VoiceOver bullet to ROA-008C. A ROA-049 draft was deleted.",
      tag: "documentation"
    },
    {
      id: 223,
      date: "October 30, 2026",
      title: "No More Best Practices Scans, h1 Goes to the Flag List",
      body: "The only Best Practices finding was page-has-heading-one (moderate) on /login, /signup, /age-gate, and the dev-log views. It is not a WCAG 2.1 AA failure. Fix when ROA-008C touches those pages.",
      tag: "decision"
    },
    {
      id: 222,
      date: "October 30, 2026",
      title: "Final Axe Scans on the Pushed Preview",
      body: "Axe (WCAG 2.1 AA) returned 0 findings on /, / with the cookie banner showing, /login, /signup, /age-gate, /privacy, /terms, and all 8 dev-log views, in no emulation, OS light, and OS dark. Best Practices ON found only the missing-h1 rule.",
      tag: "deployment"
    },
    {
      id: 221,
      date: "October 30, 2026",
      title: "Cookie Banner Focus Fix Verified",
      body: "After Decline and after Accept, document.activeElement.id returned 'main-content'. An untouched load returned BODY. With VoiceOver, Decline made it say 'main' and the next Tab landed on 'Sign up free'.",
      tag: "fixed"
    },
    {
      id: 220,
      date: "October 30, 2026",
      title: "Cookie Banner Dismiss Moves Focus to main-content",
      body: "Chose option B: on Accept or Decline, send focus to main#main-content. The call sits in the click handlers, not in an effect, so it never fires on first load.",
      tag: "decision"
    },
    {
      id: 219,
      date: "October 30, 2026",
      title: "INP Measured From the Console, VoiceOver Off",
      body: "A PerformanceObserver reading of about 10 dock presses gave 120ms as the baseline and 80ms with the dock pulse animation disabled by an injected style. Both are under the 200ms good line, and the 40ms gap is within noise. No ticket opened.",
      tag: "performance"
    },
    {
      id: 218,
      date: "October 28, 2026",
      title: "Dev-Log Input Delay With VoiceOver On",
      body: "Speech lagged and Chrome briefly showed 'not responding' on /dev-log. The Vercel toolbar read INP of 520ms and 616ms, with worst rows on the dock pulse buttons, the active tab, and the skip link. Input delay dominated and render stayed small. Cause unknown. Drafted as ROA-048.",
      tag: "open"
    },
    {
      id: 217,
      date: "October 28, 2026",
      title: "Screen Reader Pass, Part 3: Dev-Log Tabs and Position Toasts",
      body: "Sidebar tab names read 'Progression updates & milestones 99+, current item, button' and 'Future updates planned features 3, button' with the emoji ignored. 'Position restored' was spoken on 10/28/26, and 'Position saved' was confirmed on the 10/30/26 retest.",
      tag: "feature"
    },
    {
      id: 216,
      date: "October 28, 2026",
      title: "Screen Reader Pass, Part 2: Spoken Form Errors",
      body: "Errors on /signup ('Signups not allowed for this instance', 'You must be at least 13 to sign up'), /login ('Invalid login credentials'), and /age-gate ('You must be at least 13 to use Roam') were all spoken by VoiceOver. Field labels read with name and role. Month, day, and year read only as 'button', and the login password name read with asterisks (both deferred to ROA-008C).",
      tag: "feature"
    },
    {
      id: 215,
      date: "October 28, 2026",
      title: "Screen Reader Pass, Part 1: Skip Link and Landmarks",
      body: "On macOS VoiceOver the skip link was announced as a link, Enter moved focus into the hero, and the next Tab landed on 'Sign up free'. The landmark list showed navigation, main, footer, and Cookie consent region. NVDA on Windows listed the same four landmarks. The skip link was not announced on a fresh load on Windows (unverified, possibly focus moving first).",
      tag: "feature"
    },
    {
      id: 214,
      date: "October 20, 2026",
      title: "One main landmark per page for /privacy, /terms, and /dev-log",
      body: "These three routes sit outside both route-group layouts, so each got its own `<main id='main-content' tabIndex={-1}>` on its top wrapper (the dev-log reuses its `.dn-main` scroll container, with `role='region'` removed). Lint on the three edited files shows no jsx-a11y hits.",
      tag: "refactor"
    },
    {
      id: 213,
      date: "October 20, 2026",
      title: "Skip link hidden under the dev-log top bar",
      body: "Computed values showed a white background and `z-index: 50`, while `.dn-topbar` is `z-index: 100` with a translucent background and `backdrop-filter`. The bar was painting over the link and dimming it. Changing `focus:z-50` to `focus:z-[10000]` fixed it (computed z-index 10000, white button confirmed on /dev-log).",
      tag: "fixed"
    },
    {
      id: 212,
      date: "October 20, 2026",
      title: "Dev-log skip link box is smaller than on other pages",
      body: "The link is now white and sits above the top bar, but its padding is 0 on /dev-log while /privacy and /terms show 8px and 16px. Cause confirmed in the Styles pane: an unlayered `* { margin: 0; padding: 0 }` reset in devlog.css beats Tailwind's layered focus:px-4 and focus:py-2. Pending fix: the `!` important suffix on both classes, then verify computed padding on /dev-log.",
      tag: "open"
    },
    {
      id: 211,
      date: "October 19, 2026",
      title: "Skip link now skips the nav on the (main) and (auth) routes",
      body: "After Enter on the skip link, the next Tab lands on the first content control: 'Sign up free' on /, 'Continue with Google' on /login and /signup, the Month select on /age-gate. Verified in Incognito on localhost.",
      tag: "fixed"
    },
    {
      id: 210,
      date: "October 19, 2026",
      title: "Move the main landmark instead of only adding an id",
      body: "Giving each page's own content the `<main>` fixes the skip link and also restores the navigation and contentinfo landmarks outside it. A smaller option, adding an id to the existing wrappers, would have left nav and footer inside main.",
      tag: "decision"
    },
    {
      id: 209,
      date: "October 19, 2026",
      title: "Skip link skipped nothing: its target contained the nav",
      body: "Found in the keyboard test. `main.contains(nav)` returned `true`, and after Enter on the skip link the next Tab landed on 'Roam' in the nav. Axe could not catch this, only a manual test did.",
      tag: "open"
    },
    {
      id: 208,
      date: "October 19, 2026",
      title: "Step 22 keyboard test on the preview, Parts A to E",
      body: "Tab orders matched on /, /signup, and /login. The date selects work by keyboard and the checkbox by Space. Signup is refused with 'Signups not allowed for this instance' and no auth.users row exists for the test email. Dev-log tabs work by Enter and Space, the content column shows a ring, the scroll dock is operable, and there is no trap. The Next.js dev indicator is absent on the preview. All three auth pages use real `<form onSubmit>` forms.",
      tag: "documentation"
    },
    {
      id: 207,
      date: "October 19, 2026",
      title: "Step 21 lint re-run: 5 down to 0",
      body: "Baseline 5 in a11y-baseline.txt. Both `npx eslint app/ components/` and `npx eslint .` print 0 jsx-a11y hits. `lang='en'` is visible on the rendered `<html>`. Commit 449fd7a confirmed Ready on the same screenshot.",
      tag: "documentation"
    },
    {
      id: 206,
      date: "October 19, 2026",
      title: "Step 20 seizure check: pass",
      body: "Nothing exceeds 0.5 cycles per second: pulse-dot 2.5s, dn-dock-pulse 2.8s, dn-dock-pulse-alt 3.4s, landing pulse 2s, fadeSlideIn 0.22s run once. No `setInterval` in app/ or components/. The dock pulse looks like a slow breathing glow, and the global reduced-motion rule forces a single instant change.",
      tag: "documentation"
    },
    {
      id: 205,
      date: "October 18, 2026",
      title: "ROA-008C updated to v6",
      body: "Item 1 now records the real root cause (an unstyled class inheriting `--foreground`), and two Done-When bullets were updated: the toast must set its own colors, and it must pass axe in both OS light and dark mode.",
      tag: "documentation"
    },
    {
      id: 204,
      date: "October 18, 2026",
      title: "Focus ring invisible on the landing hero",
      body: "`#2563eb` on the hero background `#5c4e9e` computes to 1.34:1, against the 3:1 minimum. Added `.hero :focus-visible { outline-color: #ffffff }` (6.91:1). Forced-state readings: hero button `rgb(255, 255, 255)`, footer link `rgb(37, 99, 235)`, so the override is scoped.",
      tag: "fixed"
    },
    {
      id: 203,
      date: "October 18, 2026",
      title: "Dev-log scroll reset is its own ticket, ROA-046",
      body: "Switching dev-log tabs keeps the previous scroll position, probably because `.dn-main` stays mounted (inference). It is not an accessibility issue and not ROA-042's route-level scroll reset. Drafted in the ROA-008C layout, with the number provisional and three decisions open (dock save and restore, back and forward, direct ?tab= load).",
      tag: "decision"
    },
    {
      id: 202,
      date: "October 18, 2026",
      title: "Light and dark mode axe scans: 0 on all seven pages",
      body: "Every earlier scan ran at night in OS dark mode. Re-scanned in light mode with DevTools' prefers-color-scheme emulation: /, /login, /signup, /age-gate, /dev-log, /privacy, and /terms all scored 0.",
      tag: "documentation"
    },
    {
      id: 201,
      date: "October 18, 2026",
      title: ".auth-error and .auth-notice now have explicit colors",
      body: "`.auth-error` is `#b91c1c` (6.47:1 on white by calculation) and `.auth-notice` is `#111827`. Verified: computed `rgb(185, 28, 28)` and axe 0 on /login, /signup, and /age-gate with the error showing. `.auth-notice` was verified by injecting a copy, because signups are OFF.",
      tag: "fixed"
    },
    {
      id: 200,
      date: "October 18, 2026",
      title: ".auth-error measured at 1.17:1 and the cause found",
      body: "`#ededed` on `#ffffff`. Two readings were identical (no animation, opacity 1), so it was not a fade. The class had no CSS rule, so it inherited `--foreground`, which flips to `#ededed` under `prefers-color-scheme: dark`.",
      tag: "documentation"
    },
    {
      id: 199,
      date: "October 18, 2026",
      title: "Dev-log scroll column reachable by keyboard",
      body: "Tech Stack and Code Snippets failed scrollable-region-focusable. Added `tabIndex={0}`, `role='region'`, and `aria-label` to `.dn-main`, plus one eslint-disable with its reason written in the comment. A blue ring now shows and the arrow keys scroll. Axe 0 on both tabs, and Position saved and Position restored still work.",
      tag: "fixed"
    },
    {
      id: 198,
      date: "October 17, 2026",
      title: "Footer and cookie banner links open in the same tab",
      body: "Footer.jsx and AuthFooter.jsx dropped `target='_blank'`, and the banner's Privacy Policy anchor became `<Link href='/privacy'>`. Navigation works. The commit message names only contrast.",
      tag: "refactor"
    },
    {
      id: 197,
      date: "October 17, 2026",
      title: "Eleven failing color pairs fixed across the site",
      body: "Footer link and copy alphas raised, hero tag and subtitle lightened, auth 'or' divider darkened, dev-log tag colors lightened, `.dn-code-lang` opacity removed, and `--ink-faint` darkened. Localhost axe scored 0 on /, /login, /signup, /age-gate, /privacy, and the dev-log Progression, What I Learned, and Resources tabs.",
      tag: "fixed"
    },
    {
      id: 196,
      date: "October 17, 2026",
      title: "Step 18 axe baseline on the preview: 62 serious findings",
      body: "60 color-contrast (collapsing to 11 color pairs) and 2 scrollable-region-focusable. Page counts: / 6, /login 5, /signup 5, /age-gate 4, /dev-log Progression 14, /privacy 15, What I Learned 1, Tech Stack 1, Code Snippets 1, Resources 10. /terms and three dev-log tabs scored 0.",
      tag: "documentation"
    },
    {
      id: 195,
      date: "October 16, 2026",
      title: "Cookie banner region label and reserved space",
      body: "The banner became `<section aria-label='Cookie consent'>` (Role: region). A ResizeObserver writes `--cookie-banner-h`, used for body padding-bottom and html scroll-padding-bottom. The value matched offsetHeight at 75, 130, and 130 across widths, and it cleared on Accept.",
      tag: "feature"
    },
    {
      id: 194,
      date: "October 16, 2026",
      title: "Cookie banner: no custom Tab order, kept global to (main)",
      body: "Hand-tests showed keyboard reach and ring visibility pass. No tabindex values were added. Grep confirmed CookieBanner mounts only in app/(main)/layout.js, and you chose to keep it off /dev-log.",
      tag: "decision"
    },
    {
      id: 193,
      date: "October 15, 2026",
      title: "/age-gate reachable after completion routed to ROA-044",
      body: "Opening /age-gate still worked for an apparently completed user (session state unconfirmed). The finding matches ROA-044 item 5 and its Step C, so no new ticket was created and no fix was made here.",
      tag: "decision"
    },
    {
      id: 192,
      date: "October 15, 2026",
      title: "role='alert' on auth form errors",
      body: "Added to the existing `.auth-error` paragraph on /signup, /login, and /age-gate. Each showed Role: alert and live region assertive in the Accessibility pane. Per-field aria wiring was deliberately left to ROA-008C.",
      tag: "feature"
    },
    {
      id: 191,
      date: "October 15, 2026",
      title: "Dev-log image alt logic verified with a temporary test",
      body: "Two Next.js logo entries showed `alt=''` on the captioned image (pane: 'Element has empty alt text') and `alt='Dev log screenshot'` on the uncaptioned one. The test entries were discarded with `git restore`, so the commit b1d3fbc kept the real edit.",
      tag: "feature"
    },
    {
      id: 190,
      date: "October 15, 2026",
      title: "Tab icon emoji hidden from assistive tech",
      body: "`aria-hidden='true'` on `.dn-tab-icon`. The button's accessible name dropped from '🚀 Progression' to 'Progression'.",
      tag: "feature"
    },
    {
      id: 189,
      date: "October 15, 2026",
      title: "role='status' on the scroll dock toast",
      body: "The toast stays mounted and only its text changes. The Accessibility pane shows a polite, atomic live region, and 'Position saved' and 'Position restored' both display as before.",
      tag: "feature"
    },
    {
      id: 188,
      date: "October 15, 2026",
      title: "aria-current on the active dev-log sidebar tab",
      body: "`aria-current={activeTab === tab.id ? 'true' : undefined}`. Verified in Elements with 1 of 1' search results, and it moved to Future Updates on click.",
      tag: "feature"
    },
    {
      id: 187,
      date: "October 15, 2026",
      title: "Dev-log nested main landmark removed",
      body: "`<main className='dn-main'>` became a `<div>` after a grep showed devlog.css has no element selector. `document.querySelectorAll('main').length` is 1 on localhost.",
      tag: "fixed"
    },
    {
      id: 186,
      date: "October 15, 2026",
      title: "Signup refusal verified on the ROA-016 preview",
      body: "With signups OFF, email signup showed 'Signups not allowed for this instance' and left 0 rows in auth.users and public.users. Google signup was refused with the error in the URL hash and only handshake cookies. Existing email and Google logins still set auth-token.0 and .1. This closed the earlier gap where the preview ran the old admin route.",
      tag: "deployment"
    },
    {
      id: 185,
      date: "October 14, 2026",
      title: "ROA-016 build `19410ba` errored and the dev-log commit is unconfirmed",
      body: "The Vercel build log for `19410ba` was never read, and 13e verification is pending.",
      tag: "open"
    },
    {
      id: 184,
      date: "October 14, 2026",
      title: "Old admin signup route still lives on `feature/roa-016`",
      body: "It ignores the signups toggle. The fix is committed but unmerged, and the plan is to merge it into `staging` and then into ROA-016.",
      tag: "open"
    },
    {
      id: 183,
      date: "October 14, 2026",
      title: "`users` columns still exposed, live tests not run",
      body: "Other users' dates of birth are probably readable, and a user can probably write their own directly. The authenticated read and write tests are ROA-044's Step A.",
      tag: "open"
    },
    {
      id: 182,
      date: "October 14, 2026",
      title: "Ticket and flag documents updated",
      body: "ROA-008C is at v5 with 9 items, ROA-044 at v3, ROA-045 drafted, and the master flag list at v21. A session handoff was also written.",
      tag: "documentation"
    },
    {
      id: 181,
      date: "October 14, 2026",
      title: "Show-password checkboxes added to ROA-008C, Resend scoped as ROA-045",
      body: "Neither kanban v5 nor checklist v6 mentioned show-password. It became item 9 of ROA-008C. Resend as the SMTP provider was already in checklist v6, and it became the draft ROA-045.",
      tag: "decision"
    },
    {
      id: 180,
      date: "October 14, 2026",
      title: "Signups-OFF test: the new route refuses, the old route doesn't",
      body: "With the toggle off, the fixed route showed 'Signups not allowed for this instance' with no row created. The `feature/roa-016` preview, still on the old admin route, created an Auth user and a `users` row. Existing email and Google logins worked on both previews.",
      tag: "decision"
    },
    {
      id: 179,
      date: "October 14, 2026",
      title: "Supabase redirect list corrected, preview flow verified",
      body: "A missing preview entry plus a double-slash typo had sent confirmation links to `localhost:3000`. After the fix, the link stayed on the preview domain, session cookies appeared, and the `users` row showed `signup_country` US.",
      tag: "deployment"
    },
    {
      id: 178,
      date: "October 13, 2026",
      title: "Email signup now sends a confirmation email",
      body: "On `fix/auth-signup-email`, `signup/route.js` calls `signUp` on a cookie-aware server client. The 'Confirm your email address' mail arrived and the page showed a notice instead of silently going home.",
      tag: "deployment"
    },
    {
      id: 177,
      date: "October 13, 2026",
      title: "Dev-log image alt logic and video `muted`",
      body: "Edited `CardMedia` in `devlog-data.js`. `npx eslint app/dev-log/` printed no `jsx-a11y` output. The commit is still unconfirmed.",
      tag: "fixed"
    },
    {
      id: 176,
      date: "October 13, 2026",
      title: "Revamped 3-file dev-log brought onto `feature/roa-016`",
      body: "I copied `page.jsx`, `TabNav.jsx`, and `devlog-data.js` from `main` and pushed them as commit `677004e`. The Vercel preview built and the tabs worked.",
      tag: "deployment"
    },
    {
      id: 175,
      date: "October 01, 2026",
      title: "ROA-044 scoped: protect the `users` table (read and write)",
      body: "`pg_policies` showed `users_select_all` is `true` and the update policy only pins `role`. Column privileges and a live `anon` test showed `anon` is blocked, while `authenticated` holds SELECT and UPDATE on the three age-gate columns.",
      tag: "decision"
    },
    {
      id: 174,
      date: "October 01, 2026",
      title: "Removed the unused dev-log `Sidebar.jsx`",
      body: "The import check showed only a commented-out import. After `git rm`, the full `jsx-a11y` count dropped to the single media-caption hit, and `/dev-log` still rendered with every tab working.",
      tag: "refactor"
    },
    {
      id: 173,
      date: "October 01, 2026",
      title: "Date-of-birth row now has an accessible group name and per-select labels",
      body: "`signup/page.js` and `age-gate/page.js` use `<fieldset>`, `<legend>`, and a hidden `<label htmlFor>` per select. The Accessibility pane showed the group as 'Date of birth' and the selects as Month, Day, and Year. It was checked at 320px with no overflow, and both label-association lint hits cleared.",
      tag: "fixed"
    },
    {
      id: 172,
      date: "September 30, 2026",
      title: "shadcn Dialog installed (Radix UI base)",
      body: "Installed via the Rhea preset after two failed attempts at the custom preset flow. Smoke-tested on a temporary route: confirmed focus trap, Tab cycling, Escape-to-close, and focus-return-to-trigger all working correctly.",
      tag: "feature"
    },
    {
      id: 171,
      date: "September 30, 2026",
      title: "shadcn init overwrote `globals.css` wholesale",
      body: "Running `npx shadcn@latest init` to install Dialog deleted the project's real `--background`/`--foreground` hex tokens and `body` font-family rule, replacing them with shadcn's oklch defaults. Diagnosed via `git show HEAD:app/globals.css` diff. Fixed by merging: kept shadcn's Dialog-required tokens, restored original theme tokens and fonts. Verified via screenshots across homepage, login, and signup.",
      tag: "fixed"
    },
    {
      id: 170,
      date: "September 26, 2026",
      title: "Logo doesn't navigate home when already on `/`; page nav doesn't reliably scroll to top",
      body: "Discovered during manual skip-link testing. Scoped as ROA-042, unrelated to accessibility work so kept out of this branch.",
      tag: "open"
    },
    {
      id: 169,
      date: "September 26, 2026",
      title: "~95 unescaped JSX entity lint warnings + 2 setState-in-effect warnings",
      body: "Found during the ROA-016 baseline lint run. Not accessibility issues, so deliberately deferred. Scoped as ROA-040 and ROA-041.",
      tag: "open"
    },
    {
      id: 168,
      date: "September 26, 2026",
      title: "npm audit: 1 critical, 4 high severity advisories",
      body: "Next.js RCE (Windows-hosted servers + AVIF Image Optimization API), plus postcss/sharp/js-yaml/nanoid, mostly transitive via next. Scoped as ROA-039 and deliberately not fixed mid-ticket, it requires its own branch and full regression pass.",
      tag: "open"
    },
    {
      id: 167,
      date: "September 26, 2026",
      title: "`docs/a11y-checklist.md` created",
      body: "Standing pre-close checklist for any ticket touching UI. Later appended with Mapbox-specific popup rules and the Tailwind cascade-layers gotcha.",
      tag: "documentation"
    },
    {
      id: 166,
      date: "September 26, 2026",
      title: "`LiveRegion` component",
      body: "Built `components/a11y/LiveRegion.jsx`, a reusable `aria-live` announcer using a clear-then-set-after-50ms pattern so identical repeated messages still get announced to screen readers.",
      tag: "feature"
    },
    {
      id: 165,
      date: "September 26, 2026",
      title: "Reduced-motion override silently losing to Tailwind v4 cascade layers",
      body: "`.pulse`'s animation kept running with Reduce Motion enabled despite an `!important` override. Root cause: Tailwind v4's `@import 'tailwindcss'` places subsequent rules inside a named `@layer`, and unlayered CSS always beats layered CSS regardless of specificity or `!important`. Fixed by keeping the reduced-motion media query unlayered, before layer context is established. Confirmed via DevTools Computed panel (`animation-duration` 2s → 0.01ms).",
      tag: "fixed"
    },
    {
      id: 164,
      date: "September 26, 2026",
      title: "Global `:focus-visible` ring",
      body: "Added a global `outline: 2px solid #2563eb` rule scoped to `:focus-visible` only, so keyboard focus is visible without adding a ring on every mouse click.",
      tag: "feature"
    },
    {
      id: 163,
      date: "September 26, 2026",
      title: "Skip-to-content link",
      body: "Added a `sr-only focus:not-sr-only` link as the first child of `<body>`, targeting `#page-root`. Verified with screenshots showing the link appearing on first Tab press and correctly jumping past the nav.",
      tag: "feature"
    },
    {
      id: 162,
      date: "September 26, 2026",
      title: "Duplicate `<main>` landmarks across 8 files",
      body: "Root layout and nested route-group layouts/pages were each rendering their own `<main>`, producing 2–3 nested landmarks per page. Swapped all nested instances to `<div>`, keeping only the outermost `<main id='page-root'>` in root `app/layout.js`.",
      tag: "fixed"
    },
    {
      id: 161,
      date: "September 26, 2026",
      title: "ESLint jsx-a11y integration",
      body: "Installed `eslint-plugin-jsx-a11y` and `@axe-core/react`. Resolved a flat-config plugin collision (eslint-config-next already registers jsx-a11y) by extracting only `.rules` from `flatConfigs.recommended` instead of the full config object. Verified via `--print-config` showing `jsx-a11y/alt-text` at severity 2.",
      tag: "feature"
    },
    {
      id: 160,
      date: "September 23, 2026",
      title: "Defer `proxy.js` → Node Runtime Migration",
      body: "Confirmed `Sentry.setUser()` doesn't reliably attach inside `proxy.js` due to Next.js middleware defaulting to Edge runtime. Decided not to force Node runtime for `proxy.js` right now. The real trade-off (slower cold starts, loss of Edge geographic distribution) wasn't worth it just to fix user-context tagging in one file, given `auth/signup` already proves the pattern works.",
      tag: "decision"
    },
    {
      id: 159,
      date: "September 23, 2026",
      title: "`signup_country` NULL Blocking Age-Gate",
      body: "A real test signup showed `signup_country` as `NULL`, triggering a redirect loop to `/age-gate`. Root cause: Vercel's IP-geolocation headers only populate on Vercel's actual edge network, not on `localhost`. Manually patched the row via SQL to unblock local testing; confirmed as expected local-dev behavior, not a code defect.",
      tag: "fixed"
    },
    {
      id: 158,
      date: "September 22, 2026",
      title: "Skip Ad-Blocker Request Tunneling",
      body: "Declined the Sentry wizard's option to route browser error reports through the Next.js server to bypass ad blockers. Reasoning: added server load/cost for a solo project isn't worth it just to catch the occasional ad-blocker-suppressed report.",
      tag: "decision"
    },
    {
      id: 157,
      date: "September 23, 2026",
      title: "Missing Source Maps on Preview Deploy",
      body: "`SENTRY_AUTH_TOKEN` was scoped to Production only in Vercel, so the `feature/roa-017` Preview build had no access to it during `next build`, and no source maps were uploaded. Added Preview scope alongside Production, triggered a fresh deploy, confirmed a readable stack trace (`app/sentry-example-page/page.jsx:87:19`) instead of a minified chunk reference.",
      tag: "fixed"
    },
    {
      id: 156,
      date: "September 22, 2026",
      title: "`withLogging.js` Now Reports to Sentry",
      body: "Added `Sentry.captureException(error)` inside the existing catch block of `lib/withLogging.js`. Previously, every error caught by this wrapper was logged only via the custom logger and silently never reached Sentry. This fix applies retroactively to all 8 routes wrapped by this higher-order function.",
      tag: "refactor"
    },
    {
      id: 155,
      date: "September 22, 2026",
      title: "User-Context Attachment Implemented",
      body: "Added `Sentry.setUser({ id: ... })` to `proxy.js` and `app/api/auth/signup/route.js`. Confirmed working correctly only in the signup route (Node runtime), a real Supabase user UUID appeared correctly tagged on a captured error.",
      tag: "feature"
    },
    {
      id: 154,
      date: "September 22, 2026",
      title: "Production-Only Gate Added",
      body: "Added `enabled: process.env.NODE_ENV === 'production'` to all three Sentry config files, preventing local dev noise from consuming the free-tier error quota.",
      tag: "feature"
    },
    {
      id: 153,
      date: "September 22, 2026",
      title: "Sentry SDK Installed via Wizard",
      body: "Ran `npx @sentry/wizard@latest -i nextjs`. Selected SaaS, existing account, declined ad-blocker request tunneling, declined Tracing, declined Session Replay, accepted the example test page, declined the Sentry MCP server. Wizard installed `@sentry/nextjs`, created `instrumentation.js`, `instrumentation-client.js`, `sentry.server.config.js`, `sentry.edge.config.js`, patched `next.config.mjs`, and scaffolded the example test files.",
      tag: "feature"
    },
    {
      id: 152,
      date: "September 22, 2026",
      title: "Sentry Project Created",
      body: "Created a new Sentry project (`roam`, org `nomadcode33`) via the Create Project flow, platform set to Next.js, alert frequency left on default 'High priority issues,' repository linking skipped.",
      tag: "deployment"
    },
    {
      id: 151,
      date: "September 14, 2026",
      title: "Corrected a stale project-memory record for ROA-003",
      body: "Project memory incorrectly stated ROA-003 (rate limiting) was 'blocked, not complete.' A prior session's handoff document was provided proving it was fully closed. All 5 limiters verified, a real `pickLimiter` regression fixed, and the `middleware.js` → `proxy.js` migration completed. Memory corrected to match reality.",
      tag: "fixed"
    },
    {
      id: 150,
      date: "September 14, 2026",
      title: "`@/lib/...` alias adopted as the standing import convention",
      body: "An earlier attempt at the `@/` alias reportedly failed, so relative paths (`../../../lib/...`) were used across all 8 wrapped files initially. Mid-session, `@/lib/withLogging` was retested and confirmed working and is adopted going forward. Several files still use the relative-path form; flagged as cleanup, not urgent.",
      tag: "decision"
    },
    {
      id: 149,
      date: "September 14, 2026",
      title: "Logging verified live on Vercel preview (`feature/roa-015`)",
      body: "Pushed the branch, hit `/api/health` on the live preview URL, and confirmed the identical structured JSON log line appeared in Vercel's Runtime Logs panel. It proves that the logger works in the real serverless environment, not just `next dev`.",
      tag: "deployment"
    },
    {
      id: 148,
      date: "September 14, 2026",
      title: "All 8 live API routes wrapped in `withLogging`",
      body: "`health`, `posts`, `posts/[id]`, `comments`, `translate`, `auth/login`, `auth/signup`, `auth/age-gate` all now export their real HTTP verb wrapped in `withLogging(handler)`. Real business logic in `auth/signup` and `auth/age-gate` (geo lookup, age check, Supabase writes) preserved exactly, only the export line changed.",
      tag: "refactor"
    },
    {
      id: 147,
      date: "September 14, 2026",
      title: "429 rate-limit rejections were invisible to logging",
      body: "`proxy.js` returns its own response directly when a rate limiter rejects a request. That response never passes through a route handler, so `withLogging` alone couldn't see it. Fixed by calling `logRequest`/`createRequestId` directly inside the existing `if (!success)` branch in `proxy.js`, closing the visibility gap for the busiest failure mode under load.",
      tag: "fixed"
    },
    {
      id: 146,
      date: "September 10, 2026",
      title: "Route-wrapping middleware (`lib/withLogging.js`)",
      body: "Higher-order function that wraps any route handler with automatic request-ID generation, execution timing, and try/catch error handling. Successful calls log method/path/status/duration and stamp an `x-request-id` response header; thrown errors log the real stack trace server-side while the client only ever sees a generic 500 + request ID.",
      tag: "feature"
    },
    {
      id: 145,
      date: "September 10, 2026",
      title: "Structured request logger (`lib/logger.js`)",
      body: "Built a shared JSON logging utility exporting `createRequestId()` and `logRequest()`. Every log line carries `level`, `requestId`, `method`, `path`, `status`, `durationMs`, and `timestamp`, with a denylist-based `redact()` function scrubbing any key containing `password`, `token`, `authorization`, `cookie`, `jwt`, or `secret` before it reaches stdout.",
      tag: "feature"
    },
    {
      id: 144,
      date: "September 09, 2026",
      title: "Clarified Redis Fix 'Applied' vs. 'Verified' Status",
      body: "User corrected an assumption that the Upstash Redis production fix being *applied* to `main` meant `/api/health` was confirmed working. These are being tracked as two separate claims going forward. The fix is applied, but the endpoint's live response has not been checked this session.",
      tag: "fixed"
    },
    {
      id: 143,
      date: "September 09, 2026",
      title: "Internal Privacy Link Changed to Same-Tab",
      body: "Changed the banner's Privacy Policy link from `target='_blank'` to same-tab navigation. `target='_blank'` exists to protect a user's place in the app when linking *away* for an internal link there's no 'elsewhere' to protect against, so it was only adding friction (two open tabs, one unresolved banner).",
      tag: "refactor"
    },
    {
      id: 142,
      date: "September 09, 2026",
      title: "Scoped CSS for Banner (`css/CookieBanner.css`)",
      body: "Added component-scoped stylesheet, every rule nested under a single `.roam-cookie-banner` wrapper class. A direct, deliberate application of the CSS-bleed lesson from ROA-005 (unscoped bare-tag selectors leak across client-side route transitions in the App Router).",
      tag: "feature"
    },
    {
      id: 141,
      date: "September 09, 2026",
      title: "Cookie Consent Banner Component (`CookieBanner.jsx`)",
      body: "Built the client-side banner component. Reads `document.cookie` on mount, renders nothing if a decision already exists, and writes a 1-year `SameSite=Lax` cookie on Accept or Decline. The PostHog init call inside `handleAccept` was left as an explicit comment/marker rather than a stub call, since the package isn't installed yet.",
      tag: "feature"
    },
    {
      id: 140,
      date: "September 09, 2026",
      title: "Cookie Consent Utility (`lib/consent.js`)",
      body: "Built the consent-state utility: `parseConsent`, `hasConsentDecision`, and the `CONSENT_COOKIE` export. Returns exactly one of `'accepted'`, `'declined'`, or `null`. Never guesses a default state from a missing or malformed cookie.",
      tag: "feature"
    },
    {
      id: 139,
      date: "September 09, 2026",
      title: "Scoped ROA-007 to Binary Consent, Not Categorized",
      body: "Initially proposed a categorized (Necessary/Analytics/Marketing) consent model with per-category toggles. Cross-checked against the actual kanban ticket spec and found ROA-007 is written as strictly binary (Accept/Decline only). Reversed course and built to the real written scope instead of the richer assumed version.",
      tag: "decision"
    },
    {
      id: 138,
      date: "September 08, 2026",
      title: "Age-gate redirect-guard middleware + no-session guard",
      body: "Extended app/proxy.js so missing DOB/country/ToS fields are re-checked on every /dashboard request (not just once at OAuth callback), redirecting to /age-gate. Added a second guard so /age-gate itself redirects unauthenticated visitors to /login instead of rendering a form that could never submit successfully.",
      tag: "feature"
    },
    {
      id: 137,
      date: "September 08, 2026",
      title: "Middleware session-cookie matching bug",
      body: " app/proxy.js's dashboard presence-check used `.endsWith('-auth-token')`, but real Supabase session cookies are split across sb-<ref>-auth-token.0 and .1. The exact-suffix match never matched, so valid sessions were misread as logged out. Fixed to `.includes('-auth-token')`; confirmed via a live session correctly reaching the age-gate check instead of being bounced to /login.",
      tag: "fixed"
    },
    {
      id: 136,
      date: "September 08, 2026",
      title: "Missing preview-deployment redirect URI in Supabase",
      body: "OAuth silently fell back to the Site URL (localhost:3000) on the ROA-004 preview because only ROA-008's preview URL was allow-listed in Supabase's Redirect URLs. Added ROA-004's actual preview URL; confirmed via a real OAuth round-trip landing on /age-gate instead of the public homepage.",
      tag: "fixed"
    },
    {
      id: 135,
      date: "September 08, 2026",
      title: "Wrong redirect path in OAuth callback",
      body: "callback/route.js redirected to /auth/age-gate, which doesn't exist. (auth) is a route group and contributes nothing to the URL, so the real path is /age-gate. One-line fix, confirmed by successfully landing on the real interstitial post-OAuth.",
      tag: "fixed"
    },
    {
      id: 134,
      date: "September 08, 2026",
      title: "Google OAuth age-gate interstitial",
      body: "Built app/(auth)/age-gate/page.js and app/api/auth/age-gate/route.js so OAuth signups (which bypass the signup form) are still required to submit DOB/ToS before continuing. Updated app/auth/callback/route.js to redirect there when any of the three fields are missing after OAuth completes.",
      tag: "feature"
    },
    {
      id: 133,
      date: "September 03, 2026",
      title: "Email/password signup enforcement",
      body: "Rebuilt app/(auth)/signup/page.js with DOB dropdowns and a ToS checkbox; added app/api/auth/signup/route.js as a new server-side route that runs the real geo-lookup and age check before creating the user via the Supabase admin client, client-side signup calls were removed entirely.",
      tag: "feature"
    },
    {
      id: 132,
      date: "September 03, 2026",
      title: "Server-side geo-IP + age threshold logic",
      body: "Built lib/geo.js (EU/non-EU lookup via ip-api.com, fails safe to isEU: true on any error or ambiguous response) and lib/age.js (calculateAge, meetsMinimumAge — 13 baseline, 16 for EU-identified signups).",
      tag: "feature"
    },
    {
      id: 131,
      date: "September 03, 2026",
      title: "ROA-004 age-gate database schema",
      body: "Added `date_of_birth` (date), `signup_country` (text), and `tos_accepted_at` (timestamptz) to public.users. tos_accepted_at is a timestamp rather than a boolean so it doubles as a consent audit trail.",
      tag: "feature"
    },
    {
      id: 130,
      date: "September 03, 2026",
      title: "Missing GRANT on service_role for public.users",
      body: "Signup route threw 'permission denied for table users' on every account creation attempt. Root cause was a missing table-level GRANT. RLS policies were correct, but Postgres checks GRANT before RLS ever runs, and service_role had never been explicitly given SELECT/INSERT/UPDATE on public.users. Fixed via `GRANT SELECT, INSERT, UPDATE ON public.users TO service_role;`, confirmed with a direct curl request returning real row data instead of the permission error.",
      tag: "fixed"
    },
    {
      id: 129,
      date: "September 01, 2026",
      title: "ROA-008C ticket authored",
      body: "New ticket scoping auth-flow UX gaps: illegible error/validation styling on login/signup (confirmed via screenshot), missing check-your-email interstitial, missing forgot-password flow, missing cross-method sign-in/account linking, and the still-open OAuth signup Terms/Privacy disclosure gap. Rebuilt once mid-session to match the real kanban structure (header/User Story/Description/Done When) rather than an initial flat-format draft.",
      tag: "documentation"
    },
    {
      id: 128,
      date: "September 01, 2026",
      title: "`backup-main` branch created",
      body: "A snapshot branch pointing at `main`'s current commit, created and pushed to origin as a safety net. It's not a live mirror, but rather a point-in-time backup.",
      tag: "deployment"
    },
    {
      id: 127,
      date: "September 01, 2026",
      title: "`feature/roa-008` merged into `staging`",
      body: "Fast-forward merge (no diverging commits on `staging`, so no merge commit was created). Verified via `git log --oneline` showing all expected commits present, and a post-merge `/api/health` check on `staging` confirming `{'status':'ok'}`.",
      tag: "deployment"
    },
    {
      id: 126,
      date: "September 01, 2026",
      title: "Dashboard route protection re-verified post-migration",
      body: "Confirmed via browser test that an unauthenticated request to `/dashboard` still redirects correctly to `/login` after the `proxy.js` migration. A stale, already-authenticated session initially produced a `404` instead (expected `dashboard/page.js` is still an empty folder); clearing the session cookie and repeating the test produced the correct `/login` redirect.",
      tag: "fixed"
    },
    {
      id: 125,
      date: "September 01, 2026",
      title: "`middleware.js` migrated to `proxy.js`",
      body: "Renamed via `git mv` to preserve file history as a move rather than a delete+create (confirmed via `git diff --stat` showing 0 insertions/deletions on the rename itself). A second, unplanned fix was required: Next.js 16's `proxy.js` convention requires the exported function itself to be named `proxy`, not just the filename. The original `export async function middleware(req)` still referenced the old name and threw a build error until corrected.",
      tag: "refactor"
    },
    {
      id: 124,
      date: "September 01, 2026",
      title: "Window-reset behavior deliberately verified",
      body: "After tripping `translateLimiter`'s block, waited the full 60-second window and confirmed a fresh request returns `200` again, proving the sliding window resets and normal usage isn't permanently penalized. Done as a deliberate test, not left as an earlier accidental observation.",
      tag: "feature"
    },
    {
      id: 123,
      date: "September 01, 2026",
      title: "`authLimiter`, `commentLimiter`, `translateLimiter` verified working",
      body: "Same curl-loop pattern applied to all three remaining tiers — 5/60s, 20/60s, and 30/60s respectively — each confirmed blocking on the correct request count with a readable error body.",
      tag: "fixed"
    },
    {
      id: 122,
      date: "September 01, 2026",
      title: "`/api/posts/[id]` fallthrough regression closed",
      body: "The fallthrough fix from 08/29 was formally regression-tested: 100 requests to `/api/posts/123` followed by a 101st, expecting a block. First attempt incorrectly returned `200` on request 101, it was traced to a stale dev server that hadn't picked up the middleware edit (Next.js middleware doesn't reliably hot-reload). After a full server restart, the same test correctly returned `429` on request 101.",
      tag: "fixed"
    },
    {
      id: 121,
      date: "September 01, 2026",
      title: "`postLimiter` verified working end-to-end",
      body: "10 requests to `/api/posts` succeed, the 11th returns `429` with a readable error body (`'Too many requests. Please slow down and try again shortly.'`), confirmed via direct curl output, not just a status code check.",
      tag: "fixed"
    },
    {
      id: 120,
      date: "September 01, 2026",
      title: "Five stub API routes built for rate-limit testing",
      body: "`app/api/posts/route.js`, `app/api/posts/[id]/route.js`, `app/api/auth/login/route.js`, `app/api/comments/route.js`, `app/api/translate/route.js` are each a minimal handler returning a stub JSON response, existing only to give Phase D's rate-limit tests something real to hit. Each file carries a comment flagging it as temporary, not production logic.",
      tag: "feature"
    },
    {
      id: 119,
      date: "August 29, 2026",
      title: "Rate limiter fallthrough gap in `pickLimiter`",
      body: "Found during code review, not from a bug report: any path under `/api/posts/*` other than the exact `/api/posts` route hit a `return null` branch in `middleware.js`, silently skipping rate limiting entirely, unlimited requests possible against something like `/api/posts/123`. Fixed by removing the special-case block so those paths correctly fall through to `generalLimiter` (100 req/60s) like every other unspecified `/api/*` route.",
      tag: "fixed"
    },
    {
      id: 118,
      date: "August 28, 2026",
      title: "Silent Login Success With No User Feedback",
      body: "`login/page.js` had no success-path logic at all. A correct login produced zero visible change, leaving the user on `/login` with no indication anything happened. Fixed by adding `useRouter`, `router.push('/')`, and `router.refresh()` on successful `signInWithPassword()`.",
      tag: "fixed"
    },
    {
      id: 117,
      date: "August 28, 2026",
      title: "Production `/api/health` Returning 500 for 20+ Days",
      body: [
        "Discovered by coincidence in Vercel logs while testing ROA-008: `roam-dusky-alpha.vercel.app` (production) has returned `500 MIDDLEWARE_INVOCATION_FAILED` on every `/api/*` route since Aug 8, confirmed via a 20-day-old ongoing Uptime Robot incident.",
        "**Root cause** identified as `Redis.fromEnv()` in `lib/ratelimit.js`, a documented flaky-lookup issue in Next.js/serverless contexts.",
        "**Fix** written, **not yet applied** to `main`."
      ],
      tag: "open"
    },
    {
      id: 116,
      date: "August 28, 2026",
      title: "Email/Password Flow Verified on Preview URL",
      body: "Confirmed full signup → confirmation email → `/auth/callback` exchange → login loop works correctly on the Vercel preview deployment, verified directly via that deployment's own Runtime Logs (a `307` through `/auth/callback`, not local terminal output).",
      tag: "feature"
    },
    {
      id: 115,
      date: "August 28, 2026",
      title: "Google OAuth Verified on Preview URL",
      body: "Confirmed Google OAuth login works correctly on the Vercel preview deployment (`roam-git-feature-roa-008-nomadcode33-2829s-projects.vercel.app`), not just localhost.",
      tag: "feature"
    },
    {
      id: 114,
      date: "August 28, 2026",
      title: "Feature Branch Preview Build Succeeded",
      body: "Following the env var fix, `feature/roa-008` built and deployed cleanly on Vercel — all 11 routes compiled, `/login` and `/signup` no longer erroring.",
      tag: "deployment"
    },
    {
      id: 113,
      date: "August 28, 2026",
      title: "Vercel Build Failure — Missing Supabase Env Vars",
      body: "Production build failed on `/login` with `@supabase/ssr: Your project's URL and API key are required`. Root cause: Vercel's Environment Variables page had zero variables configured for this project, despite ROA-002 being marked complete locally. Added all six required variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_MAPBOX_TOKEN`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`) across all environments.",
      tag: "fixed"
    },
    {
      id: 112,
      date: "August 28, 2026",
      title: "Middleware Crash — `pathname is not defined`",
      body: "New dashboard-protection block was pasted outside the `middleware()` function entirely (as free-floating module-level code), referencing `req`-derived variables with no access to `req`. Crashed every route site-wide. Fixed by moving the block inside the function and restructuring the early-return logic so non-rate-limited requests fall through correctly.",
      tag: "fixed"
    },
    {
      id: 111,
      date: "August 26, 2026",
      title: "Middleware-Based Route Protection (ROA-008 Phase E)",
      body: "Extended the existing ROA-003 rate-limiter `middleware.js` with a presence-check auth gate: any request to `/dashboard/:path*` without a cookie matching `sb-*-auth-token` redirects to `/login`. Deliberately a presence-check only, not full validation, per current guidance that middleware shouldn't be the sole security boundary.",
      tag: "feature"
    },
    {
      id: 110,
      date: "August 26, 2026",
      title: "auth.users → public.users Trigger (ROA-008 Phase D)",
      body: "Built `handle_new_auth_user()` (SECURITY DEFINER, `AFTER INSERT ON auth.users`) to auto-create a corresponding `public.users` row on every signup, with `display_name` falling back to 'New user' for email/password signups lacking a `full_name` in metadata. Verified via `prosrc` and a real signup test.",
      tag: "feature"
    },
    {
      id: 109,
      date: "August 26, 2026",
      title: "Email Confirmation Redirect Landing on Wrong URL",
      body: [
        "Confirmation link redirected to `/?code=...` instead of `/auth/callback?code=...`, leaving the auth code unexchanged.",
        "**Root cause:** `signUp()` had no `emailRedirectTo` option, and Supabase's Redirect URLs allowlist was completely empty.",
        "**Fixed** by adding `emailRedirectTo` to `signup/page.js` and adding `http://localhost:3000/auth/callback` to Supabase's allowlist."
      ],
      tag: "fixed"
    },
    {
      id: 108,
      date: "August 26, 2026",
      title: "Password Complexity Policy Clarified",
      body: "Confirmed Supabase's default is 6-character minimum only, no complexity rules. Researched current best practice (NIST SP 800-63B): favors raising minimum length over forced symbol/capital requirements. Decision: apply 'raise the minimum, skip complexity theater' when the future auth UX ticket is tackled.",
      tag: "decision"
    },
    {
      id: 107,
      date: "August 26, 2026",
      title: "Signup Error Message Renders But Is Unstyled",
      body: "Confirmed Supabase's password-length validation error reaches the UI correctly via the existing error block. No `.auth-error` class exists in `auth.css`, so the message displays as unstyled plain text. Flagged for later styling pass, not blocking.",
      tag: "fixed"
    },
    {
      id: 106,
      date: "August 26, 2026",
      title: "ROA-008 Walkthrough Rebuilt to Reflect Verified State",
      body: "Regenerated the ROA-008 auth ticket walkthrough using the ROA-001 visual widget format (lettered phases, numbered steps, why/trade-off/quiz blocks, Done-When checklist), replacing an outdated draft with one reflecting actual current progress: Google OAuth fully verified, Apple deferred, auth UI substantially built.",
      tag: "decision"
    },
    {
      id: 105,
      date: "August 25, 2026",
      title: "Google OAuth Verified Working End-to-End",
      body: "Confirmed via terminal log (`Exchange result — error: null session exists: true`) and a real `sb-*` session cookie present in DevTools. First fully working authenticated login flow in the project.",
      tag: "deployment"
    },
    {
      id: 104,
      date: "August 25, 2026",
      title: "Vercel Build Failure — 'supabaseUrl is required'",
      body: "Root-caused through a three-layer chain: (1) `handleEmailLogin` was calling `signInWithOAuth` instead of `signInWithPassword`; (2) `lib/supabase.js` had no explicit PKCE flow config; (3) the PKCE code verifier was written to localStorage client-side but read from cookies server-side. Fixed by switching to `createBrowserClient`/`createServerClient` from `@supabase/ssr` on both sides, and creating the missing `app/auth/callback/route.js` to handle the code exchange.",
      tag: "fixed"
    },
    {
      id: 103,
      date: "August 25, 2026",
      title: "Sign In Button Fake-Bolding Instead of Rendering Real Weight",
      body: "DM Sans's 600 weight was never declared in `layout.js`'s `next/font/google` config, so the browser synthesized a fake bold instead of loading the real typeface cut. Added `'600'` to the weight array.",
      tag: "fixed"
    },
    {
      id: 102,
      date: "August 25, 2026",
      title: "Font-Family Bleed on Nav Tagline and Footer",
      body: "`.auth-nav-tagline`, `.footer-links a`, and `.footer-copy` were inheriting `globals.css`'s Arial fallback instead of the project's DM Sans. Fixed via explicit `font-family` declarations on each rule; root cause in `globals.css` still open.",
      tag: "fixed"
    },
    {
      id: 101,
      date: "August 25, 2026",
      title: "Age-Gate Checkbox Layout Broken by Invalid CSS",
      body: "`.age-row` used `display: row` which is not a valid CSS value. The browser silently ignored it and fell back to default block stacking, breaking the side-by-side checkbox/text layout. Corrected to `display: flex`.",
      tag: "fixed"
    },
    {
      id: 100,
      date: "August 25, 2026",
      title: "Auth Panel Not Stretching Full Height",
      body: "`.auth-content` had `align-items: center`, silently overriding flexbox's default `stretch` behavior and leaving lavender gaps above/below the white auth panel. Removed the property; panel now correctly fills the space between nav and footer.",
      tag: "fixed"
    },
    {
      id: 99,
      date: "August 25, 2026",
      title: "Submit Button and Auth Switch-Link Styling",
      body: "Styled `.submit-btn` (gold CTA, matching the `.mission-cta` pattern from landing.css) and `.auth-switch` (the 'Don't have an account?' / 'Already have an account?' links), with hover color settled on `#c9971f`, an existing darker-gold token from `privacy.css`.",
      tag: "feature"
    },
    {
      id: 98,
      date: "August 25, 2026",
      title: "Forgot Password Link and Age-Gate Row Styling",
      body: "Styled `.forgot` (login) and `.age-row`/`.age-text` (signup's 13+ age confirmation checkbox with embedded Terms/Privacy links), including checkbox `accent-color` theming.",
      tag: "feature"
    },
    {
      id: 97,
      date: "August 25, 2026",
      title: "Auth Form Field Styling",
      body: "Styled `.field-wrap`, `.field-label`, and the actual email/password `<input>` elements, including a lavender-tinted background matching brand tokens and a `:focus` border-color swap for accessibility.",
      tag: "feature"
    },
    {
      id: 96,
      date: "August 25, 2026",
      title: "Auth Divider Styling (.divider, .div-line, .div-text)",
      body: "Built the 'or' separator between the OAuth button and the email/password form using a flex row with two `flex: 1` line elements, a self-balancing layout that doesn't require manual width math.",
      tag: "feature"
    },
    {
      id: 95,
      date: "August 18, 2026",
      title: "ROA-008 Walkthrough Regenerated Against Real State",
      body: "Rebuilt the ROA-008 auth ticket walkthrough using the visualize/show_widget tool, replacing a stale static draft. Reflected actual current state: Phases A and B done (Google OAuth fully configured, Apple deferred), Phase C mid-build, Phases D–F outstanding.",
      tag: "documentation"
    },
    {
      id: 94,
      date: "August 18, 2026",
      title: "Session Conversation Tracker Reset",
      body: "Reset the standing conversation tracker to a 40-conversation cycle for the Roam project. Display 'X/40' at the top of every response, remind at 40 without forcing a stop, and continue counting if explicitly told to keep going.",
      tag: "decision"
    },
    {
      id: 93,
      date: "August 18, 2026",
      title: "Conversation tracker rule corrected to idle-gap-triggered, not length-triggered",
      body: "Originally worded ambiguously as re-checking the date if a conversation ran 4-6+ hours; corrected to mean 4-6+ hours of inactivity within an ongoing conversation, not total length or message count.",
      tag: "decision"
    },
    {
      id: 92,
      date: "August 18, 2026",
      title: "Flagged-items tracker merged and updated to v12",
      body: "Reconciled the prior master list against this session's progress. Items promoted, resolved, or newly flagged (see Bug Log and Optimizations below for specifics).",
      tag: "documentation"
    },
    {
      id: 91,
      date: "August 18, 2026",
      title: "Nav.jsx converted from `<button>` to `<Link>` for Log in / Sign up",
      body: "`<button>` doesn't navigate on its own; `<Link>` does client-side routing. Since these elements' job is navigation, not an in-page action, they were the wrong element type. `nav.css`'s `.btn-ghost`/`.btn-solid` were also given `:hover` states and `transition` properties they were previously missing, mirroring the existing pattern in `landing.css`.",
      tag: "refactor"
    },
    {
      id: 90,
      date: "August 18, 2026",
      title: "Client-side navigation CSS bleeding between /privacy, /terms, and the landing page",
      body: [
        "**Root cause:** `privacy.css` and `terms.css` used unscoped `:root` variables and bare-tag selectors (`body`, `header`, `a`, `section`), which persist across Next.js client-side route changes since the DOM isn't fully torn down.",
        "**Fixed** by scoping every selector under `.privacy-page` / `.terms-page` wrapper classes and adding matching outer `<div>` wrappers in each page's JSX. Also required wrapping root `layout.js`'s `{children}` in a consistent `<main id='page-root'>` element so every route, including ones outside any route group, gets a stable DOM anchor for React to diff against."
      ],
      tag: "fixed"
    },
    {
      id: 89,
      date: "August 18, 2026",
      title: "auth.css built incrementally: nav, content panel, form-inner, title/sub, oauth button",
      body: "Styled and visually confirmed via screenshots: `.auth-nav` (stacked logo + tagline), `.auth-content`/`.auth-panel-body` (full-height flex panel), `.auth-form-inner` (width-capped inner column, settled at 32rem after live iteration), `.auth-title`/`.auth-sub`, and `.oauth-btn` with hover state and icon.",
      tag: "feature"
    },
    {
      id: 88,
      date: "August 18, 2026",
      title: "Per-page auth tagline merged into AuthNav via usePathname()",
      body: "Originally built as a separate `.auth-panel-top` block per page; redesigned mid-session to live inside the shared `AuthNav` component instead, using `usePathname()` to switch between 'Welcome back' and 'Join the map' based on the current route. Avoids duplicating the block across both pages while keeping the tagline page-accurate.",
      tag: "decision"
    },
    {
      id: 87,
      date: "August 18, 2026",
      title: "login/page.js and signup/page.js built",
      body: "Both pages written with Google OAuth handlers (`supabase.auth.signInWithOAuth`), email/password handlers (`signInWithPassword` / `signUp`), controlled form state, signup's age-gate checkbox with client-side validation, and Terms/Privacy links wired to real routes. Apple Sign-In intentionally omitted, matching the prior session's deferral decision.",
      tag: "feature"
    },
    {
      id: 86,
      date: "August 18, 2026",
      title: "Auth route group scaffolded",
      body: "Built `app/(auth)/layout.js`, `AuthNav.jsx`, and `AuthFooter.jsx` as a sibling route group to `(main)`, giving `/login` and `/signup` their own minimal shell (logo-only nav, 3-link footer) separate from the main site's full Nav/Footer.",
      tag: "feature"
    },
    {
      id: 85,
      date: "August 17, 2026",
      title: "Auth pages confirmed as separate route group from (main)",
      body: "Reviewed uploaded auth and landing mockups directly. Confirmed the auth nav has no button markup at all (logo only) versus (main)'s nav which has Log in/Sign up buttons. Two structurally different components, not one with conditional visibility. Auth pages will get their own minimal layout outside (main).",
      tag: "decision"
    },
    {
      id: 84,
      date: "August 17, 2026",
      title: "Apple Sign-In deferred, no free tier",
      body: "Confirmed Apple Sign-In requires a $99/yr Developer membership with no workaround. Chukwuemeka chose to skip it for now rather than pay immediately. Flagged as a hard blocker for Phase 5 App Store submission specifically, not for the rest of ROA-008.",
      tag: "decision"
    },
    {
      id: 83,
      date: "August 17, 2026",
      title: "Google OAuth fully configured end to end",
      body: "Created Google Cloud project roam-auth, configured the OAuth consent screen (External audience, Roam branding), created a Web application OAuth client with the Supabase callback URL registered, and saved the Client ID/Secret into Supabase's Google provider. Nonce and email-fallback settings confirmed at correct defaults.",
      tag: "deployment"
    },
    {
      id: 82,
      date: "August 08, 2026",
      title: "Flagged-items tracker merged to v10",
      body: "Reconciled prior master list with this session's findings; promoted the proxy migration and ROA-003 blocker into active sections.",
      tag: "documentation"
    },
    {
      id: 81,
      date: "August 08, 2026",
      title: "middleware.js misplaced inside app/",
      body: "File was created at `app/middleware.js`, where Next.js's middleware convention never looks. Moved to project root, sibling to `app/`.",
      tag: "fixed"
    },
    {
      id: 80,
      date: "August 08, 2026",
      title: "Upstash Redis database provisioned",
      body: "Created `roam-ratelimit` Redis DB in `us-west-2` (matched to Supabase's region rather than Vercel's default `us-east-1`), eviction enabled, credentials added to `.env.local`.",
      tag: "deployment"
    },
    {
      id: 79,
      date: "August 08, 2026",
      title: "ROA-003 middleware wiring built",
      body: "Created root-level `middleware.js` with IP-based route matching (`pickLimiter`) that applies the correct limiter per API path and returns 429 with rate-limit headers on breach.",
      tag: "feature"
    },
    {
      id: 78,
      date: "August 08, 2026",
      title: "ROA-003 rate limiter config built",
      body: "Created `lib/ratelimit.js` with five named Upstash sliding-window limiters (post: 10/min, auth: 5/min, comment: 20/min, translate: 30/min, general: 100/min), each on its own Redis key prefix so one route's traffic can't eat into another's quota.",
      tag: "feature"
    },
    {
      id: 77,
      date: "August 07, 2026",
      title: "Dev-log cyan → purple token migration",
      body: "`--dn-border-hover`/`--dn-border-active` and related rgba values switched from cyan to a purple accent (`rgba(139,127,212,...)`), fixing badge borders, card-hover tint, ambient glow, and scrollbar thumb in one shared edit.",
      tag: "refactor"
    },
    {
      id: 76,
      date: "August 07, 2026",
      title: "Tabler icons rendering as blank boxes",
      body: "CDN webfont link from the original mockup was never ported into the Next.js root layout, icons failed silently with no console error. Migrated to `@tabler/icons-react` components instead of chasing the CDN link, removing the font-load dependency entirely.",
      tag: "fixed"
    },
    {
      id: 75,
      date: "August 07, 2026",
      title: "Landing page shipped",
      body: "Hero, features, and mission sections built in `app/(main)/page.js` with a dedicated `landing.css`. Matches the approved mockup; `.frame` wrapper deliberately dropped for full-bleed layout inside the real app shell.",
      tag: "feature"
    },
    {
      id: 74,
      date: "August 07, 2026",
      title: "Terms of Service — fully wired",
      body: "Termly questionnaire completed (address fields filled, liability cap deliberately set to $0.00 USD to match the Disclaimer's no-liability framing), `terms.html` converted to JSX with the same bug-fix pass as `privacy.jsx`. `/terms` is live.",
      tag: "feature"
    },
    {
      id: 73,
      date: "August 07, 2026",
      title: "CSS import scope bug",
      body: "`nav.css`/`footer.css` were imported in `page.js` instead of `app/(main)/layout.js`, where Nav and Footer actually render. Would've silently left future `(main)`-nested routes (dashboard, etc.) unstyled the moment they shipped. Moved imports to the layout.",
      tag: "fixed"
    },
    {
      id: 72,
      date: "August 06, 2026",
      title: "Dev log sizing and phone layout",
      body: "Diagnosed and fixed a rendering-size mismatch between the Next.js dev log and its SonicVerse source, then rebuilt the phone-width sidebar from a horizontal scroll into a proper 3/3/2 grid. Full detail in Bug Log below.",
      tag: "fixed"
    },
    {
      id: 71,
      date: "August 06, 2026",
      title: "Privacy and Terms converted to JSX",
      body: "Replaced the `dangerouslySetInnerHTML` approach with real `.jsx` components for both legal pages, each with a dedicated scoped CSS file instead of an unscoped inline `<style>` block. Resolved several real bugs in the process: a `clas` typo instead of `className`, an unclosed `<br>` (JSX requires self-closing tags), an inline `style='margin-top:0;'` string where JSX requires an object (`style={{ marginTop: '0' }}`), and missing bullet points on plain `<ul>` elements caused by Tailwind's global Preflight reset silently stripping list styling site-wide.",
      tag: "feature"
    },
    {
      id: 70,
      date: "August 06, 2026",
      title: "Route-group shell restructure",
      body: "Split root `app/layout.js` from a combined Nav/Footer/fonts file into two layers: root layout now holds only `globals.css`, font variables, and `<html>/<body>`, genuinely universal content every route needs. A new `app/(main)/layout.js` holds Nav and Footer, wrapping only pages nested inside `(main)/`. `privacy`, `terms`, and `dev-log` sit as siblings to `(main)`, not children, giving them standalone rendering with no Nav/Footer. Confirmed working via live screenshots showing correct layout application on both sides of the split.",
      tag: "feature"
    },
    {
      id: 69,
      date: "August 05, 2026",
      title: "Saves-table purge-vs-hide behavior on block",
      body: [
        "Resolved the open question of what happens to a saved post when the post's author blocks the saver.",
        "**Decision:** hide, not delete. The save row stays in the database; it's already invisible to the blocked user because the underlying post is already unreadable to them under the existing mutual-blocking RLS policy. Hard-deleting the save row was considered and rejected. It would silently destroy the saving user's own data over an action the other person took, and it would contradict the existing 'unblock does not auto-restore follows' precedent for no equivalent reason. No new trigger or code required; closes on existing RLS behavior alone."
      ],
      tag: "decision"
    },
    {
      id: 68,
      date: "August 04, 2026",
      title: "ROA-019 closed — alert pipeline proven end-to-end",
      body: "Forced a real outage by removing the health route and redeploying. Confirmed a genuine DOWN email at 12:22 and a genuine recovery/UP email at 12:27, both landing in the inbox. Incident logged in Uptime Robot's dashboard as Resolved with correct 404 root cause and 5m 4s duration, closing out every Phase E Done-When item with actual verified evidence, not configuration alone.",
      tag: "deployment"
    },
    {
      id: 67,
      date: "August 04, 2026",
      title: "Uptime Robot monitoring live for production",
      body: "Created Uptime Robot account, added an HTTP(s) monitor targeting the health endpoint specifically (not the homepage) on a 5-minute check interval. Alert contact (email) confirmed attached and working via a real Test Notification before moving to the forced-outage test.",
      tag: "feature"
    },
    {
      id: 66,
      date: "August 04, 2026",
      title: "Health check endpoint deployed and verified",
      body: "Created `/api/health` returning 200 OK with no auth or DB dependency. Verified locally via `npm run dev` + curl against `localhost:3000`, then verified again against the live Vercel deployment (`roam-dusky-alpha.vercel.app`). Both returned clean 200s with correct JSON body before moving to monitor setup.",
      tag: "deployment"
    },
    {
      id: 65,
      date: "August 04, 2026",
      title: "ROA-014 Full Restore Verified Against Production",
      body: "Performed a real restore into a fresh scratch database and matched row counts directly against production (`users` 2/2, `places` 1/1, all other tables 0/0). Closing ROA-014 on proven evidence rather than a passing CI check.",
      tag: "fixed"
    },
    {
      id: 64,
      date: "August 04, 2026",
      title: "ROA-014 Workflow Live-Verified in GitHub Actions",
      body: "Confirmed via direct inspection of a real automated run's output file (`head -5`), not an assumption that the corrected `.github/workflows/db-backup.yml` was actually live and producing correct output, resolving an earlier dispute over whether the fix had been pushed.",
      tag: "deployment"
    },
    {
      id: 63,
      date: "August 04, 2026",
      title: "Missing PostGIS Extension on Restore",
      body: "The `--schema public` scoping fix silently dropped the cluster-level `CREATE EXTENSION postgis` statement, breaking every geometry-dependent table (`places`, `post_points`) on restore. Fixed via an idempotent `CREATE EXTENSION IF NOT EXISTS postgis;` prepended to the schema dump.",
      tag: "fixed"
    },
    {
      id: 62,
      date: "August 04, 2026",
      title: "Roles Dump Added to Backup Workflow",
      body: "Added a third, previously-missing `--role-only` dump alongside schema and data, closing a real coverage gap for any custom Postgres roles beyond Supabase's defaults.",
      tag: "feature"
    },
    {
      id: 61,
      date: "August 04, 2026",
      title: "Sensitive Schema Exposure (`auth`/`storage` in backups)",
      body: "Discovered the corrected dump was including `auth.users`, `auth.sessions`, `auth.refresh_tokens`, and `storage.objects`. Encrypted passwords and live session tokens are in a file exported to a personal machine and a 30-day-retention R2 bucket. Fixed by scoping both dump calls to `--schema public`.",
      tag: "fixed"
    },
    {
      id: 60,
      date: "August 04, 2026",
      title: "Data Dump Format Bug (`--use-copy` missing)",
      body: "Adding `--data-only` alone still produced zero `COPY` statements. Root-caused via Supabase CLI documentation that `--data-only` requires the separate `--use-copy` flag to emit restorable COPY-format rows instead of a different internal format.",
      tag: "fixed"
    },
    {
      id: 59,
      date: "August 04, 2026",
      title: "Schema-Only Backup Bug Identified",
      body: "Root-caused via direct file inspection that `supabase db dump` with no flags produces zero `COPY` statements. The ROA-014 backup workflow had been silently producing structure-only backups with no actual row data since its first successful run.",
      tag: "fixed"
    },
    {
      id: 58,
      date: "August 04, 2026",
      title: "Local Postgres CLI Tools Not on PATH",
      body: "`createdb: command not found` in Terminal despite Postgres.app running. **Root cause:** Postgres.app's CLI binaries live inside the app bundle, not the shell's default PATH. Fixed by writing `/Applications/Postgres.app/Contents/Versions/14/bin` into `/etc/paths.d/postgresapp` and restarting the terminal session.",
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
      body: [
        "`pg_dump` failed with `Network is unreachable` against the direct Supabase connection string.",
        "**Root cause:** GitHub Actions runners don't support IPv6 egress, and the direct connection host resolves IPv6-only.",
        "**Fixed** by swapping `SUPABASE_DB_URL` to the Transaction Pooler connection string (IPv4)."
      ],
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

   /*
    { id: , 
      title: "",
      priority: "",  
      body: ""
    },
    
    { id: 2, 
      title: "Skeleton Loading & Tile Routes",
      priority: "high",  
      body: [
        "Needs to be in the codebase to handle high network traffic. Currently, all the data is loaded at once. If a lot of users hit the site at once, it could cause performance issues.",
        "I also need to tile routing (signified by the '#' in url) for users to go back to a character they just searched. When you click the back button on the current build, takes you back to the home page. Tile routing allows for a better user experience and to easily navigate back to characters they just searched for without having to search again."
      ],
      mediaItems: [
        { type: "image", src: "/img/planning-development/skeleton-button-tile-links.png", caption: "Example of skeleton loading states and character tile routing." },
      ]
    },
    
    */
  future: [
    // ROA-016: SESSION 18.4 - 18.5
    // ROA-044: SESSION 20
    /* high */
    { id: 1, 
      title: "ROA-045: Resend as Supabase SMTP Provider",
      priority: "high",  
      body: "The built-in Supabase email sender is rate limited across the whole project. Needs a verified sending domain, custom SMTP, rate limits, and branded templates. Required before signups reopen."
    },
    { id: 2, 
      title: "ROA-008C: Auth UX Gaps and Redirect Configuration",
      priority: "high",  
      body: "Toast feedback for errors, a check-your-email page, forgot password, show password, a hash-and-query error reader, and OAuth disclosure research. It also owns the Redirect URL cleanup and setting Site URL to the production domain. Required before signups reopen."
    },
    { id: 3, 
      title: "Verify `redact()` against a real sensitive payload",
      priority: "high",  
      body: "The redaction logic in `lib/logger.js` was explained and understood via code walkthrough but never exercised with a live call passing a real `password`/`token`-shaped key through `logRequest`. Needed before trusting the 'no sensitive data leaks' Done-When item in a real production scenario rather than on code-reading alone."
    },
    { id: 4, 
      title: "Column-grant audit of every other table",
      priority: "high",  
      body: "The same default grants probably exist on posts, comments, and the rest (inferred). RLS does not hide columns, so the grant queries need running per table before signups reopen."
    },
    { id: 5, 
      title: "ROA-017 — Sentry error tracking",
      priority: "high",  
      body: "Confirmed as the next ticket to start. No dependency blockers; equally unblocked alongside ROA-016 per Wave 2 sequencing, but explicitly chosen as next. Needed so real errors in production (currently only visible via the ROA-015 logger's stdout) get proper alerting and aggregation instead of requiring a manual log search."
    },
    { id: 6, 
      title: "ROA-018 — Install and Initialize PostHog",
      priority: "high",  
      body: "Now fully unblocked (`deps: ['ROA-002','ROA-007'], both closed`). The consent gate point already exists inside `CookieBanner.jsx`'s `handleAccept`. This ticket just needs to install `posthog-js`, wire the init call into that exact gate, and add the seven listed manual tracking events (post created, upvoted, map pin clicked, place viewed, user followed, translate clicked, profile viewed)."
    },
    
    /* medium */
    { id: 7, 
      title: "ROA-041: Fix setState Inside Effects",
      priority: "medium",  
      body: "Locations are TabNav.jsx line 193 and CookieBanner.jsx line 20, plus a third effect that calls setAnnounced(message ?? '') whose file wasn't shown (probably the LiveRegion component, unverified). Derive values during render where possible and keep the cookie banner focus handlers working."
    },
    { id: 8, 
      title: "ROA-040: Escape Unescaped JSX Entities",
      priority: "medium",  
      body: "The old ~95 count is stale. The 10/31 baseline is 104 problems (102 errors, 2 warnings) in total, which includes the ROA-041 errors, so recount by rule before editing."
    },
    { id: 9, 
      title: "ROA-049: Clear the Remaining Non-Breaking Audit Findings",
      priority: "medium",  
      body: "Run `npm audit fix --dry-run` first, apply the six non-breaking fixes in their own commit, repeat the Sentry test error if @sentry/nextjs, the bundler plugin, or next changes, and decide on shadcn, zod, and moving shadcn to devDependencies. Keeps the audit clean enough that a new critical or high finding stands out. Any time after ROA-044."
    },
    { id: 10, 
      title: "Sentry Coverage: global-error.jsx and Sentry.setUser()",
      priority: "medium",  
      body: "ROA-017's cleanup removed app/global-error.jsx, the file Sentry generates to report root-level React render errors (inference). Decide whether to add it back, and extend Sentry.setUser() beyond auth/signup/route.js."
    },
    { id: 11, 
      title: "Decide on revoking TRUNCATE and TRIGGER",
      priority: "medium",  
      body: "anon and authenticated hold both on public.users, likely on other tables too. The API probably doesn't expose TRUNCATE (inferred, untested), but the grants should be a conscious choice."
    },
    { id: 12, 
      title: "Route guard coverage for new pages and APIs",
      priority: "medium",  
      body: "The age-gate guard covers only /dashboard. Add each new route to the guard or give it a `getUser()` plus `confirmed_age` check, and review /api/posts, /api/comments, and /api/translate."
    },
    { id: 13, 
      title: "Profile columns after the lockdown",
      priority: "medium",  
      body: "location_preference is readable and editable by every signed-in user. Each new column needs an explicit GRANT, and a logged-out profile page needs a view or an API route."
    },
    { id: 14, 
      title: "Country source for the age rule",
      priority: "medium",  
      body: "Decide between the Vercel header and the ip-api.com lookup. The lookup runs over plain HTTP (I believe the free tier has no HTTPS, unverified) and sends user IPs. The fail-safe to age 16 stays."
    },

    /* low */
    { id: 15, 
      title: "ROA-042: Logo Navigation and Scroll Reset",
      priority: "low",  
      body: "The Roam logo doesn't navigate home when already on `/`, and page navigation doesn't reliably scroll to top. Wrap the logo in a real <Link href="/"> with forced scroll reset."
    },
    { id: 16, 
      title: "ROA-046: Dev-Log Tabs Keep the Previous Scroll Position",
      priority: "low",  
      body: "Three decisions are open: dock save and restore behavior, back and forward behavior, and direct ?tab= loads."
    },
    { id: 17, 
      title: "ROA-047: Build the About Page",
      priority: "low",  
      body: "The footer About link points to # on every page. Needs owner copy before build, one h1, and the shared page shell."
    },
    { id: 18, 
      title: "ROA-048: Dev-Log Input Delay (Conditional)",
      priority: "low",  
      body: "Open only if slowness is reported on a real device or field INP on /dev-log exceeds 200ms. Start with a Chrome Performance trace."
    },
    { id: 19, 
      title: "Windows NVDA Skip Link Retest",
      priority: "low",  
      body: "The skip link was not announced on a fresh load on Windows. Retest in a fresh Guest window with no click before claiming Windows screen reader support."
    },
    { id: 20, 
      title: "Verify Map Popup and Dialog Accessibility",
      priority: "low",  
      body: "Neither exists yet. Run docs/a11y-checklist.md when the map tickets and the first real modal are built, including focus return on close."
    },
    { id: 21, 
      title: "Lint cleanup (ROA-040 and ROA-041)",
      priority: "low",  
      body: "The baseline is 103 problems. About 99 are unescaped-entity errors (inferred), and 3 are set-state-in-effect errors in TabNav.jsx, CookieBanner.jsx, and LiveRegion.jsx."
    },
    { id: 22, 
      title: "Small ROA-044 follow-ups",
      priority: "low",  
      body: "The route's 409 also covers 'no public.users row'. The ROA-044 dev-log entry (devlog-data.js line 1610) still reads as pending work."
    }
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
      id: 59,
      month: "November 2026",
      date: "November 03, 2026",
      title: "Write-lock test: six manual runs became one harness",
      body: "A loop with an inner `EXCEPTION WHEN insufficient_privilege` block tests each column separately and ends in a rolled-back summary.",
      bullets: [
        "A bio control proves the harness can print ALLOWED",
        "No test can be skipped by accident",
        "Nothing is saved"
      ],
      tags: "refactor"
    },
    {
      id: 58,
      month: "November 2026",
      date: "November 03, 2026",
      title: "Age-gate page: hard reload replaced with the Next.js router",
      body: "The reload wasn't needed because the age-gate route doesn't change a login cookie.",
      bullets: [
        "`router.replace('/')` leaves no Back-button trap",
        "`router.refresh()` re-reads server data",
        "Clears the `no-location-assign-relative-destination` warning"
      ],
      tags: "refactor"
    },
    {
      id: 57,
      month: "November 2026",
      date: "November 03, 2026",
      title: "Lockdown SQL builds its column lists from the live table",
      body: "Hardcoding 9 and 5 column names could drift from the table, so the lists come from `information_schema.columns` minus two deny arrays.",
      bullets: [
        "Table-level grants are revoked, then columns are granted by name",
        "Columns added later are inaccessible until granted (fails safe)",
        "One DO block applies fully or not at all"
      ],
      tags: "refactor"
    },
    {
      id: 56,
      month: "November 2026",
      date: "November 03, 2026",
      title: "Completion check: three nullable fields became one boolean",
      body: "A single `confirmed_age` stays readable after the sensitive columns are hidden.",
      bullets: [
        "Fewer columns read in proxy.js and the callback",
        "A failed country lookup can no longer loop a user",
        "It's one of the 9 user-readable columns"
      ],
      tags: "refactor"
    },
    {
      id: 55,
      month: "November 2026",
      date: "November 03, 2026",
      title: "proxy.js: three guard blocks became one",
      body: "Two cookie-name checks and a separate age-gate block shared one idea, so I merged them.",
      bullets: [
        "One `createServerClient` and one `getUser()` per guarded request",
        "Redirects by outcome (no user, incomplete, completed)",
        "The commented TEMP test line is gone"
      ],
      tags: "refactor"
    },
    {
      id: 54,
      month: "November 2026",
      date: "November 03, 2026",
      title: "Age-gate route: check-then-write became one atomic update",
      body: "I moved the 'already done?' check into the write itself, so two simultaneous submissions can't both succeed.",
      bullets: [
        "`.eq('id', user.id).eq('confirmed_age', false).select('id')` writes only an unfinished row and returns what changed",
        "Zero rows returns 409",
        "The user id comes from `getUser()`, so the admin client can't be pointed at another row"
      ],
      tags: "refactor"
    },
    {
      id: 53,
      month: "November 2026",
      date: "November 01, 2026",
      title: "Production Verification: One Pass in Incognito",
      body: "The first test cycles mixed a normal browser with stale cookies and blockers. Moving checks to Incognito removed that noise.",
      bullets: [
        "Smoke test, health endpoint, email and Google login, cookie inspection, and Sentry browser events all run there",
        "Production has no Vercel login in front of it, so Incognito needs no extra step"
      ],
      tags: "refactor"
    },
    {
      id: 52,
      month: "November 2026",
      date: "November 01, 2026",
      title: "Branch Flow: Sync Check Before Branching and Before Promotion",
      body: "I felt dev-log entries belong on main, so the flow now handles that instead of forbidding it.",
      bullets: [
        "`git fetch origin` then `git log --oneline staging..main` at step 1 and again before the fast-forward",
        "If it prints anything, main is merged into staging first and the preview is checked",
        "Keeps `git merge --ff-only staging` working on main"
      ],
      tags: "refactor"
    },
    {
      id: 51,
      month: "October 2026",
      date: "October 31, 2026",
      title: "Test Workflow: Baseline Capture Before Every Change",
      body: "I realized a 'zero' result only means something if the check could have found the problem first. Every ROA step now saves the before state.",
      bullets: [
        "Build log with the warning present before the change, lint summary (103 problems) before the upgrade",
        "Before, middle, and final audit JSON files stored outside the repo",
        "`git diff --stat A B` run on unchanged code before blaming the upgrade for the proxy.js behavior"
      ],
      tags: "refactor"
    },
    {
      id: 50,
      month: "October 2026",
      date: "October 31, 2026",
      title: "Sentry Config: Import Path Change in Its Own Commit",
      body: "The deprecation warning was harmless today but would break on the Sentry v11 upgrade, so I moved it before it could.",
      bullets: [
        "One line changed at next.config.mjs line 1",
        "Separate commit, so it can be reverted without undoing the Next.js bump",
        "Verified by comparing a captured before log (4 matching lines) with an after log (0)"
      ],
      tags: "refactor"
    },
    {
      id: 49,
      month: "October 2026",
      date: "October 31, 2026",
      title: "Dependency Maintenance: Lockfile-Only Refresh Instead of a Broad Audit Fix",
      body: "I wanted the audit to read clean, but `npm audit fix` can change dozens of transitive versions at once, and `--force` would cross majors. The fix was to refresh only the packages that matter.",
      bullets: [
        "`npm update js-yaml nanoid` re-resolved within the ranges the parents already allowed",
        "Only package-lock.json changed (6 insertions, 6 deletions) in its own commit",
        "Build and lint were rerun before committing, so a break never entered history"
      ],
      tags: "refactor"
    },
    {
      id: 48,
      month: "October 2026",
      date: "October 30, 2026",
      title: "CookieBanner: Focus Handling on Dismiss",
      body: "I realized a focus call tied to a useEffect on the banner's visibility would also run on first load and steal focus on every visit, so I tied it to the click instead.",
      bullets: [
        "Added moveFocusToMain(), which focuses main#main-content with preventScroll",
        "Called it after setVisible(false) in handleAccept and handleDecline",
        "main-content already had tabIndex={-1}, so it takes script focus without becoming a Tab stop"
      ],
      tags: "refactor"
    }, 
    {
      id: 47,
      month: "October 2026",
      date: "October 20, 2026",
      title: "Skip link and landmarks: one main per page, holding only content",
      body: "I realized the skip link was only as good as its target. The root `<main id='page-root'>` wrapped the nav and footer, so pressing Enter on it moved focus to the top of a region that still contained the nav.",
      bullets: [
        "Root layout: `<main>` became `<div id='page-root' className='flex-1 flex flex-col'>`, and the link now points to `#main-content`.",
        "(main) and (auth) layouts: the content wrapper became `<main id='main-content' tabIndex={-1}>`, with Nav and Footer outside it.",
        "Privacy, terms, and dev-log: their own top wrappers became `<main>`.",
        "`main#main-content[tabindex='-1']:focus { outline: none }` keeps the programmatic focus target from drawing a ring, without touching the dev-log column, which has `tabindex='0'`."
      ],
      tags: "refactor"
    },  
    {
      id: 46,
      month: "October 2026",
      date: "October 20, 2026",
      title: "Skip link stacking: focus:z-[10000]",
      body: "I thought a color fix was needed until the computed background came back white. The problem was paint order, not color.",
      bullets: [
        "`focus:z-50` became `focus:z-[10000]`, above the dev-log top bar (100), sidebar (101), overlay (200), and the cookie banner (9999).",
        "A custom CSS rule with the same z-index did not apply. The computed value stayed 50, so I removed it and fixed the utility class itself."
      ],
      tags: "refactor"
    },
    {
      id: 45,
      month: "October 2026",
      date: "October 18, 2026",
      title: "Hero focus ring as a scoped override, not a global change",
      body: "I considered a two-tone global ring, but that touches every focus style, including shadcn's box-shadow rings.",
      bullets: [
        "`.hero :focus-visible { outline-color: #ffffff }` in landing.css only changes the color inside the hero.",
        "The global ring stays `#2563eb` everywhere else, which measures 3.35:1 to 5.17:1 against the other backgrounds I checked."
      ],
      tags: "refactor"
    },
    {
      id: 44,
      month: "October 2026",
      date: "October 17, 2026",
      title: "Footer and hero text contrast through alpha, not new hex codes",
      body: "I realized the failing text wasn't hex at all. It was `rgba(237, 232, 255, alpha)` over solid backgrounds.",
      bullets: [
        "Footer links .4 to .6 and footer copy .25 to .55 (footer.css and auth.css).",
        "Hero subtitle .65 to .9, hero tag `#f1db8d`, auth 'or' divider `#6a6f77`.",
        "My alpha model reproduced axe's own numbers (3.35, 2.09, 3.37, 3.46), so I trusted it for the new values."
      ],
      tags: "refactor"
    },
    {
      id: 43,
      month: "October 2026",
      date: "October 17, 2026",
      title: ".dn-code-lang: remove opacity, keep the token",
      body: "The color token was fine at 6.76:1 on `#050508`. The `opacity: 0.6` was what dropped it to 3.01:1.",
      bullets: [
        "Deleted one line in css/devlog.css and left `--dn-text-dim` alone."
      ],
      tags: "refactor"
    },
    {
      id: 42,
      month: "October 2026",
      date: "October 17, 2026",
      title: "Footers and cookie banner: same-tab internal links",
      body: "Internal links gain nothing from opening a new tab.",
      bullets: [
        "Footer.jsx and AuthFooter.jsx dropped `target='_blank'`.",
        "The banner's Privacy Policy link became `<Link href='/privacy'>` with an `import Link from 'next/link'`."
      ],
      tags: "refactor"
    },      
    {
      id: 41,
      month: "October 2026",
      date: "October 16, 2026",
      title: "Cookie banner: reserve space instead of hiding content",
      body: "The fixed bar covered the focused footer links, and a fixed height would break as the text wraps at different widths. Measuring the real height solved both.",
      bullets: [
        "A ResizeObserver effect writes `--cookie-banner-h` and cleans up on dismiss.",
        "`body { padding-bottom }` gives the page room, and `scroll-padding-bottom` keeps focused elements clear of the bar.",
        "The effect sets no React state, so the ROA-041 warning count doesn't grow."
      ],
      tags: "refactor"
    }, 
    {
      id: 40,
      month: "October 2026",
      date: "October 15, 2026",
      title: "Auth forms: announce errors without redesigning them",
      body: "The errors were form-level server messages, so per-field wiring would have meant parsing error strings. A single attribute on the existing paragraph does the job and leaves the toast redesign to ROA-008C.",
      bullets: [
        "`role='alert'` on `.auth-error` across three pages.",
        "No class, layout, or color changes.",
        "Live-region behavior carries forward when the toasts replace the paragraph."
      ],
      tags: "refactor"
    }, 
    {
      id: 39,
      month: "October 2026",
      date: "October 15, 2026",
      title: "Dev-log TabNav: semantics over appearance",
      body: "The page looked right but the markup said the wrong things: a second landmark, no current state on the active tab, a silent toast, and an emoji in the button name. The fix was all in structure, not styling.",
      bullets: [
        "`<main>` to `<div>`, with `className` and `ref` kept so scroll behavior is unchanged.",
        "`aria-current` reuses the same comparison that sets the `active` class, so the two cannot drift.",
        "The toast container stays mounted and only its text changes.",
        "`aria-hidden` on the icon span leaves the emoji visible and out of the name."
      ],
      tags: "refactor"
    }, 
    {
      id: 38,
      month: "October 2026",
      date: "October 13, 2026",
      title: "Dev-log `CardMedia`: smarter alt and video attributes",
      body: "I wanted a screenshot never to vanish for a blind user, and a caption never to be read twice.",
      bullets: [
        "`alt={media.alt ?? (media.caption ? '' : 'Dev log screenshot')}`.",
        "`muted` added to the `<video>` for silent clips."
      ],
      tags: "refactor"
    }, 
    {
      id: 37,
      month: "October 2026",
      date: "October 13, 2026",
      title: "Callback: age-gate completeness no longer needs `signup_country`",
      body: "A failed IP lookup (localhost, VPN) looped email users back into the age gate.",
      bullets: [
        "Check reduced to `!date_of_birth || !tos_accepted_at`.",
        "Google users still reach the gate because they have neither."
      ],
      tags: "refactor"
    }, 
    {
      id: 36,
      month: "October 2026",
      date: "October 13, 2026",
      title: "Signup route: `admin.createUser` to `signUp`",
      body: "The admin call sends no email and ignores the signups toggle.",
      bullets: [
        "New `createServerClient` with `cookieStore`, `emailRedirectTo` set to `{origin}/auth/callback`.",
        "`supabaseAdmin` kept for the `users` row update only.",
        "Repeat emails return 'That email is already registered.' via an `identities.length === 0` check."
      ],
      tags: "refactor"
    }, 
    {
      id: 35,
      month: "October 2026",
      date: "October 01, 2026",
      title: "Dev-log: delete the unused Sidebar",
      body: "A leftover from another project (React Router `to` props, 'SonicVerse' text) carried a failing overlay `div`.",
      bullets: [
        "Confirmed with an import grep before `git rm components/dev-log/Sidebar.jsx`.",
        "Left `devlog.css` alone and logged the dead `sidebar-*` rules."
      ],
      tags: "refactor"
    },   
    {
      id: 34,
      month: "September 2026",
      date: "September 30, 2026",
      title: "ROA-016 walkthrough: Phase F reordered",
      body: "I realized a screen reader session shouldn't be spent on something a linter would have shown me.",
      bullets: [
        "Linter re-run moved first, then keyboard-only test, then screen reader, then commit.",
        "Step numbers stayed stable so the handoff references still match."
      ],
      tags: "refactor"
    },  
    {
      id: 33,
      month: "September 2026",
      date: "September 30, 2026",
      title: "`globals.css` token merge after shadcn overwrite",
      body: "Realized a one-component install could silently nuke the entire theme system if I didn't check the diff immediately after running a scaffolding tool.",
      bullets: [
        "Restored original hex-based `--background`/`--foreground` tokens and the `@media (prefers-color-scheme: dark)` block",
        "Pointed `--font-sans` at the project's actual `--font-dm-sans` variable instead of shadcn's generic default",
        "Removed `html { @apply font-sans; }`, which would have silently overridden the project's existing font classes",
        "Kept shadcn's `--card`, `--popover`, `--ring`, and `--radius-*` tokens intact since Dialog depends on them"
      ],
      tags: "refactor"
    },   
    {
      id: 32,
      month: "September 2026",
      date: "September 26, 2026",
      title: "Landmark structure: `<main>` → `<div>` across route-group layouts",
      body: "Realized that showing a clean accessibility tree mattered more than I'd assumed. A screen reader's jump-to-content shortcut is meaningless with 2–3 competing 'main' landmarks per page.",
      bullets: [
        "Removed `<main>` from `(main)/layout.js`, `(auth)/layout.js`, and all three auth page files",
        "Removed `<main>` from `privacy/page.jsx`, `terms/page.js`, `dev-log/page.jsx`",
        "Confirmed `className`, `id`, and `ref` props all survive the tag swap unchanged, since they're independent of the element name",
        "Left one dead-code `<main>` inside a commented-out block untouched, since it never executes"
      ],
      tags: "refactor"
    }, 
    {
      id: 31,
      month: "September 2026",
      date: "September 22, 2026",
      title: "`proxy.js` / `auth/signup`: User-Context Placement",
      body: " I initially assumed `Sentry.setUser()` just needed to be called *somewhere* before an error happened, without realizing Sentry's scope is tied to the specific request it's running in, not a shared session-wide state.",
      bullets: [
        "Moved the *tested* implementation from `proxy.js` (Edge runtime, unreliable for this SDK behavior) to `app/api/auth/signup/route.js` (Node runtime, verified working)",
        "Kept the `proxy.js` call in place as real code, but documented that it's currently a no-op there due to the runtime limitation",
        "Established the standing pattern: call `Sentry.setUser()` fresh at the top of every authenticated request that could throw, not once per session"
      ],
      tags: "refactor"
    },   
    {
      id: 30,
      month: "September 2026",
      date: "September 22, 2026",
      title: "`lib/withLogging.js`: Error Visibility",
      body: "I realized that a caught exception silently swallowed by a custom error handler doesn't mean the monitoring tool watching for errors ever sees it. Sentry's automatic instrumentation only fires on *uncaught* exceptions, so a well-behaved try/catch can accidentally hide every single error from Sentry.",
      bullets: [
        "Added one explicit `Sentry.captureException(error)` call inside the existing catch block",
        "No change to the response shape or status code returned to the client",
        "Fix applies uniformly across all 8 routes wrapped by `withLogging`, since they all share this one function"
      ],
      tags: "refactor"
    },   
    {
      id: 29,
      month: "September 2026",
      date: "September 10, 2026",
      title: "API routes: bare handlers → observable handlers",
      body: "I realized that shipping eight working routes wasn't the same as shipping eight *debuggable* routes. Without a shared wrapper, any future production failure would be invisible unless I happened to be watching the terminal at the exact moment it happened.",
      bullets: [
        "Converted every route's direct verb export (`export async function POST()`) into a renamed internal `handler` wrapped by `withLogging(handler)`, so the public export signature stays identical to Next.js while gaining full observability underneath.",
        "Centralized timing (`Date.now()` diff) and request-ID generation into one function instead of duplicating that logic across 8 files, a future 9th route inherits full logging just by using the same one-line wrap.",
        "Verified the wrapper doesn't care whether the underlying handler takes a `req` parameter or not (JS allows unused declared parameters), so one wrapper correctly serves both 2-line stub routes and 40-line real routes without any per-route special-casing."
      ],
      tags: "refactor"
    },  
    {
      id: 28,
      month: "September 2026",
      date: "September 09, 2026",
      title: "CookieBanner.jsx: Link Target Behavior",
      body: "Mindset shift mid-build: initially wrote the Privacy Policy link with `target='_blank'` reflexively, treating it like any outbound link. Realized that logic only holds for *external* destinations, not same-site navigation.",
      bullets: [
        "Removed `target='_blank'` and `rel='noopener noreferrer'` from the internal `/privacy` anchor",
        "Kept the link's existing `className` and position inside the banner unchanged",
        "No change needed to `CookieBanner.css`, the fix was JSX-attribute-only"
      ],
      tags: "refactor"
    },   
    {
      id: 27,
      month: "September 2026",
      date: "September 08, 2026",
      title: "app/proxy.js: single check → re-checked-on-every-request guard",
      body: "Realized the original design only checked age-gate fields once. At the exact moment of OAuth callback, anything that nulled a field afterward (a bug, a manual edit) would go undetected forever since nothing else in the app re-checked those fields.",
      bullets: [
        "Added a second block to proxy.js that runs on every /dashboard request, not just the one-time OAuth redirect",
        "Reused the same createServerClient pattern already proven in callback/route.js, adapted to middleware's req.cookies API instead of next/headers' cookies()",
        "Guarded the new block against re-triggering on /age-gate itself, to avoid a redirect loop"
      ],
      tags: "refactor"
    },   
    {
      id: 26,
      month: "September 2026",
      date: "September 01, 2026",
      title: "`pickLimiter` simplified to remove a dead-code branch",
      body: "The original function had a special-case early return for `/api/posts/*` that both introduced the rate-limiting gap and made the function harder to read than it needed to be. Removing that branch fixed the bug and shortened the function at the same time, a case where the correct fix and the cleaner code were the same change.",
      bullets: [
        "Reduced the function from 7 conditional lines to 5",
        "Removed a `startsWith` + `!==` compound condition that was easy to misread at a glance"
      ],
      tags: "refactor"
    },   
    {
      id: 25,
      month: "September 2026",
      date: "September 01, 2026",
      title: "`middleware.js` → `proxy.js`: convention migration, not just a rename",
      body: "Realized partway through that a filename change alone wasn't the actual fix Next.js required, the export name inside the file was the real contract being checked. This reframed the task from 'rename a file' to 'migrate to a new function-naming convention,' which matters for any future Next.js convention changes: assume the runtime checks *names*, not just *paths*, until proven otherwise.",
      bullets: [
        "Used `git mv` instead of a manual drag-and-drop rename, preserving clean `git blame`/history for the file going forward",
        "Confirmed the diff was a pure rename (0 changes) before making the follow-up export-name fix, isolating the two changes from each other",
        "Restarted the dev server deliberately after the change, rather than assuming hot-reload would pick it up. This habit was already learned earlier in the session and reapplied here correctly"
      ],
      tags: "refactor"
    },   
    {
      id: 24,
      month: "August 2026",
      date: "August 28, 2026",
      title: "Vercel Secret vs Config Classification",
      body: "Realized that Vercel's 'Secret'/'Config' toggle is a dashboard-visibility setting only, unrelated to actual browser exposure of `NEXT_PUBLIC_` variables (which was happening regardless). Reclassified `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `NEXT_PUBLIC_MAPBOX_TOKEN` from Secret to Config to accurately reflect that they're intentionally public, while leaving `SUPABASE_SERVICE_ROLE_KEY` and both Upstash variables correctly as Secret.",
      tags: "refactor"
    },   
    {
      id: 23,
      month: "August 2026",
      date: "August 28, 2026",
      title: "`middleware.js`: Merging Two Responsibilities Into One File",
      body: "Realized Next.js 16 only permits a single middleware/proxy file per project, meaning ROA-003's rate limiter and ROA-008's route protection had to coexist in the same function rather than as separate concerns.",
      bullets: [
        "Restructured the early-return pattern (`if (!limiter) return NextResponse.next();`) into an `if (limiter) { ... }` block so non-API requests correctly fall through to the auth check.",
        "Kept all five rate limiters completely untouched to avoid regressing ROA-003 work.",
        "Generalized the auth cookie check to a pattern match (`sb-` prefix, `-auth-token` suffix) instead of hardcoding the project-specific ref, so it survives a future Supabase project change."
      ],
      tags: "refactor"
    },   
    {
      id: 22,
      month: "August 2026",
      date: "August 26, 2026",
      title: "`lib/supabase.js`: Client/Server Cookie Alignment",
      body: "Realized that using `createBrowserClient` from `@supabase/ssr` (rather than plain `createClient`) was the actual missing piece for reliable session handling across client and server. It's not an incremental tweak, but the correct foundational pattern for this SSR architecture.",
      bullets: [
        "Switched `lib/supabase.js` to `createBrowserClient`.",
        "Ensured `app/auth/callback/route.js` reads/writes the same cookie-based session store via `createServerClient`.",
        "Eliminated a PKCE code-verifier mismatch that had been silently breaking OAuth exchange."
      ],
      tags: "refactor"
    },   
    {
      id: 21,
      month: "August 2026",
      date: "August 26, 2026",
      title: "Supabase Client: Plain createClient → createBrowserClient",
      body: "Realized that using two different storage mechanisms (localStorage on the client, cookies on the server) for the same PKCE verifier was architecturally incompatible, not just a config oversight.",
      bullets: [
        "Replaced `createClient` from `@supabase/supabase-js` with `createBrowserClient` from `@supabase/ssr` in `lib/supabase.js`",
        "Removed the now-redundant manual `flowType: 'pkce'` option, since `createBrowserClient` defaults to PKCE and cookie storage already",
        "Verified via terminal log that the session exchange succeeded post-fix, not just that the code compiled"
      ],
      tags: "refactor"
    },
    {
      id: 20,
      month: "August 2026",
      date: "August 25, 2026",
      title: "Font Loading: Implicit Fallback → Explicit Weight Declarations",
      body: "Realized that `next/font/google` only generates usable CSS for weights explicitly listed and not for 'whatever the design needs', an assumption that had been silently wrong for the 600-weight submit button.",
      bullets: [
        "Added `'600'` to DM Sans's `weight` array in `layout.js`",
        "Confirmed `.submit-btn`'s existing `font-weight: 600` CSS was already correct and needed no further changes once the real weight loaded"
      ],
      tags: "refactor"
    },    
    {
      id: 19,
      month: "August 2026",
      date: "August 25, 2026",
      title: "Auth Panel Layout: Card → Full-Bleed Panel",
      body: "Realized the auth panel needed to visually fill the space between nav and footer rather than float as a small centered card in order to match with the mockup's actual full-height proportions.",
      bullets: [
        "Removed `align-items: center` from `.auth-content`, restoring flexbox's default `stretch` so `.auth-panel-body`'s `flex: 1` could actually take effect",
        "Confirmed the fix visually — lavender gaps above/below the white panel disappeared entirely"
      ],
      tags: "refactor"
    },
    {
      id: 18,
      month: "August 2026",
      date: "August 18, 2026",
      title: "terms.css / privacy.css: global selectors → scoped page classes",
      body: "Realized mid-session that writing CSS as if each legal page were a standalone HTML document (bare `:root`, `body`, `header`, `a` selectors) breaks the moment Next.js's client-side routing is involved, since stylesheets aren't torn down between page transitions the way a full reload would clear them:",
      bullets: [
        "Moved all custom properties from `:root` onto page-specific classes (`.privacy-page`, `.terms-page`)",
        "Prefixed every bare-tag selector with the page class",
        "Added matching outer `<div>` wrappers in each page's JSX so the scoping class actually has a DOM node to attach to"
      ],
      tags: "refactor"
    }, 
    {
      id: 17,
      month: "August 2026",
      date: "August 18, 2026",
      title: "auth.css: panel sizing, full-bleed vs. floating card",
      body: [
        "Initially built `.auth-panel-body` as a small centered card with `max-width` and rounded corners. Matched a generic 'form card' instinct rather than the actual mockup, which shows a full-height panel filling the space between nav and footer.",
        "Corrected mid-session after screenshot comparison:"
      ],
      bullets: [
        "Removed `max-width`, `border-radius`, and `border` from `.auth-panel-body`",
        "Added `flex: 1` to both `.auth-content` and `.auth-panel-body` so the panel stretches to fill all available vertical space",
        "Introduced a new `.auth-form-inner` wrapper specifically to cap the *form content's* width (settled at 32rem) independently from the full-bleed panel background. It solves 'panel should be full height' and 'form shouldn't stretch edge-to-edge' as two separate concerns instead of conflating them into one element's sizing"
      ],
      tags: "refactor"
    },   
    {
      id: 16,
      month: "August 2026",
      date: "August 07, 2026",
      title: "Dev-log color tokens: shared-variable edit vs. line-by-line",
      body: "Instead of hunting down every individual cyan value across the file, targeted the two shared tokens (`--dn-border-hover`, `--dn-border-active`) that multiple elements already referenced.",
      bullets: [
        "One two-line edit in `:root` propagated the fix to badge borders, hover tint, and scrollbar thumb simultaneously",
        "Remaining standalone cyan values (ambient glow, line-320 hover fade) still needed individual swaps since they weren't wired to the shared tokens"
      ],
      tags: "refactor"
    },  
    {
      id: 15,
      month: "August 2026",
      date: "August 07, 2026",
      title: "Tabler icons: webfont → component library",
      body: "Realized the blank-icon bug wasn't a styling issue at all, it was a missing font dependency that would keep failing silently on any future page that used the same icon pattern.",
      bullets: [
        "Installed `@tabler/icons-react`, swapped `<i className='ti ti-...'>` for real components",
        "Updated `.feat-icon i` CSS selector to `.feat-icon svg` since the element type changed",
        "Set icon color via the `color` prop directly rather than fighting CSS specificity against inline SVG attributes"
      ],
      tags: "refactor"
    },  
    {
      id: 14,
      month: "August 2026",
      date: "August 07, 2026",
      title: "Map-mock pins: undefined CSS variables",
      body: "I assumed `var(--rv-gold)`/`var(--rv-light)` would just work because they were named sensibly, turned out they only ever existed in the original mockup's own `:root` block and were never carried into the real project. `var()` referencing a token that doesn't exist fails silently, no error thrown.",
      bullets: [
        "Swapped both pins to hardcoded hex, matching the rest of the file's existing convention",
        "Confirmed opacity values were unaffected by the background-value change (separate CSS properties)",
        "Full tokenization was proposed afterward as the 'more correct' long-term fix, but explicitly declined in favor of staying consistent with the hex-based convention already in use"
      ],
      tags: "refactor"
    },  
    {
      id: 13,
      month: "August 2026",
      date: "August 06, 2026",
      title: "devlog.css: phone sidebar layout (xs breakpoint)",
      body: "The original horizontal-scrolling tab row didn't match what was wanted for narrow phones. Getting to a clean 3/3/2 grid took two attempts because the first fix (`display: grid` alone) only grouped tabs by their section wrapper, not individually.",
      bullets: [
        "Added `display: contents` on each section's wrapper `<div>` so grid treats individual tabs as direct children instead of section-bundles",
        "First attempt at filling the trailing empty grid slot used `:last-child`, which misfired — `display: contents` changes how `:last-child` resolves across the flattened boundary, so it targeted the wrong tile",
        "Replaced with an explicit `.dn-tab:nth-child(8) { grid-column: 1 / 3 }`, using absolute position instead of relative-to-parent, which fixed it correctly",
        "Known fragility: `nth-child(8)` is a magic number tied to today's exact 8-tab count and order — flagged for a code comment or future revisit if the tab list ever changes"
      ],
      tags: "refactor"
    },
    {
      id: 12,
      month: "August 2026",
      date: "August 06, 2026",
      title: "devlog.css: root font-size scoping",
      body: "I realized the size mismatch between the Next.js dev log and its SonicVerse source wasn't a token problem, the `:root` token values were byte-for-byte identical between both files. The actual cause was a missing `html { font-size: 62.5% }` rule that SonicVerse's global CSS had and Next.js's didn't, since every token in the file is written in `rem`, which always resolves against the root `<html>` element, not any local wrapper.",
      bullets: [
        "Confirmed via dev tools' computed-style panel on both pages side by side, not by eyeballing screenshots",
        "Ruled out applying the fix globally, since it would silently break every Tailwind utility class elsewhere in the app (Tailwind assumes `1rem = 16px`)",
        "Scoped the fix by placing `html { font-size: 70% }` directly inside `devlog.css` itself — safe because that file only ever loads on the standalone `/dev-log` route, so the rule never reaches any Tailwind-using page",
        "Landed on `70%` (11.2px root) as a deliberate middle ground between SonicVerse's `10px` and Tailwind's native `16px`, rather than matching either exactly"
      ],
      tags: "refactor"
    },
    {
      id: 11,
      month: "August 2026",
      date: "August 04, 2026",
      title: "`db-backup.yml`: Dump Scope and File Structure",
      body: "Realized partway through that 'fix the missing data' and 'back up everything indiscriminately' are not the same goal. A correct backup still needs deliberate scope boundaries, not maximum inclusion.",
      bullets: [
        "Split a single combined dump into three independently-verified files: roles, schema, data",
        "Scoped schema and data dumps to `--schema public`, deliberately excluding `auth`/`storage`",
        "Applied differentiated verification logic per file type — schema/data get a strict size floor, roles gets an existence-only check since a legitimately tiny roles file shouldn't fail the job",
        "Added a dedicated CI step that greps the data dump for `^COPY ` statements, so a repeat of the original schema-only bug fails loudly in the pipeline itself instead of requiring manual discovery again"
      ],
      tags: "refactor"
    },  
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
    { id: 46, topic: "Dump Flags Are Not Additive in the Way Their Names Suggest", body: "`--data-only` does not mean 'also include data'. It's the inverse of `--schema-only`, and even then it doesn't default to a restorable format. Getting real row data required stacking `--data-only` *and* `--use-copy` together; each flag name implies less than what it actually requires in combination." },
    { id: 47, topic: "Schema Scoping Has Cluster-Level Blind Spots", body: "`--schema public` correctly excludes `auth`/`storage` objects, but extensions like PostGIS aren't schema-owned in the way tables are, they're cluster/database-level. Scoping a dump to one schema can silently drop the very extension that schema's tables depend on." },
    { id: 48, topic: "File Existence and Size Are Not Proof of Content", body: "A file that's non-empty, uploads successfully, and passes a size check can still be structurally wrong in a way none of those checks would catch. Real verification means opening the file and checking for the specific thing you actually need (a COPY statement, a real row, a table name). Proven three separate times in this same ticket." },
    { id: 49, topic: "GitHub Actions Runs the Workflow Version Live at Trigger Time", body: "A workflow file's current contents in the repo don't tell you what a past run actually executed. Disputes over 'did the fix actually run' are only settled by inspecting the literal output of a specific run, not by re-reading the YAML." },
    { id: 50, topic: "`dropdb`/`createdb` Fully Resets Restore-Test State", body: "Restore testing against a database that still has data from a previous failed attempt produces misleading duplicate-key errors that look like new bugs. A full drop-and-recreate between restore attempts is required for a clean, trustworthy test." },
    { id: 51, topic: "A 'Full Backup' Claim Needs Explicit Scope Boundaries", body: "Neither this DIY approach nor Supabase's own paid-tier native backups cover object/file storage, only the Postgres database. 'True full backup' isn't a DIY-vs-paid distinction; it's a database-vs-files distinction that exists regardless of backup method." },
    { id: 52, topic: "Health checks must be isolated from application dependencies", body: "A monitoring endpoint should answer exactly one question, 'is the server itself responding', and nothing else. Wiring in a database call or auth check means unrelated failures (a Supabase blip, an expired token) get misreported as full app outages. `/api/health` was deliberately built with zero dependencies for this reason." },
    { id: 53, topic: "Configuration success is not the same as functional proof", body: "Extending the DDL/DML 'Success ≠ verified' principle from earlier sessions: a monitor showing 'Up' with a correctly filled-in alert contact still isn't proof the alert pipeline works. Only a real triggered event, an actual forced outage producing an actual received email, counts as verification. This is now a standing project rule, not a one-off check for ROA-019." },
    { id: 54, topic: "A dependency field being 'fine in practice' isn't the same as being correct", body: "Build order can be executed correctly by a developer's own judgment even while the tracked metadata (a kanban JSON dependency array) describes something different. The two are separate claims. One about what happened and one about what a document says happened, and only checking the former doesn't verify the latter." },
    { id: 55, topic: "Shared UI shells shouldn't be finalized before real page designs exist", body: "Committing to a single rigid page layout before knowing whether every page (e.g., a full-bleed map view) can actually use it risks the same retrofit cost as building any other abstraction ahead of its real use cases. Next.js App Router's nested/route-group layouts make it cheap to defer this correctly. Build the minimum shared shell now, add sibling layouts later once real requirements are known." },
    { id: 56, topic: "rem vs. em vs. px are not interchangeable defaults", body: "`rem` always resolves against the root `<html>` element's font-size, regardless of any parent element's own font-size. `em` is the one that cascades from the nearest ancestor. This distinction is why a root font-size override can't be 'scoped' to a wrapper div using `rem`-based CSS; the unit definition itself ignores local scoping." },
    { id: 57, topic: "Tailwind's Preflight reset silently overrides hand-written CSS", body: "Any page that loads `globals.css` inherits Tailwind's base reset, even pages that never use a single Tailwind utility class. This showed up first as a root-font-size conflict (blocking the 62.5% trick globally) and again as missing list bullets on plain `<ul>` elements. Same underlying cause, two different symptoms." },
    { id: 58, topic: "CSS specificity ties break by source order, not 'weight'", body: "When two selectors have identical specificity, the one imported later in the file/build order wins. When specificity actually differs (an ID vs. a class, for example), specificity wins regardless of import order. These are two separate rules, not one 'which is bigger' comparison." },
    { id: 59, topic: "`display: contents` changes how `:last-child` and similar pseudo-selectors resolve", body: "Flattening a wrapper element out of the layout tree with `display: contents` can cause child-position selectors to match differently than expected, since the browser's notion of sibling order shifts once the wrapper visually disappears. Explicit `nth-child(n)` targeting sidesteps the ambiguity." },
    { id: 60, topic: "Route groups `(name)` are excluded from the URL, not the layout tree", body: "A folder in Next.js App Router wrapped in parentheses is invisible to the resulting URL path but fully real for layout nesting purposes. `app/(main)/dashboard/page.js` renders at `/dashboard`, not `/main/dashboard`, while still inheriting `(main)/layout.js`." },
    { id: 61, topic: "Serverless functions don't share memory across invocations", body: "Upstash Redis (not an in-memory counter) is required for rate limiting on Vercel because a plain in-process counter resets on every cold start and is invisible across concurrent lambda instances, so it silently limits nothing in production." },
    { id: 62, topic: "Next.js middleware location is convention-locked", body: "`middleware.js` is only recognized at project root or inside `src/`, never inside `app/`. A misplaced file doesn't error, it's just silently inert, which makes it a dangerous-quiet failure mode." },
    { id: 63, topic: "Dependency graphs can be technically satisfied but practically incomplete", body: "ROA-003 listed only ROA-002 as a dependency and was 'unblocked' per the kanban, but its own Phase D tests require routes that come from ROA-008. A real gap the ticket structure didn't surface until testing was attempted." },
    { id: 64, topic: "auth.users and public.users are never automatically linked", body: "Supabase creates a row in auth.users on signup but has no built-in assumption about your own public schema. It won't guess whether you want a mirrored users table, three tables, or none. Bridging them requires an explicit SECURITY DEFINER trigger, every time, on every Supabase project." },
    { id: 65, topic: "OAuth Client ID vs Client Secret is an identification vs. proof distinctio", body: "The Client ID is public and travels in the browser redirect URL, it just says who's asking. The Client Secret is exchanged server-to-server and proves the request genuinely comes from Roam's backend. A leaked Secret enables impersonation/phishing of the login flow, not direct data exposure but it's still gitignore-critical." },
    { id: 66, topic: "Shared components should reflect genuinely shared structure, not be forced to", body: "When two UI pieces look similar but one is a strict subset of the other's markup (auth nav has zero buttons, main nav has two), collapsing them into one component with conditional hiding creates a hidden coupling. Every future change to the shared component has to remember the special case exists. Two small separate components can be simpler than one component with a mode flag." },
    { id: 67, topic: "Client-side navigation doesn't reset global CSS state", body: "Unlike a full page reload, `<Link>`-driven navigation in Next.js doesn't unload previously-loaded stylesheets or reset `:root`-scoped custom properties. Any CSS written with unscoped selectors (`body`, bare `:root`, generic tag selectors) can leak from one page onto another after a client-side route change. The fix is always the same: scope every selector under a page-specific wrapper class." },
    { id: 68, topic: "Route group parentheses never affect the URL or indicate 'the root'", body: "`(main)` and `(auth)` are purely filesystem-level organization for applying different layouts, neither name appears in the URL. Which folder serves `/` is determined only by which one has a `page.js` sitting directly inside it, independent of naming or grouping." },
    { id: 69, topic: "`<Link>` vs `<button>` is a semantic choice, not a styling one", body: "`<button>` triggers in-page JavaScript actions and does not navigate on its own. `<Link>` performs client-side routing to a different URL. Any element whose job is 'take the user to another page' should be a `<Link>`, regardless of how it's visually styled (pill, ghost, solid, etc.)." },
    { id: 70, topic: "`usePathname()` lets a shared component vary its output per-route without prop drilling", body: "When a component that lives in a shared layout (like `AuthNav`) needs to know which specific page it's currently rendering under, `usePathname()` reads the live URL path directly. This avoids the need for every page to explicitly pass that information down as a prop." },
    { id: 71, topic: "Never state a file's contents without having actually read them via a tool call", body: "A real process failure this session: file imports and JSX structure were stated as confirmed fact twice without having opened the file first. Corrected by strictly reading files via the `view` tool before making any claim about their contents going forward, inference or memory is not a substitute for verification." },
    { id: 72, topic: "A conversation-length rule and an idle-time rule are not the same trigger", body: "'Re-check the date if the conversation runs long' and 're-check the date if there's been no activity for X hours' sound similar but produce very different behavior. The first fires based on message count/duration, the second based on elapsed real time with no activity. Worth being precise about which one is actually meant when writing a standing rule." },
    { id: 73, topic: "Flexbox `align-items` Overrides Default Stretch Behavior", body: "Flex containers stretch children to fill the cross-axis by default. Setting `align-items: center` (or any value other than `stretch`) silently overrides this — a common, hard-to-spot cause of 'why isn't this filling the space' bugs." },
    { id: 74, topic: "Invalid CSS Values Fail Silently", body: "`display: row` is not valid CSS. There's no error, no console warning, the browser just ignores the declaration and falls back to the element's default display type. This can look like a completely unrelated layout bug (checkbox/text stacking instead of sitting side-by-side)." },
    { id: 75, topic: "next/font/google Only Loads Explicitly Declared Weights", body: "Google Fonts via `next/font` won't generate CSS for a weight unless it's explicitly listed in the config array. If a rule elsewhere declares that weight, the browser fake-bolds using the nearest loaded weight instead of throwing an error." },
    { id: 76, topic: "PKCE Flow vs. Implicit Flow", body: "PKCE issues a short-lived code that gets exchanged for a session via a server-side call, it's required for any SSR architecture. Implicit flow returns tokens directly in the URL fragment, which is never sent to the server, making it fundamentally incompatible with server-side session handling." },
    { id: 77, topic: "PKCE Verifier Storage Must Match Between Client and Server", body: "The code verifier generated during login must be readable by whatever exchanges the code afterward. Cookies work for both client and server; localStorage is browser-only and invisible to a server-side route. This mismatch was the actual root cause of the `AuthPKCECodeVerifierMissingError`." },
    { id: 78, topic: "route.js vs. page.js in the App Router", body: "`page.js` renders a UI meant to be seen. `route.js` is a server endpoint returning a `Response` object with no visual output. An OAuth callback is a server handoff, not a page a user looks at. It belongs in `route.js`." },
    { id: 79, topic: "Google OAuth Needs Only One Registered Callback", body: "Google only ever needs to know about Supabase's own fixed callback URL (`https://<ref>.supabase.co/auth/v1/callback`). The app's own `/auth/callback` is a second hop entirely between Supabase and the app. Google is never involved in it and never needs to know it exists, regardless of environment (localhost, preview, production)." },
    { id: 80, topic: "`emailRedirectTo` and `redirectTo` Are Separate, Not Inferred", body: "Supabase's `signUp()` (email flow) and `signInWithOAuth()` (OAuth flow) each need their own explicit redirect parameter. Setting one does not configure the other, both must independently point at the same `/auth/callback` route." },
    { id: 81, topic: "Vercel's Preview vs Production Environment Scoping Is Real", body: "Environment variables set for one Vercel environment (e.g., Production) do not automatically apply to another (e.g., Preview). A ticket can be 'done' locally and on production while still being completely broken on preview deployments, if the scoping was never checked." },
    { id: 82, topic: "`Redis.fromEnv()` Has a Documented Flaky-Lookup Issue", body: "Even when environment variables are genuinely present and correctly named, Upstash's `Redis.fromEnv()` convenience method can fail to read them reliably in Next.js/serverless contexts. Explicit construction (`new Redis({ url, token })`) using `process.env` directly is the more robust pattern." },
    { id: 83, topic: "A Local Terminal Log Never Proves Anything About a Deployment", body: "`npm run dev`'s terminal output only reflects the local dev server. Verifying behavior on a Vercel preview or production deployment requires checking that deployment's own Runtime Logs. A clean local terminal log is not evidence of anything happening on Vercel's infrastructure." },
    { id: 84, topic: "Branch-Level Preview URLs Outlive Per-Commit URLs", body: "Vercel generates both a unique per-commit URL and a stable per-branch alias. External allowlists (like Supabase's Redirect URLs) should register the branch-level alias. Since it persists across every future commit to that branch, the per-commit URL would require re-registration on every single push." },
    { id: 85, topic: "'Success. No rows returned' Doesn't Mean What It Sounds Like", body: "For `CREATE FUNCTION`/`CREATE TRIGGER` statements, this message is expected and correct. However, these statements don't return data rows by nature. It's not evidence the function's logic is right; only a direct `SELECT prosrc FROM pg_proc` confirms the actual stored behavior." },
    { id: 86, topic: "Middleware Should Never Be the Sole Security Boundary", body: "Per CVE-2025-29927, treating Next.js middleware as the only gate protecting a route is a known anti-pattern, a crafted request can bypass it. The correct pattern is a lightweight presence-check in middleware (fast, cheap, catches the common case) plus real session validation again inside the protected page itself." },
    { id: 87, topic: "Next.js middleware does not reliably hot-reload", body: "Editing `middleware.js` (or `proxy.js`) while the dev server is already running does not guarantee the new logic takes effect immediately. This produced a real false-negative test result this session. A fix was correctly written and saved, but the running server was still executing the old code until a full restart. Any middleware/proxy-layer change now gets a mandatory restart before re-testing, not treated as optional." },
    { id: 88, topic: "Next.js 16's `proxy.js` convention checks the export name, not just the filename", body: "Renaming `middleware.js` to `proxy.js` is not sufficient on its own. Next.js specifically looks for a function named `proxy` (or a default export) inside that file. A file named correctly but still exporting a function called `middleware` throws an explicit build error rather than failing silently." },
    { id: 89, topic: "A fast-forward merge means the target branch had zero new commits since branching", body: "When `git merge` reports 'Fast-forward,' it's not just a status message. It specifically means git didn't need to create a merge commit because `staging` hadn't diverged at all since `feature/roa-008` was branched off it. This is also why no conflicts were possible: there was nothing on `staging` to conflict with." },
    { id: 90, topic: "GRANT and RLS are two separate permission layers", body: "A Postgres role can have perfectly correct RLS policies and still get 'permission denied' if it was never given a base GRANT on the table. GRANT is checked first; RLS only applies to rows the role already has table-level access to." },
    { id: 91, topic: "Next.js route groups vs. plain folders", body: "A folder wrapped in parentheses, e.g. (auth), is a route group, it organizes files and shares layouts but contributes nothing to the actual URL. A plain folder, e.g. auth/callback, does show up in the URL. Mixing the two up is an easy, recurring source of wrong-redirect bugs." },
    { id: 92, topic: "Supabase session cookies can split across multiple cookies", body: "Once a session JWT is long enough, Supabase stores it as sb-<ref>-auth-token.0, .1, etc., instead of one cookie. Any cookie-presence check needs to match on a substring, not an exact suffix, or it will silently treat valid sessions as logged out." },
    { id: 93, topic: "Geo-IP lookups can't resolve against localhost", body: "Testing IP-based geolocation from a local dev server will always fail or return null, because ip-api.com (and similar services) can't meaningfully geolocate 127.0.0.1/loopback traffic. This is expected behavior and not a bug because real verification requires a deployed preview." },
    { id: 94, topic: "Vercel preview URLs are per-branch, not global", body: "Each feature branch gets its own distinct preview URL/alias. An OAuth redirect allowlist entry added for one branch's preview (e.g. feature/roa-008) does not cover a different branch's preview (e.g. feature/roa-004), each has to be added separately." },
    { id: 95, topic: "Client-side checks are UX, not security", body: "A DOB/age check run in the browser before calling an API is trivially bypassable via devtools. It's useful for instant feedback, but the actual enforcement has to happen server-side, where the request can't be tampered with and the real client IP is available for geo-lookups." },
    { id: 96, topic: "Ticket Scope Should Override Assumed 'Better' Design", body: "A categorized consent model is arguably more compliant for EU traffic than binary Accept/Decline, but the actual ticket spec called for binary only. Building the 'better' version the spec didn't ask for is scope creep, not improvement, even when the alternative has real merit." },
    { id: 97, topic: "Dependency Direction Isn't Always Intuitive", body: "Assumed installing PostHog *inside* ROA-007 might be reasonable since the banner was already built. The kanban's actual `deps` field showed ROA-018 depends on ROA-007, not the reverse, meaning the consent gate is deliberately meant to exist *before* the analytics tool it's gating as its own separate, larger-scoped ticket." },
    { id: 98, topic: "Never Fake a Call to Code That Doesn't Exist Yet", body: "Rather than stub a `posthog.init()` call against an uninstalled package (which would either throw or silently no-op), the gate point was left as a real comment. A fake success is worse than an honest gap, it hides exactly the kind of 'clean run isn't verification' trap this project explicitly guards against." },
    { id: 99, topic: "'Applied' and 'Verified' Are Two Different Claims", body: "A fix being pushed to `main` doesn't mean its effect has been confirmed. This distinction came up directly this session (Redis fix vs. `/api/health` response) and is now a standing verification habit going forward, not a one-off correction." },
    { id: 100, topic: "Middleware operates in a different lifecycle stage than route handlers", body: "`proxy.js` runs *before* a request reaches `app/api/*/route.js` and never sees what that handler returns. Anything middleware short-circuits (like a rejected rate-limit request) has to be logged inside middleware itself, a route-level wrapper can't retroactively catch what it never received." },
    { id: 101, topic: "A near-zero timing result proves nothing on its own", body: "A fast operation (like a health check) can legitimately complete in under 1ms, so a logger reporting `durationMs: 0` is equally consistent with 'the timer works and this was just fast' and 'the timer is broken and always returns zero.' The only way to actually confirm a timer works is to run it against an operation slow enough to produce a real, non-trivial duration and compare it against an independent measurement." },
    { id: 102, topic: "Two independent timing sources agreeing is strong evidence, not coincidence", body: "When a custom `Date.now()`-based timer and Next.js's own internal instrumentation landed within 11ms of each other on the same real request, that agreement — from two completely separate measurement systems — is meaningfully strong proof the custom timer is measuring real elapsed time correctly." },
    { id: 103, topic: "OAuth callback URLs serve two distinct handoff stages, not one shared list", body: "Google Cloud Console only ever needs to know about Supabase's own fixed callback endpoint, Google never talks to the app directly. Supabase's Redirect URLs allowlist is the one that needs to track every actual app environment (localhost, each Vercel branch, production). Treating these as 'the same list, kept in sync' is a category error, not just an oversight." },
    { id: 104, topic: "'Applied' and 'verified' are two different claims about the same fix", body: "A fix being written and deployed to a branch doesn't mean its actual effect has been observed. Several items this session (the Redis fix, the ROA-015 logger itself) required a real, separate verification step — hitting the endpoint, reading the actual log line — rather than trusting that a clean deploy implies correct behavior." },
    { id: 105, topic: "Sentry's Scope Is Request-Scoped, Not Session-Scoped", body: "Calling `Sentry.setUser()` during one HTTP request does not carry that tag forward into a user's next, separate request. It has to be called fresh, every time, inside whichever request might actually throw the error you want tagged." },
    { id: 106, topic: "Next.js Middleware Defaults to the Edge Runtime", body: "`proxy.js` (Next.js middleware) runs on Edge by default unless an explicit `runtime` export says otherwise. This matters because some SDKs, Sentry included, behave differently in Edge versus Node, particularly around scope propagation for things like `setUser()`." },
    { id: 107, topic: "A Caught Error Is Invisible to Sentry Unless You Tell It", body: "Sentry's automatic instrumentation only captures *uncaught* exceptions. Any custom try/catch wrapper that handles an error gracefully has to explicitly call `Sentry.captureException(error)`, or that error simply never reaches Sentry." },
    { id: 108, topic: "Vercel Environment Variables Are Scoped Per Environment, Independently", body: "A variable saved only under 'Production' in Vercel will not exist during a Preview build, even though the same underlying secret would work identically in both." },
    { id: 109, topic: "Vercel's 'Development' Env Scope Is a Red Herring for Local Dev", body: "That environment checkbox only matters if you're running the `vercel dev` CLI tool. Plain `next dev` never touches it, it reads exclusively from `.env.local`." },
    { id: 110, topic: "Two Independent Timing/Evidence Sources Agreeing Is Real Proof", body: "When two separately-generated measurements or confirmations point the same direction, that's meaningful evidence. When they *disagree*, like a green 'Error sent to Sentry' button next to an unchanged Issues list, that mismatch is the signal something's actually wrong and not something to explain away." },
    { id: 111, topic: "Tailwind v4 cascade layers beat specificity and `!important`", body: "Rules declared inside a named `@layer` (which `@import 'tailwindcss'` establishes) always lose to unlayered CSS, no matter how specific the selector or how many `!important` flags are stacked. Any global override meant to beat a plain stylesheet must sit before layer context is established." },
    { id: 112, topic: "`npx shadcn@latest init` can rewrite `globals.css` wholesale", body: "Even when the goal is 'just add one component,' `init` on an existing project can delete custom theme tokens and font rules outright. Always diff the file immediately after running it rather than assuming only new content was added." },
    { id: 113, topic: "`jsx-a11y`'s recommended config can collide with `eslint-config-next`", body: "Both register the same plugin name under flat config. Adding the full `flatConfigs.recommended` object throws a hard `ConfigError` on duplicate plugin registration, only the `.rules` key should be merged in." },
    { id: 114, topic: "Placeholder text is not an accessible label", body: "Placeholder attributes disappear on input and aren't reliably announced as a field's name by screen readers. A real `<label>` (via `htmlFor`/`id` or `aria-label`) is required regardless of visual design constraints." },
    { id: 115, topic: "A `<div>` with `onClick` is invisible to keyboard users", body: "It can't receive Tab focus and Enter does nothing by default. Swapping to a real `<button>` or `<a>` gets focus handling and key support for free, rebuilding that behavior by hand with `role`/`tabIndex` is more code and easier to get wrong." },
    { id: 116, topic: "shadcn's Dialog (Radix UI base) solves focus management that's hard to hand-build", body: "Focus trapping, escape-to-close, and returning focus to the trigger element on close are all handled automatically. Confirmed via a real smoke test rather than assumed from documentation." },
    { id: 117, topic: "A label names one control; a fieldset names a group", body: "A single `<label>` around three selects names none of them. Use `<fieldset>` and `<legend>` for the group and one label per control." },
    { id: 118, topic: "A placeholder is not a name", body: "Chrome's Accessibility pane strikes it through when a label exists. It also vanishes on typing and tends to fail contrast." },
    { id: 119, topic: "ARIA changes announcements, not behavior", body: "`role='button'` on a `div` adds no focus or Enter and Space handling. A native `<button>` does." },
    { id: 120, topic: "Untracked files and `.next` don't belong to a branch", body: "`.next` is gitignored and shared on disk, so a stale copy after a branch switch caused the `instrumentation.js` MODULE_UNPARSABLE error. Run `rm -rf .next` after switching." },
    { id: 121, topic: "Supabase silently falls back to the Site URL", body: "A `redirect_to` that isn't on the allow list lands on the Site URL (`localhost:3000`). A double slash in an entry does the same." },
    { id: 122, topic: "`admin.createUser` vs `signUp`", body: "The admin call sends no confirmation email and bypasses 'Allow new users to sign up'. `signUp` on a server client with cookies does both properly." },
    { id: 123, topic: "Confirmation links are single use", body: "The auth log showed the same token requested twice. The second request returned `otp_expired`, which can arrive in the query string and the hash." },
    { id: 124, topic: "Session cookies come in two parts", body: "`sb-…-auth-token.0` and `.1` are the session. `…-code-verifier` and `…-flow-…` cookies are handshake leftovers, so a blocked signup leaves only those." },
    { id: 125, topic: "RLS is per row; grants decide columns", body: "A row policy of `true` plus a column SELECT grant exposes that column. Check `pg_policies`, `information_schema.column_privileges`, and a live test as the target role." },
    { id: 126, topic: "A preview runs only what was pushed", body: "A country of US means a deployed server handled the request, because localhost can't geolocate. Reverting code locally doesn't change a deployed preview." },
    { id: 127, topic: "Geo lookups fail, so gates must not depend on them", body: "`lib/geo.js` returns null on localhost, VPNs, and outages. Requiring a country made working users loop." },
    { id: 128, topic: "Built-in Supabase email is limited project-wide", body: "One tester can block everyone. Custom SMTP such as Resend, plus DNS records, is the fix." },
    { id: 129, topic: "Lint reads source, not rendered colors", body: "`jsx-a11y` can't judge contrast. A rule passed with `--rule` on the command line applies to one run, not to the config." },
    { id: 130, topic: "Alt text depends on context", body: "A visible caption means `alt=''` so it isn't read twice, and `muted` satisfies `media-has-caption` only for silent clips." },
    { id: 131, topic: "Git hygiene", body: "A three-dot diff shows only what a branch changed since it left the base, and `git add -A` stages untracked scratch files. Read `git status` and stage by name." },
    { id: 132, topic: "ARIA labels things, it never makes a page talk", body: "Speech comes from a screen reader the user runs. Some features need an OS setting, like prefers-reduced-motion for the motion override. Focus rings and contrast are always on." },
    { id: 133, topic: "`??` respects an empty string, `||` does not", body: "`media.alt ?? fallback` keeps an explicit `alt=''`. This is why a captioned image can opt out of a description." },
    { id: 134, topic: "A live region should already exist when its text changes", body: "Keep the status container mounted and change only its text. An element that fades with opacity stays in the accessibility tree, while `display: none` would not." },
    { id: 135, topic: "alert interrupts, status waits", body: "`role='alert'` fits a failed submit that needs attention. `role='status'` fits a confirmation like 'Position saved'." },
    { id: 136, topic: "Hooks must run before an early return", body: "A new useEffect has to sit above `if (!visible) return null;`, or React complains the hook order changed between renders." },
    { id: 137, topic: "Measure a fixed element, don't guess its height", body: "A banner wraps to different heights at different widths. A ResizeObserver feeding a CSS variable, with a `0px` fallback, adapts to any width." },
    { id: 138, topic: "A refusal is the evidence the fixed route is live", body: "The old admin.createUser route created users even with signups OFF. Seeing 'Signups not allowed' and 0 rows proves the signUp-based route is the one running." },
    { id: 139, topic: "Unlayered CSS beats layered Tailwind utilities", body: "Tailwind v4 puts its utilities in a cascade layer. Any unlayered rule, such as devlog.css's `* { padding: 0 }`, wins over them regardless of specificity. That is why `focus:px-4` had no effect on /dev-log. The escape hatch is the important suffix (`focus:px-4!`), or scoping the unlayered rule." },
    { id: 140, topic: "A color that depends on inheritance depends on the OS theme", body: "`.auth-error` had no rule, so it inherited `--foreground`, which flips to `#ededed` when the OS is dark. The same element was dark text in one session and near-white in another." },
    { id: 141, topic: "Axe only sees the default state of the active theme", body: "It cannot see focus rings, error messages that aren't rendered yet, or the other OS theme. Those need forced states, triggered errors, and a second scan with emulated `prefers-color-scheme`." },
    { id: 142, topic: "Text contrast with alpha is computed against the background", body: "`rgba` text blends with whatever is behind it. Checking the CSS and blending by hand gave the same numbers axe printed, so you can fix by calculation first and confirm second." },
    { id: 143, topic: "Clicking into the DevTools Console steals page focus", body: "`:focus` and `:focus-visible` stop matching, so computed style reads back the base state. Use Rendering, then Emulate a focused page, or force the state in Elements, before reading focus styles." },
    { id: 144, topic: "A #fragment in the URL changes where Tab starts", body: "After a skip link, the address ends in `#main-content`, and Chrome starts Tab from that target. Retest the first stop from a URL with no hash." },
    { id: 145, topic: "A skip link target must start after the repeated block", body: "If the target contains the nav, the link skips nothing. A `<main>` should wrap only the primary content, so nav and footer keep their own landmarks." },
    { id: 146, topic: "A translucent fixed bar can dim an element beneath it", body: "The link looked dark and its ring was faint because `.dn-topbar` (z-index 100, translucent, `backdrop-filter`) painted over it. A faint ring means something is dimming the whole element, not just its background." },
    { id: 147, topic: "One focus ring color cannot fit every background", body: "`#2563eb` measured 5.17:1 on white but 1.34:1 on the hero purple. Scoped overrides for the failing surfaces are safer than changing the global rule." },
    { id: 148, topic: "A scrollable region needs focusable content or its own tabindex", body: "Axe's scrollable-region-focusable rule passed on tabs with links in the Project Hub and failed on tabs without any. The linter then flags `tabIndex` on non-interactive elements, so the exception needs a written reason." },
    { id: 149, topic: "tabIndex={-1} makes a programmatic focus target", body: "It can receive focus from a link or script without joining the Tab order, which Safari needs for skip links. Hide its outline with an attribute selector (`[tabindex='-1']`), so elements with `tabindex='0'` keep their ring." },
    { id: 150, topic: "A real form gives you Enter-to-submit for free", body: "All three auth pages use `<form onSubmit>` with a `type='submit'` button, so Enter inside a text field works. Enter on a select or checkbox is browser-dependent, so it is a poor test." },
    { id: 151, topic: "Browser extensions pollute accessibility tests", body: "A floating extension button took a Tab stop, and its content script caused the `removeChild` console errors. Run keyboard and screen reader tests in Incognito or a Guest window." },
    { id: 152, topic: "Removing a focused element resets focus to the body", body: "After the cookie banner is dismissed, the next Tab starts from where it used to be. The banner is last in the DOM, so Tab then leaves the page." },
    { id: 153, topic: "A query with placeholder text still in it proves nothing", body: "`where email = '<the email you used>'` returned 0 because nothing matches that literal text. Only the rerun with the real address counted." },
    { id: 154, topic: "Automated scans miss structural bugs", body: "Axe scored 0 on pages where the skip link was broken. Only pressing Tab, Enter, and Tab again found it." },
    { id: 155, topic: "Unlayered CSS Beats Layered CSS", body: "Tailwind v4 puts its utilities in cascade layers, and any unlayered rule beats a layered one regardless of specificity. The dev-log skip link padding lost to an unlayered * reset until the ! suffix was added." },
    { id: 156, topic: "Scan the Pushed Preview, Not Localhost", body: "Localhost runs next dev, while a preview is a production build with minified CSS and no dev overlays. A clean dev scan does not prove the deployed build is clean, so the final axe scans ran on the pushed commit." },
    { id: 157, topic: "Fast-Forward Versus a True Merge", body: "--ff-only refuses unless one branch's history sits inside the other's, which makes it a safe guard. When branches have diverged, a plain merge starts a real merge and can conflict. git merge -s ours keeps the current branch's files and records the other side as merged, while -X ours still merges both sides." },
    { id: 158, topic: "Focus After an Element Unmounts", body: "When a focused element is removed, focus resets to body and the next Tab starts from where it was. Move focus explicitly, and use tabIndex={-1} on the target so it accepts script focus without joining the Tab order." },
    { id: 159, topic: "Call Focus in the Handler, Not an Effect", body: "An effect keyed on state also runs on first load. A click handler runs only when the person acts." },
    { id: 160, topic: "Axe Best Practices Versus WCAG Scope", body: "page-has-heading-one is an axe best practice, not a WCAG 2.1 AA failure. It was the only finding when Best Practices was ON, and it stays advisory." },
    { id: 161, topic: "INP: Input Delay Versus Render", body: "A large input delay with a small render bar means the main thread was busy before the handler could start. A PerformanceObserver on event timing can measure it from the console, with no extra tooling." },
    { id: 162, topic: "Prove a Lint Error Is Pre-Existing", body: "git show HEAD:<file> | npx eslint --stdin --stdin-filename <file> lints the committed version. The CookieBanner set-state-in-effect error appeared there too, so it predates the focus change." },
    { id: 163, topic: "Vercel Standard Protection Versus All Deployment", body: "Standard Protection guards every domain except production custom domains. All Deployments would put a Vercel team login in front of production and block public visitors and the uptime monitor. Password Protection needs the Pro plan." },
    { id: 164, topic: "Fixing a Parent Fixes Only Its Own Children", body: "Next 16.4.1 cleared postcss and sharp because they were next's children. js-yaml and nanoid came through eslint, shadcn, and Tailwind's postcss, so they stayed until the lockfile was refreshed." },
    { id: 165, topic: "Advisory Databases Grow", body: "The ticket said 1 critical and 4 high. The audit on the clean branch said 39 findings, 12 high. Counts in a ticket are a snapshot, so rerun the audit before starting." },
    { id: 166, topic: "`npm update <pkg>` Moves the Lockfile, Not package.json", body: "When a parent's `^` range already allows the fixed version, the update changes only package-lock.json. `npm audit fix --force` can cross major versions and install something like shadcn@1.0.0." },
    { id: 167, topic: "`npm ls --omit=dev` Shows the Production Chain", body: "`npm explain` prints very long trees for packages that many dev tools depend on. `npm ls --omit=dev <pkg>` gives the production parents in a few lines." },
    { id: 168, topic: "A Loose Cookie Name Check Is Not a Session Check", body: "proxy.js matches `sb-` plus `-auth-token`, which also matches `...-auth-token-code-verifier` handshake cookies. A logged-out browser holding one passes the guard." },
    { id: 169, topic: "Blockers Swallow Sentry Browser Events", body: "In the normal Chrome profile, POSTs to ingest.us.sentry.io failed with ERR_BLOCKED_BY_CLIENT. Browser-side Sentry tests belong in Incognito." },
    { id: 170, topic: "A Browser Event and a Server Event Are Separate Issues in Sentry", body: "The frontend error (ROAM-2) came from `onunhandledrejection`. The server error (ROAM-6) came from `auto.function.nextjs.on_request_error`. Opening one issue's page won't show the other." },
    { id: 171, topic: "eslint-config-next Moves With next", body: "It's pinned exact, and it was two minor versions behind. Bump both together on every Next upgrade." },
    { id: 172, topic: "Core ESLint No Longer Ships the unix Formatter", body: "`-f unix` failed. `-f json -o file`, then a short node script reading `severity === 1`, lists warnings without installing anything." },
    { id: 173, topic: "`git grep` Searches Tracked Files Only", body: "That's why it skips node_modules and .next automatically, and why it misses a file that isn't added yet." },
    { id: 174, topic: "`git checkout COMMIT^ -- path` Restores a File From the Parent", body: "It brought back the three files ROA-017 deleted, on a throwaway branch, without touching the ticket branch." },
    { id: 175, topic: "A Baseline Gives a Zero Its Meaning", body: "The deprecation grep returned 0 after the change, and only the earlier run that printed the warning proved the check could detect it." },
    { id: 176, topic: "Row policies hide rows; they can't hide columns", body: "RLS decides which rows a user can touch. A user who may see a row sees every column unless column privileges say otherwise. That's why `users_select_all` leaked birthdays and emails." },
    { id: 177, topic: "A table-level grant covers every column", body: "`REVOKE SELECT (date_of_birth)` does nothing while table-level SELECT exists. Revoke at table level first, then grant the safe columns." },
    { id: 178, topic: "A missing row and a missing privilege fail differently", body: "RLS filters silently (0 rows, 'Success. No rows returned'). A missing privilege raises `42501`. Reading which one happened tells you which layer blocked you." },
    { id: 179, topic: "`select('*')` and `.update().select()` expand to every column", body: "After a column revoke they fail with 42501 even if you only wanted allowed ones. A grep for `from('users')` and `.select(` finds what breaks." },
    { id: 180, topic: "The service-role client bypasses RLS and grants", body: "The route must take the user id from `getUser()`, never the request body. A client-callable SECURITY DEFINER function would skip the age check." },
    { id: 181, topic: "getUser() validates, getSession() trusts the cookie", body: "A cookie name is not a login. A fake `sb-…-auth-token-code-verifier` cookie passed the old guard." },
    { id: 182, topic: "A test needs a control", body: "A harness that can only print DENIED proves nothing. The bio control showed it could print ALLOWED. A combined test can't prove each column is locked on its own." },
    { id: 183, topic: "The signup trigger copies almost nothing", body: "`handle_new_auth_user` inserts only id, email, display_name, and `confirmed_age = false`. Direct sign-up with fake metadata can't plant a date of birth." },
    { id: 184, topic: "The landing header doesn't show login state", body: "'Log in' and 'Sign up' appear even when logged in. A redirect from /age-gate to / (not /login) is the evidence of a valid session." },
    //{ id: 10, topic: "", body: "" },
    //{ id: 10, topic: "", body: "" },
    //{ id: 10, topic: "", body: "" },
    //{ id: 10, topic: "", body: "" },
    //{ id: 10, topic: "", body: "" },
    //{ id: 10, topic: "", body: "" },
    //{ id: 10, topic: "", body: "" },
    //{ id: 10, topic: "", body: "" },
    //{ id: 10, topic: "", body: "" },
    //{ id: 10, topic: "", body: "" },
    //{ id: 10, topic: "", body: "" },
    //{ id: 10, topic: "", body: "" },
    //{ id: 10, topic: "", body: "" },
    //{ id: 10, topic: "", body: "" },
    //{ id: 10, topic: "", body: "" },
    //{ id: 10, topic: "", body: "" },
    //{ id: 10, topic: "", body: "" },
    //{ id: 10, topic: "", body: "" },
    //{ id: 10, topic: "", body: "" },


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
      id: 56, 
      title: "Age-gate navigation lint warning", 
      status: "fixed", 
      date: "November 03, 2026", 
      body: [
        "**Symptom:** `no-location-assign-relative-destination` at the page's line 52.",
        "**Cause:** `window.location.href` for an internal page.",
        "**Fix:** `router.replace('/')` plus `router.refresh()`.",
        "**Verified:** the warning is gone and the total is 103 (102 errors, 1 warning)."
      ] 
    },
    { 
      id: 55, 
      title: "confirmed_age stayed false after the age gate", 
      status: "fixed", 
      date: "November 03, 2026", 
      body: [
        "**Symptom:** finished rows showed false.",
        "**Cause:** no route set it.",
        "**Fix:** both routes set it and the 2 existing rows were backfilled.",
        "**Verified:** all test users and all production flows end with true."
      ] 
    },
    { 
      id: 54, 
      title: "Null signup_country looped users back to /age-gate", 
      status: "fixed", 
      date: "November 03, 2026", 
      body: [
        "**Symptom:** a failed lookup (localhost, VPN, outage) sent a finished user to the age gate on every login.",
        "**Cause:** completion required a non-null country.",
        "**Fix:** completion reads `confirmed_age`.",
        "**Verified:** the localhost user finished with `signup_country` NULL and wasn't looped."
      ] 
    },
    { 
      id: 53, 
      title: "proxy.js let a logged-out browser pass with a leftover cookie", 
      status: "fixed", 
      date: "November 03, 2026", 
      body: [
        "**Symptom:** /dashboard gave a 404 and /age-gate rendered after a failed login.",
        "**Cause:** any cookie starting `sb-` and containing `-auth-token` counted as a session, including `…-code-verifier`.",
        "**Fix:** `getUser()` guard, no user redirects to /login.",
        "**Verified** with a fake cookie on all three environments."
      ] 
    },
    { 
      id: 52, 
      title: "Age gate wasn't write-once and stayed reachable", 
      status: "fixed", 
      date: "November 03, 2026", 
      body: [
        "**Symptom:** a finished user could reopen /age-gate and overwrite their values.",
        "**Cause:** an unconditional update and a guard that only checked a cookie.",
        "**Fix:** the conditional update with 409, and a /age-gate → / redirect for completed users.",
        "**Verified** on localhost, preview, and production."
      ] 
    },
    { 
      id: 51, 
      title: "Users could overwrite their own age-gate and consent fields directly", 
      status: "fixed", 
      date: "November 03, 2026", 
      body: [
        "**Symptom:** one UPDATE changed date_of_birth, signup_country, tos_accepted_at, confirmed_age, created_at, and email, skipping the age check.",
        "**Cause:** table-level UPDATE for authenticated.",
        "**Fix:** revoked it, granted 5 profile columns, moved the write to the admin client.",
        "**Verified:** six columns each DENIED 42501."
      ] 
    },
    { 
      id: 50, 
      title: "Any signed-in user could read other users' date of birth, country, consent time, and email", 
      status: "fixed", 
      date: "November 03, 2026", 
      body: [
        "**Symptom:** the Step 7 query returned User B's private columns.",
        "**Cause:** `users_select_all` (qual true) plus table-level SELECT for authenticated.",
        "**Fix:** revoked table-level SELECT, granted 9 non-sensitive columns.",
        "**Verified:** the same query returns 42501."
      ] 
    },
    { 
      id: 49, 
      title: "`eslint -f unix` command failed", 
      status: "fixed", 
      date: "October 31, 2026", 
      body: "The terminal printed that the unix formatter is no longer in core ESLint. Replaced it with `-f json -o ~/eslint-after-roa039.json` and a node script that prints entries with severity 1." 
    },
    { 
      id: 48, 
      title: "Server Sentry event looked missing", 
      status: "fixed", 
      date: "October 31, 2026", 
      body: "Only the frontend issue (ROAM-2) appeared on the page I was looking at, so the server error seemed lost. The cause was that it's a separate issue (ROAM-6), visible in the Issues list. Confirmed by the Vercel runtime log and the matching trace ID." 
    },
    { 
      id: 47, 
      title: "js-yaml and nanoid still flagged after the Next.js upgrade", 
      status: "fixed", 
      date: "October 31, 2026", 
      body: "Both remained in the audit. The cause was that their parents (eslint, shadcn, Tailwind's postcss) were untouched by the bump. `npm update js-yaml nanoid` refreshed them within existing ranges, lockfile only (4d955cc)." 
    },
    { 
      id: 46, 
      title: "withSentryConfig deprecation warning in dev and builds", 
      status: "fixed", 
      date: "October 31, 2026", 
      body: "Dev start-up and every Vercel build printed that the root import will stop working in Sentry v11. The cause was importing from @sentry/nextjs. Changed the import at next.config.mjs line 1 to @sentry/nextjs/config (8d56963); the warning count went from 4 lines to 0." 
    },
    { 
      id: 45, 
      title: "Critical Next.js advisories in npm audit", 
      status: "fixed", 
      date: "October 31, 2026", 
      body: "The audit reported 1 critical and 12 high findings on Next.js 16.2.12 (vulnerable range ended at 16.4.0). The cause was an outdated Next.js. Upgraded to 16.4.1 with eslint-config-next 16.4.1 (7c63051); the critical finding cleared and the audit dropped from 39 to 37." 
    },
    { 
      id: 44, 
      title: "Focus Lost After Dismissing the Cookie Banner", 
      status: "fixed", 
      date: "October 30, 2026", 
      body: "After pressing Decline, focus reset to body and the next Tab left the page for the browser toolbar. The focused button unmounted with the banner. Added moveFocusToMain() to both click handlers. Verified by activeElement.id returning 'main-content' on both buttons, BODY on an untouched load, and VoiceOver saying 'main' followed by 'Sign up free' on the next Tab."
    },
    { 
      id: 43, 
      title: "Skip link hidden under the dev-log top bar", 
      status: "fixed", 
      date: "October 20, 2026", 
      body: [
        "**Symptom:** on /dev-log the skip link showed as a dark, faint box with a dim ring, while other pages showed a white button.",
        "**Root cause:** the link's `z-index` was 50 and `.dn-topbar` is 100 with a translucent background and `backdrop-filter`.",
        "**Fix:** `focus:z-[10000]` on the link in app/layout.js. Verified: computed z-index 10000 and a white background."
      ] 
    },
    { 
      id: 42, 
      title: "Skip link jumped to the nav, so it skipped nothing", 
      status: "fixed", 
      date: "October 19, 2026", 
      body: [
        "**Symptom:** after Enter on 'Skip to main content', the next Tab landed on 'Roam' in the nav.",
        "**Root cause:** it targeted `<main id='page-root'>`, which wrapped the nav and footer (`main.contains(nav)` was `true`).",
        "**Fix:** `<main id='main-content' tabIndex={-1}>` around each page's content only, with nav and footer outside, and the link pointing there. Verified: `false` on localhost and the preview; focus lands on the first content control on every page."
      ] 
    },
    { 
      id: 41, 
      title: "Form error messages nearly invisible", 
      status: "fixed", 
      date: "October 18, 2026", 
      body: [
        "**Symptom:** 'Invalid login credentials' and the signup and age-gate errors were near-white on the white panel (axe 1.17:1).",
        "**Root cause:** `.auth-error` and `.auth-notice` had no CSS rule, so they inherited `--foreground`, which is `#ededed` under OS dark mode.",
        "**Fix:** explicit `#b91c1c` and `#111827` in auth.css. Verified: computed `rgb(185, 28, 28)` and axe 0 on all three pages with the error showing."
      ] 
    },
    { 
      id: 40, 
      title: "Focus ring invisible on the landing hero", 
      status: "fixed", 
      date: "October 18, 2026", 
      body: [
        "**Symptom:** tabbing to the hero buttons showed an almost invisible ring.",
        "**Root cause:** the global ring `#2563eb` on `#5c4e9e` is 1.34:1.",
        "**Fix:** `.hero :focus-visible { outline-color: #ffffff }` in landing.css. Verified: `rgb(255, 255, 255)` in the hero and `rgb(37, 99, 235)` on a footer link."
      ] 
    },
    { 
      id: 39, 
      title: "Dev-log scroll column not keyboard reachable", 
      status: "fixed", 
      date: "October 18, 2026", 
      body: [
        "**Symptom:** axe reported scrollable-region-focusable on Tech Stack and Code Snippets.",
        "**Root cause:** `.dn-main` scrolls but those tabs hold nothing focusable.",
        "**Fix:** `tabIndex={0}`, `role='region'`, and `aria-label` on the container, with a written eslint-disable. Verified: ring on Tab, scrolling with the arrow keys, axe 0."
      ] 
    },
    { 
      id: 38, 
      title: "60 color-contrast failures across 11 color pairs", 
      status: "fixed", 
      date: "October 17, 2026", 
      body: [
        "**Symptom:** axe reported 6 on /, 5 on /login, 5 on /signup, 4 on /age-gate, 14 on dev-log Progression, 15 on /privacy, 10 on Resources, and 1 on What I Learned.",
        "**Root cause:** muted `rgba` text and tag colors fell short of 4.5:1.",
        "**Fix:** alpha and color edits in six files (footer.css, auth.css, landing.css, devlog.css, privacy.css, devlog-data.js). Verified: axe 0 on localhost in both OS themes."
      ] 
    },
    { 
      id: 37, 
      title: "Fixed cookie banner hid focused footer links", 
      status: "fixed", 
      date: "October 16, 2026", 
      body: [
        "**Symptom:** the Tab focus ring on Privacy, Terms, and About was behind the bar (Test 4).",
        "**Root cause:** `position: fixed` content overlapped the page bottom.",
        "**Fix:** reserved space with the measured `--cookie-banner-h`, and the rings are now visible above the bar."
      ] 
    },
    { 
      id: 36, 
      title: "Cookie banner had no role or name", 
      status: "fixed", 
      date: "October 16, 2026", 
      body: [
        "**Symptom:** the banner was a generic `div` with an empty name (Test 2).",
        "**Fix:** `<section aria-label='Cookie consent'>`, confirmed as Role: region."
      ] 
    },
    { 
      id: 35, 
      title: "Auth form errors were not announced", 
      status: "fixed", 
      date: "October 15, 2026", 
      body: [
        "**Symptom:** a failed submit changed the page with no announcement.",
        "**Root cause:** a plain paragraph with no role.",
        "**Fix:** `role='alert'` on all three auth pages."
      ] 
    },
    { 
      id: 34, 
      title: "Emoji inside the tab button's accessible name", 
      status: "fixed", 
      date: "October 15, 2026", 
      body: [
        "**Symptom:** the name read '🚀 Progression'.",
        "**Fix:** `aria-hidden='true'` on the icon span, and the name is now 'Progression'."
      ] 
    },
    { 
      id: 33, 
      title: "Scroll dock toast was silent to screen readers", 
      status: "fixed", 
      date: "October 15, 2026", 
      body: [
        "**Symptom:** 'Position saved' appeared visually and was not a live region.",
        "**Fix:** `role='status'` on the always-mounted container, verified as a polite, atomic live region."
      ] 
    },
    { 
      id: 32, 
      title: "Active dev-log tab had no programmatic state", 
      status: "fixed", 
      date: "October 15, 2026", 
      body: [
        "**Symptom:** the active tab was shown only by a CSS class.",
        "**Root cause:** no ARIA state on the button.",
        "**Fix:** added `aria-current` using the existing active comparison."
      ] 
    },
    { 
      id: 31, 
      title: "Dev-log had a second main landmark", 
      status: "fixed", 
      date: "October 15, 2026", 
      body: [
        "**Symptom:** two `<main>` elements on /dev-log, since the root layout already owns `main#page-root`.",
        "**Root cause:** TabNav rendered its own `<main className='dn-main'>`.",
        "**Fix:** changed it to a `<div>` after confirming no CSS selected the element."
      ] 
    },
    { 
      id: 30, 
      title: "Confirmation link landed on `localhost:3000`", 
      status: "fixed", 
      date: "October 14, 2026", 
      body: [
        "**Symptom:** the link opened localhost, then `otp_expired` on a second click.",
        "**Cause:** the preview URL was missing from the allow list (and one entry had `//`), and Supabase fell back to the Site URL.",
        "**Fix:** correct entry added, and one click per link."
      ] 
    },
    { 
      id: 29, 
      title: "Dev-log `<video>` failed `media-has-caption`", 
      status: "fixed", 
      date: "October 13, 2026", 
      body: [
        "**Symptom:** the last baseline lint error.",
        "**Cause:** no captions track.",
        "**Fix:** `muted` for silent clips, with real captions deferred for narrated video. The `jsx-a11y` output is now empty (commit pending)."
      ] 
    },
    { 
      id: 28, 
      title: "Email signups looped into the age gate", 
      status: "fixed", 
      date: "October 13, 2026", 
      body: [
        "**Symptom:** `/age-gate` appeared after email confirmation.",
        "**Cause:** the callback treated an empty `signup_country` as incomplete.",
        "**Fix:** completeness now needs only date of birth and consent."
      ] 
    },
    { 
      id: 27, 
      title: "Email signup returned home silently with no confirmation email", 
      status: "fixed", 
      date: "October 13, 2026", 
      body: [
        "**Symptom:** no message, no mail, no session.",
        "**Cause:** `admin.createUser` sends no email, and the client navigated to `/auth/callback` with no `code`.",
        "**Fix:** `signUp` on a cookie-aware client plus a notice."
      ] 
    },
    { 
      id: 26, 
      title: "Localhost crash: `instrumentation.js` MODULE_UNPARSABLE on `main`", 
      status: "fixed", 
      date: "October 13, 2026", 
      body: [
        "**Symptom:** the dev server errored on start.",
        "**Cause:** a stale `.next` from another branch pointing at a file `main` doesn't have.",
        "**Fix:** `rm -rf .next` and `npm run dev`."
      ] 
    },
    { 
      id: 61, 
      title: "Sidebar overlay `div` failed `click-events-have-key-events` and `no-static-element-interactions`", 
      status: "fixed", 
      date: "October 01, 2026", 
      body: [
        "**Symptom:** two baseline hits at one element.",
        "**Cause:** a `div` with `onClick` and no keyboard support.",
        "**Fix:** the component was unused, so it was deleted."
      ] 
    },
    { 
      id: 60, 
      title: "Orphan DOB label flagged twice by `jsx-a11y/label-has-associated-control`", 
      status: "fixed", 
      date: "October 01, 2026", 
      body: [
        "**Symptom:** two baseline lint errors on signup and age-gate.",
        "**Cause:** the 'Date of birth' label wasn't associated with any control (age-gate's selects had no ids).",
        "**Fix:** fieldset, legend, and one hidden label per select."
      ] 
    },
    { 
      id: 59, 
      title: "`globals.css` overwritten by shadcn's `init` command", 
      status: "fixed", 
      date: "September 30, 2026", 
      body: [
        "**Symptom:** homepage lost its purple background scheme and reverted toward shadcn's grayscale defaults after running `npx shadcn@latest add dialog`.",
        "**Root cause:** `init` (triggered because no `components.json` existed yet) fully regenerated `globals.css`, deleting custom tokens and the font-family rule.",
        "**Fix:** diffed against the last committed version via `git show HEAD:app/globals.css`, manually merged shadcn's required tokens back in alongside the restored originals. Verified via screenshots of homepage, login, and signup pages."
      ] 
    },
    { 
      id: 58, 
      title: "Reduced-motion override not applying to `.pulse` animation", 
      status: "fixed", 
      date: "September 26, 2026", 
      body: [
        "**Symptom:** macOS Reduce Motion enabled, but the homepage pulse animation kept running. ",
        "**Root cause:** the override lived inside Tailwind v4's `base` layer, and unlayered CSS (the plain `.pulse` rule in `landing.css`) always wins the cascade over layered CSS regardless of `!important`.",
        "**Fix:** repositioned the media query to sit unlayered, immediately after the Tailwind import. Verified via DevTools Computed panel before and after."
      ] 
    },
    { 
      id: 57, 
      title: "Duplicate `<main>` landmarks breaking screen reader navigation", 
      status: "fixed", 
      date: "September 26, 2026", 
      body: [
        "**Symptom:** a screen reader's landmark list showed 2–3 'main' entries per page, making the jump-to-content shortcut ambiguous.",
        "**Root cause:** every nested layout and page was wrapping its content in its own `<main>`, in addition to the root layout's `<main id='page-root'>`.",
        "**Fix:** swapped every nested instance to `<div>`, confirmed via `grep -rn '<main>'` showing exactly one real hit left (plus one harmless dead-code false positive)."
      ] 
    },
    { 
      id: 56, 
      title: "Age-Gate Redirect Loop on Real Signup", 
      status: "fixed", 
      date: "September 23, 2026", 
      body: [
        "**Symptom:** a freshly signed-up user with a completed date-of-birth and accepted ToS was still redirected to `/age-gate` instead of `/dashboard`.",
        "**Root cause:** `signup_country` was `NULL`. Vercel's IP-geolocation header used to populate it only works on Vercel's actual edge network, not on `localhost`.",
        "**Fix:** manually patched the row via SQL for testing purposes; confirmed this is expected local-dev behavior, not a code defect."
      ] 
    },
    { 
      id: 55, 
      title: "Stack Traces Showing Minified Code Instead of Source", 
      status: "fixed", 
      date: "September 23, 2026", 
      body: [
        "**Symptom:** Sentry's Stack Trace tab showed a minified chunk reference instead of readable file/line info, with an 'Unminify Code' prompt.",
        "**Root cause:** `SENTRY_AUTH_TOKEN` was scoped to Production only in Vercel, so the Preview deployment's build process had no token available to authenticate the source map upload.",
        "**Fix:** added Preview scope to the env var, triggered a new deployment, confirmed a real, readable stack trace on the next test."
      ] 
    },
    { 
      id: 54, 
      title: "Errors Never Reaching Sentry Despite Correct Throws", 
      status: "fixed", 
      date: "September 22, 2026", 
      body: [
        "**Symptom:** terminal logs clearly showed errors being thrown and caught, but Sentry's Issues dashboard never updated to reflect them.",
        "**Root cause:** `lib/withLogging.js`'s catch block logged errors via the custom logger and returned a 500, but never called `Sentry.captureException()`.",
        "**Fix:** added `Sentry.captureException(error)` inside the catch block."
      ] 
    },
    { 
      id: 53, 
      title: "Rate-limit rejections (429s) were completely invisible to the logging system", 
      status: "fixed", 
      date: "September 10, 2026", 
      body: [
        "**Symptom:** `proxy.js`'s rate limiter correctly returned 429 responses with rate-limit headers, but none of those rejections ever produced a log line or an `x-request-id`, since they never reached a route handler wrapped by `withLogging`.",
        "**Root cause:** middleware short-circuits the request before it reaches any `app/api/*/route.js` file, `withLogging` literally never runs for a rejected request.",
        "**Fix:** imported `createRequestId`/`logRequest` directly into `proxy.js` and called them inline inside the existing `if (!success)` block, then added `x-request-id` to that response's headers alongside the existing rate-limit headers. Verified via a real 7-request burst against `authLimiter` (capped at 5/60s), the 6th and 7th requests both produced real matching 429 log lines."
      ] 
    },
    { 
      id: 52, 
      title: "Valid sessions treated as logged out by middleware", 
      status: "fixed", 
      date: "September 08, 2026", 
      body: [
        "**Symptom:** navigating to /dashboard with a confirmed, live session cookie still redirected to /login instead of running the age-gate check.",
        "**Root cause:** the cookie-matching logic used .endsWith('-auth-token'), but real cookies are named …-auth-token.0/.1, which never matches an exact suffix check.",
        "**Fix:** changed to .includes('-auth-token'); verified via a live session correctly reaching /age-gate with a deliberately nulled field."
      ] 
    },
    { 
      id: 51, 
      title: "404 on /auth/age-gate after OAuth", 
      status: "fixed", 
      date: "September 08, 2026", 
      body: [
        "**Symptom:** OAuth login correctly detected missing age-gate fields but redirected to a 404 page instead of the interstitial.",
        "**Root cause:** the redirect target included an extra /auth segment left over from confusing the (auth) route group (no URL impact) with the auth/callback plain folder (real URL impact).",
        "**Fix:** changed the redirect to /age-gate; verified by landing on a real, blank interstitial form post-OAuth."
      ] 
    },
    { 
      id: 50, 
      title: "'permission denied for table users' on signup", 
      status: "fixed", 
      date: "September 03, 2026", 
      body: [
        "**Symptom:** every signup attempt failed at the final database write step with a Postgres permission error, despite RLS policies looking correct.",
        "**Root cause:** service_role had never been GRANTed base table access. GRANT and RLS are separate layers, and GRANT is checked first.",
        "**Fix:** `GRANT SELECT, INSERT, UPDATE ON public.users TO service_role;`, verified via a direct curl request returning real row data afterward."
      ] 
    },
    { 
      id: 49, 
      title: "`proxy.js` build error after the middleware rename", 
      status: "fixed", 
      date: "September 01, 2026", 
      body: [
        "**Symptom:** after renaming `middleware.js` to `proxy.js` and restarting the dev server, Next.js threw a startup error: `The file './proxy.js' must export a function, either as a default export or as a named 'proxy' export.`",
        "**Root cause:** the file was renamed, but the exported function inside it was still named `middleware`, not `proxy`. Next.js 16 checks the export name itself, not just the filename.",
        "**Fix:** changed `export async function middleware(req)` to `export async function proxy(req)`, confirmed via `git diff --stat` showing exactly one line changed."
      ] 
    },
    { 
      id: 48, 
      title: "False-negative rate limit test after a legitimate fix", 
      status: "fixed", 
      date: "September 01, 2026", 
      body: [
        "**Symptom:** after applying the `pickLimiter` fix, a 101-request test against `/api/posts/123` still returned `200` on the 101st request, suggesting the fix hadn't worked.",
        "**Root cause:** the dev server had been running since before the fix was saved and Next.js middleware doesn't reliably hot-reload, the server was still executing the old, buggy code.",
        "**Fix:** restarted the dev server (`Ctrl+C`, then `npm run dev`), then re-ran the identical test, which correctly returned `429` on request 101."
      ] 
    },
    { 
      id: 47, 
      title: "Rate limiting silently skipped for nested post routes", 
      status: "fixed", 
      date: "August 29, 2026", 
      body: [
        "**Symptom:** no visible error, but any request to a path like `/api/posts/123` bypassed rate limiting entirely, while the exact `/api/posts` path was correctly limited.",
        "**Root cause:** `pickLimiter` had an early `return null` specifically for any `/api/posts/*` path that wasn't an exact match, and `null` was never caught by the later general-limiter fallback because the function had already returned.",
        "**Fix:** removed the special-case block entirely, letting those paths fall through naturally to `generalLimiter`."
      ] 
    },
    { 
      id: 46, 
      title: "Silent Login — No Redirect or Feedback on Success", 
      status: "fixed", 
      date: "August 28, 2026", 
      body: [
        "**Symptom:** a correct email/password login produced no visible change; user remained on `/login` with no error and no indication of success, confirmed only via Supabase's `last_sign_in_at` timestamp updating server-side.",
        "**Root cause:** `handleEmailLogin` only had error-path logic (`setError`), no success-path logic at all.",
        "**Fix:** added `useRouter` from `next/navigation`, calling `router.push('/')` and `router.refresh()` on successful `signInWithPassword()`."
      ] 
    },
    { 
      id: 45, 
      title: "Vercel Build Failure: `supabaseUrl is required`", 
      status: "fixed", 
      date: "August 28, 2026", 
      body: [
        "**Symptom:** production build failed while prerendering `/login`.",
        "**Root cause:** Vercel's Environment Variables page had zero variables configured for this project in any environment, a gap despite ROA-002 being marked locally complete.",
        "**Fix:** added all six required variables across Production, Preview, and Development."
      ] 
    },
    { 
      id: 44, 
      title: "`ReferenceError: pathname is not defined` — Site-Wide Middleware Crash", 
      status: "fixed", 
      date: "August 28, 2026", 
      body: [
        "**Symptom:** every route (including `/`) returned a runtime error after pasting in the dashboard-protection code.",
        "**Root cause:** the new code block was placed outside the `middleware()` function entirely, at module scope, where `req` and its derived `pathname` don't exist. A second contributing bug: `config.matcher` had been commented back down to API-only, meaning even a correctly-placed block would never have run against `/dashboard`.",
        "**Fix:** moved the block inside the function, restructured the rate-limiter's early-return into a conditional block so execution properly falls through, and re-enabled the full matcher array."
      ] 
    },
    { 
      id: 43, 
      title: "Confirmation Email Redirects to Wrong URL", 
      status: "fixed", 
      date: "August 26, 2026", 
      body: [
        "**Symptom:** clicking the email confirmation link landed on `/?code=...` instead of exchanging the code for a session.",
        "**Root cause:** `signUp()` had no `emailRedirectTo` set, and Supabase's Redirect URLs allowlist was completely empty, so Supabase silently fell back to the bare Site URL.",
        "**Fix:** added `emailRedirectTo: \`${window.location.origin}/auth/callback\`` to the `signUp()` call, and added the real callback URL to Supabase's allowlist."
      ] 
    },
    { 
      id: 42, 
      title: "PKCE Code Verifier Missing During Session Exchange", 
      status: "fixed", 
      date: "August 26, 2026", 
      body: [
        "**Symptom:** after fixing the 404, the callback route logged `AuthPKCECodeVerifierMissingError` instead of completing the session exchange.",
        "**Root cause:** the client (`@supabase/supabase-js`) stored the PKCE verifier in localStorage, while the server-side route (`@supabase/ssr`) could only read from cookies — a storage location mismatch.",
        "**Fix:** switched the client to `createBrowserClient` from `@supabase/ssr`, aligning both sides on cookie-based storage. Verified via terminal log confirming `session exists: true`."
      ] 
    },
    { 
      id: 41, 
      title: "Google OAuth Redirect Landing on a 404", 
      status: "fixed", 
      date: "August 26, 2026", 
      body: [
        "**Symptom:** after completing Google's consent screen, the app redirected to `/auth/callback`, which returned a 404 page.",
        "**Root cause:** `app/auth/callback/route.js` did not exist anywhere in the project, the OAuth handler was pointing at a route that had never been built.",
        "**Fix:** created the route file using `createServerClient` to exchange the auth code for a session."
      ] 
    },
    { 
      id: 40, 
      title: "Vercel Production Build Crashing with 'supabaseUrl is required'", 
      status: "fixed", 
      date: "August 26, 2026", 
      body: [
        "**Symptom:** build failed during prerendering of `/login`, throwing `Error: supabaseUrl is required`.",
        "**Root cause** investigation revealed two separate issues layered together: `handleEmailLogin` was calling the wrong Supabase auth method (`signInWithOAuth` instead of `signInWithPassword`), and the Supabase client wasn't configured for PKCE flow, which is required for the intended SSR architecture.",
        "**Fix:** corrected the method call, and migrated `lib/supabase.js` to `createBrowserClient` from `@supabase/ssr`."
      ] 
    },
    { 
      id: 39, 
      title: "Sign In/Create Account Button Text Looking Slightly Off vs. Mockup", 
      status: "fixed", 
      date: "August 25, 2026", 
      body: [
        "**Symptom:** subtle visual mismatch in the submit button's boldness compared to the mockup.",
        "**Root cause:** DM Sans's 600 weight was never declared in `layout.js`'s font config, so the browser synthesized a fake bold instead of loading the real 600-weight file, even though `auth.css`'s `font-weight: 600` was already correct.",
        "**Fix:** added `'600'` to the `weight` array in `layout.js`."
      ] 
    },
    { 
      id: 38, 
      title: "Nav Tagline and Footer Text Rendering in Wrong Font", 
      status: "fixed", 
      date: "August 25, 2026", 
      body: [
        "**Symptom:** 'Welcome back'/'Join the map' tagline and footer links/copyright text visually didn't match the mockup's DM Sans typography.",
        "**Root cause:** these elements were outside `.auth-form-inner`'s DOM subtree (which had the DM Sans fix applied), so they fell through to `globals.css`'s Arial fallback.",
        "**Fix:** added explicit `font-family` declarations directly to `.auth-nav-tagline`, `.footer-links a`, and `.footer-copy`."
      ] 
    },
    { 
      id: 37, 
      title: "Signup Age-Gate Checkbox and Text Stacking Instead of Sitting Side-by-Side", 
      status: "fixed", 
      date: "August 25, 2026", 
      body: [
        "**Symptom:** the age-confirmation checkbox appeared above its label text instead of beside it, with no spacing control taking effect.",
        "**Root cause:** `.age-row` used the invalid value `display: row` instead of `display: flex`, so `gap` and `align-items` had no container to apply within.",
        "**Fix:** corrected to `display: flex`."
      ] 
    },
    { 
      id: 36, 
      title: "Auth Panel Lavender Gaps Above/Below White Content", 
      status: "fixed", 
      date: "August 25, 2026", 
      body: [
        "**Symptom:** visible lavender-colored bands between the nav bar and the white auth panel, and between the panel and the footer, on both `/login` and `/signup`.",
        "**Root cause:** `align-items: center` on `.auth-content` overrode flexbox's default `stretch`, preventing `.auth-panel-body` from filling available height despite `flex: 1`.",
        "**Fix:** removed the `align-items: center` declaration entirely."
      ] 
    },
    { 
      id: 35, 
      title: "One-time hydration mismatch error on /signup (div vs. Link on auth-nav-logo)", 
      status: "fixed", 
      date: "August 18, 2026", 
      body: [
        "**Symptom:** browser console threw a React hydration error citing a mismatch between server-rendered `<div className='auth-nav-logo'>` and client-rendered `<a>` (from `Link`) inside `AuthNav.jsx`.",
        "**Root cause:** diagnosed as stale dev-server SSR output momentarily out of sync with a recent edit to `AuthNav.jsx` (converting the logo to a `Link`), not a logic bug.",
        "**Fix:** no code change needed, confirmed not recurring after the dev server caught up to the saved file."
      ] 
    },
    { 
      id: 34, 
      title: "Pages visually 'bleeding' into each other after client-side navigation", 
      status: "fixed", 
      date: "August 18, 2026", 
      body: [
        "**Symptom:** clicking between `/`, `/privacy`, and `/terms` via `<Link>` caused stale colors and layout from a previously visited page to persist or override the current page's styling, most visibly the landing page's hero background shifting from violet to an incorrect shade after a round trip through `/terms`.",
        "**Root cause:** `terms.css` and `privacy.css` both declared global `:root` custom properties and bare-tag selectors (`body`, `header`, `a`, `section`), none of which get cleared on client-side route transitions the way a full page reload would clear them.",
        "**Fix:** rewrote both stylesheets to scope every rule under `.terms-page`/`.privacy-page` wrapper classes, added matching outer `<div>` wrappers in each page's JSX, and added a `<main id='page-root'>` wrapper around `{children}` in root `layout.js` to ensure every route has a stable DOM anchor. Verified fixed via repeated manual round-trip navigation testing between all three pages."
      ] 
    },
    { 
      id: 33, 
      title: "middleware.js placed inside app/, never executes", 
      status: "fixed", 
      date: "August 08, 2026", 
      body: [
        "**Symptom:** no errors, no warnings — the file just never ran, which is the dangerous part.",
        "**Root cause:** Next.js's middleware convention only scans project root (or `src/`), not `app/`.",
        "**Fix:** moved the file up one level to sit beside `app/`, `package.json`, and `lib/`."
      ] 
    },
    { 
      id: 32, 
      title: "`hero-h` not rendering bold despite CSS edit", 
      status: "fixed", 
      date: "August 07, 2026", 
      body: "First fix attempt was reported as applied, but checking the devtools *Styles* panel (not just Computed) showed `font-weight: 700` was never actually present in the live `.hero-h` rule, the edit hadn't saved to the file actually being served. Re-applied and reconfirmed via Styles panel before moving on, per the project's own verify-before-assuming rule."
    },
    { 
      id: 31, 
      title: "Tabler icons rendering as blank boxes", 
      status: "fixed", 
      date: "August 07, 2026", 
      body: [
        "**Root cause:** the CDN `<link>` for the Tabler webfont, present in the original standalone HTML mockup, was never added to the Next.js root layout. No console error, just empty rounded squares where icons should be.",
        "**Fixed** by migrating to `@tabler/icons-react` (see Optimizations).",
        ""
      ] 
    },
    { 
      id: 30, 
      title: "Terms JSX — unclosed `<br>` and malformed fragment close", 
      status: "fixed", 
      date: "August 07, 2026", 
      body: "Four bare `<br>` tags (missing self-close) and a stray space inside the closing fragment tag (`</ >` instead of `</>`) were breaking the JSX parser, cascading into an 11-problem error count. Found via direct inspection of the pasted code rather than guessing from the 'red file' screenshot alone."
    },
    { 
      id: 29, 
      title: "Dashboard/future routes would've rendered unstyled", 
      status: "fixed", 
      date: "August 07, 2026", 
      body: "Nav and Footer CSS was imported in `page.js`, not the layout that actually renders them. Any new route added under `(main)/` — the file tree already showed a placeholder `dashboard` folder — would've inherited zero styling with no error to flag it. Moved both imports into `app/(main)/layout.js`."
    },
    { 
      id: 28, 
      title: "Missing bullet points on plain `<ul>` lists in privacy.jsx", 
      status: "fixed", 
      date: "August 06, 2026", 
      body: "Tailwind's Preflight reset strips default list styling globally, including on hand-styled pages that never use Tailwind utilities directly. Fixed with a targeted override: `ul:not(.pills-list):not(.rights-list):not(.toc-list) { list-style: disc; padding-left: 20px; }`. The exclusion list had to be corrected mid-fix after it initially over-applied bullets to the 'On this page' table of contents."
    },
    { 
      id: 27, 
      title: "JSX build errors in privacy.jsx", 
      status: "fixed", 
      date: "August 06, 2026", 
      body: "Three separate invalid-JSX issues: `clas='hero-eyebrow'` (typo, not a real attribute), a bare `<br>` (JSX requires self-closing `<br />`), and `style='margin-top:0;'` written as a string where JSX requires a camelCased object (`style={{ marginTop: '0' }}`)."
    },
    { 
      id: 26, 
      title: "Dev log phone sidebar rendering as an uneven grid", 
      status: "fixed", 
      date: "August 06, 2026", 
      body: "Tabs were wrapping into visually uneven rows instead of a clean 3/3/2 pattern. Root cause was per-section wrapper `<div>`s being treated as single grid items by CSS Grid instead of their individual tab children. Fixed with `display: contents` on the wrappers plus explicit `nth-child(8)` positioning for the trailing slot."
    },
    { 
      id: 25, 
      title: "Dev log rendering oversized compared to SonicVerse reference", 
      status: "fixed", 
      date: "August 06, 2026", 
      body: "Initially suspected the CSS token values themselves were tuned larger. A full read of both `:root` blocks showed they were identical, the real cause was a missing root font-size override (see Optimizations). Fixed by scoping a `70%` root font-size rule inside `devlog.css`."
    },
    { 
      id: 24, 
      title: "Disputed Whether the Live Workflow Actually Contained the Fix", 
      status: "fixed", 
      date: "August 04, 2026", 
      body: [
        "**Symptom:** disagreement over whether a pushed YAML change had actually executed in GitHub Actions.",
        "**Root cause:** assumption made without checking file evidence on either side.",
        "**Fix:** settled definitively by running `head -5` on the schema file from the most recent real run and confirming the expected line was present."
      ] 
    },
    { 
      id: 23, 
      title: "Restore Failed on `type 'public.geometry' does not exist`", 
      status: "fixed", 
      date: "August 04, 2026", 
      body: [
        "**Symptom:** `places` and `post_points` tables failed to create during restore, cascading into further 'relation does not exist' errors throughout the rest of the schema file.",
        "**Root cause:** `--schema public` scoping dropped the `CREATE EXTENSION postgis` statement entirely, since extensions live outside any single schema's DDL.",
        "**Fix:** prepended an idempotent `CREATE EXTENSION IF NOT EXISTS postgis;` to the schema dump."
      ] 
    },
    { 
      id: 22, 
      title: "Backup Contained Live Auth/Session Data", 
      status: "fixed", 
      date: "August 04, 2026", 
      body: [
        "**Symptom:** None. This was caught by inspection, not by an alarm firing.",
        "**Root cause:** an unscoped dump pulled in `auth.users`, `auth.sessions`, `auth.refresh_tokens`, and `storage.*`, none of which belonged in a portable backup file.",
        "**Fix:** scoped both schema and data dumps to `--schema public`."
      ] 
    },
    { 
      id: 21, 
      title: "Data Dump Still Showed Zero COPY Statements After `--data-only`", 
      status: "fixed", 
      date: "August 04, 2026", 
      body: [
        "**Symptom:** CI's new COPY-count check failed even with `--data-only` explicitly passed.",
        "**Root cause:** `--data-only` alone doesn't produce COPY-format output, it needs the separate `--use-copy` flag.",
        "**Fix:** added `--use-copy` alongside `--data-only`."
      ] 
    },
    { 
      id: 20, 
      title: "Backups Contained No Row Data", 
      status: "fixed", 
      date: "August 04, 2026", 
      body: [
        "**Symptom:** backup files uploaded successfully, passed size checks, and looked correct at every existing check.",
        "**Root cause:** `supabase db dump` with no flags defaults to schema-only output. Zero `COPY` statements anywhere in the file, confirmed via direct grep.",
        "**Fix:** added a dedicated `--data-only` dump pass."
      ] 
    },
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
    { id: 1, name: "React 19", icon: "⚛️", version: "^19.2.4", role: "Frontend UI library" },
    { id: 2, name: "Next.js", icon: "🔼", version: "^16.2.12", role: "Full-stack React framework" },
    { id: 3, name: "Tailwind v4", icon: "🎨", version: "^4.2.4", role: "Utility-first styling" },
    { id: 4, name: "Mapbox GL JS", icon: "📍", version: "^3.28.1", role: "Interactive client-side maps" },
    { id: 5, name: "react-map-gl", icon: "🗺️", version: "^8.1.1", role: "React wrapper for Mapbox GL" },
    { id: 6, name: "Turf.js", icon: "📐", version: "^7.3.5", role: "Client-side geospatial analysis" },
    { id: 7, name: "shadcn/ui", icon: "🧩", version: "4.16.x", role: "Accessible unstyled components" },
    { id: 8, name: "TanStack Query", icon: "🔄", version: "^5.100.6", role: "Client-side state & caching" },
    { id: 9, name: "@upstash/ratelimit", icon: "🛑", version: "^2.0.x", role: "Sliding-window rate limiting framework" },
    { id: 10, name: "@upstash/redis", icon: "🔴", version: "^1.34.x", role: "HTTP-based serverless state & session storage" },
    { id: 11, name: "Supabase", icon: "⚡", version: "^2.112.2", role: "Backend-as-a-Service (BaaS)" },
    { id: 12, name: "PostgreSQL", icon: "🐘", version: "^18.4.0", role: "Relational database engine" },
    { id: 13, name: "PostGIS", icon: "🗺️", version: "^3.3.7", role: "Spatial database extension" },
    { id: 14, name: "Cloudflare R2", icon: "📦", version: "S3 API Compatible", role: "S3-compatible object storage for database backups" },
    { id: 15, name: "AWS CLI", icon: "💻", version: "^2 (Pre-installed)", role: "S3 client used for backup orchestration" },
    { id: 16, name: "Vercel", icon: "☁️", version: "Hosting", role: "Deployment platform" },
    { id: 17, name: "Uptime Robot", icon: "🤖", version: "v3 API", role: "External synthetics & monitoring" },
    { id: 18, name: "Google Cloud Console / Google Auth Platform", icon: "☁️🛡️", version: "Google OAuth 2.0 API", role: "External / OAuth provider" },
    { id: 19, name: "@sentry/nextjs", icon: "🚨🔍", version: "^11.10.0", role: "Error monitoring & performance tracking" },
    { id: 20, name: "eslint-plugin-jsx-a11y", icon: "👓🛠️", version: "^6.10.2", role: "Static JSX accessibility linting" },
    { id: 21, name: "@axe-core/react", icon: "🪓⚛️", version: "^4.13.0", role: "Runtime DOM accessibility auditing (dev-only)" },
    { id: 22, name: "Radix UI", icon: "🦴🎨", version: "^1.6.7", role: "Headless primitives underlying shadcn's Dialog (focus trap, ARIA roles)" },
    //{ id: 6, name: "MongoDB", icon: "🍃", version: "Atlas", role: "NoSQL database" },
    //{ id: 6, name: "MongoDB", icon: "🍃", version: "Atlas", role: "NoSQL database" },
    //{ id: 6, name: "MongoDB", icon: "🍃", version: "Atlas", role: "NoSQL database" },
    //{ id: 6, name: "MongoDB", icon: "🍃", version: "Atlas", role: "NoSQL database" },
    //{ id: 6, name: "MongoDB", icon: "🍃", version: "Atlas", role: "NoSQL database" },
    //{ id: 6, name: "MongoDB", icon: "🍃", version: "Atlas", role: "NoSQL database" },

    //{ id: 6, name: "MongoDB", icon: "🍃", version: "Atlas", role: "NoSQL database" },
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
    {
      id: 5,
      title: "Health check route (`app/api/health/route.js`)",
      lang: "js",
      body: "Place directly in the App Router under `app/api/health/`. Must export a `GET` function and return a 2xx status with no external calls, so Uptime Robot's checks reflect server availability only.",
      code: `export async function GET() {\n  return Response.json({ status: 'ok' }, { status: 200 });\n}`,
    },
    {
      id: 6,
      title: "Scoping a legal/document page's stylesheet to prevent client-nav bleed",
      lang: "css",
      body: "Apply this pattern to any page-specific stylesheet written as if it were a standalone document. Move `:root` variables onto a page class, prefix every bare-tag selector.",
      code: `.terms-page {\n  --roam-deep-base: #0D0A1A;\n  /* ...all other custom properties... */\n}\n.terms-page header { /* ... */ }\n.terms-page a { /* ... */ }`,
    },
    {
      id: 7,
      title: "Width-capped inner form column inside a full-bleed panel",
      lang: "css",
      body: "Use when a container needs to stretch full-height/full-width for background purposes, but its actual content should stay narrower and centered.",
      code: `.auth-panel-body {\n  flex: 1;\n  width: 100%;\n  background: #fff;\n  padding: 2.5rem 3rem;\n  display: flex;\n  flex-direction: column;\n  justify-content: center;\n}\n\n.auth-form-inner {\n  width: 100%;\n  max-width: 32rem;\n  margin: 0 auto;\n}`,
    },
    {
      id: 8,
      title: "Corrected `pickLimiter` routing logic",
      lang: "js",
      body: "Place inside `proxy.js` (formerly `middleware.js`). Determines which rate limiter applies to a given request path; falls through to `generalLimiter` for any `/api/*` path not explicitly matched, rather than silently skipping rate limiting.",
      code: `function pickLimiter(pathname) {\n  if (pathname === "/api/posts") return postLimiter;\n  if (pathname.startsWith("/api/auth")) return authLimiter;\n  if (pathname.startsWith("/api/comments")) return commentLimiter;\n  if (pathname.startsWith("/api/translate")) return translateLimiter;\n  if (pathname.startsWith("/api/")) return generalLimiter;\n  return null;\n}`,
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
    },*/
  ],

  // ── resources: flat list; title becomes a link when `url` is set ─────────
  // Fields per entry: id, title, url (optional — plain text if omitted),
  // category, note (used as the card body, not `body`)

  resources: [
    { id: 1, title: "npm audit Documentation", url: "https://docs.npmjs.com/cli/v8/commands/npm-audit", category: "security & vulnerability remediation", note: "Referenced conceptually while diagnosing the `next@9.3.3` false-positive downgrade path. Covers how `npm audit fix --force` resolves transitive dependency chains and why 'breaking change' warnings should be read before accepting a proposed fix." },
    { id: 2, title: "Tailwind CSS v4 Docs", url: "https://tailwindcss.com/docs", category: "styling", note: "v4 uses @theme in CSS instead of tailwind.config.js." },
    { id: 3, title: "Supabase Docs", url: "https://supabase.com/docs", category: "backend", note: "Full documentation for Supabase database, auth, storage, RLS, and JavaScript client. Primary reference for all backend work on Roam." },
    { id: 4, title: "Supabase RLS Guide", url: "https://supabase.com/docs/guides/database/postgres/row-level-security", category: "styling", note: "Row Level Security concepts, USING vs WITH CHECK distinction, policy creation patterns, and testing approaches." },
    { id: 5, title: "Supabase Auth Guide", url: "https://supabase.com/docs/guides/auth", category: "auth", note: "Session management, user management, OAuth providers, and auth hooks." },
    { id: 6, title: "Supabase PostGIS Guide", url: "https://supabase.com/docs/guides/database/extensions/postgis", category: "database", note: "PostGIS extension setup, geometry column types, spatial query functions, and GIST indexing. Reference for all coordinate and proximity query work." },
    { id: 7, title: "Supabase JavaScript Client Reference", url: "https://supabase.com/docs/reference/javascript/introduction", category: "backend", note: "Complete API reference for the Supabase JS client. Every Supabase query written in Next.js uses this reference for syntax." },
    { id: 8, title: "Supabase CLI — `db dump` Reference", url: "https://supabase.com/docs/reference/cli/introduction", category: "deployment", note: "Covers the full flag set for `supabase db dump`, including `--data-only`, `--schema-only` (the current default behavior), and connection string requirements." },
    { id: 9, title: "Cloudflare R2 — S3 Compatibility API", url: "https://developers.cloudflare.com/r2/api/s3/api/", category: "database", note: "Documents R2's S3-compatible endpoint structure and authentication, needed for pointing the AWS CLI at R2 instead of actual AWS S3 (`--endpoint-url` usage)." },
    { id: 10, title: "React hydration mismatch guide", url: "https://react.dev/link/hydration-mismatch", category: "routing", note: "Referenced directly from the console error this session when diagnosing the transient div/Link SSR mismatch on `AuthNav.jsx`" },
    { id: 11, title: "Next.js: Middleware to Proxy Migration", url: "https://nextjs.org/docs/messages/middleware-to-proxy", category: "routing", note: "Referenced directly from the dev server's deprecation warning; covers migrating from `middleware.js` to the newer `proxy.js` convention required by Next.js 16.2.12." },
    { id: 12, title: "Next.js: Prerender Error", url: "https://nextjs.org/docs/messages/prerender-error", category: "build", note: "Referenced directly from the Vercel build log during the initial `supabaseUrl is required` crash investigation; covers common causes of prerendering failures." },
    { id: 13, title: "Vercel: MIDDLEWARE_INVOCATION_FAILED Error Reference", url: "https://vercel.com/docs/errors/middleware_invocation_failed", category: "build", note: "Vercel's documentation page linked directly from the 500 error page itself, describing the error code encountered during the production `/api/health` outage investigation." },
    { id: 14, title: "Tailwind CSS v4 Cascade Layers", url: "https://tailwindcss.com/blog/tailwindcss-v4", category: "styling", note: "Covers how `@layer base, components, utilities;` establishes layer precedence, and why unlayered CSS always wins against layered rules regardless of specificity. The root cause behind this session's reduced-motion bug." },
    { id: 15, title: "shadcn/ui CLI — `init` vs `add`", url: "https://ui.shadcn.com/docs/cli", category: "build", note: "Documents what `init` does differently from `add` on an existing project, including when it will regenerate `globals.css`. It's relevant after this session's overwrite incident." },
    { id: 16, title: "Next.js: no-img-element", url: "https://nextjs.org/docs/messages/no-img-element", category: "build", note: "Why `<img>` raises a lint warning and when `next/image` is preferred." },
    { id: 17, title: "Tailwind CSS v4 Docs", url: "https://tailwindcss.com/docs", category: "styling", note: "v4 uses @theme in CSS instead of tailwind.config.js." },
    { id: 18, title: "WCAG 2.1", url: "https://www.w3.org/WAI/WCAG21/Understanding/non-text-contrast.html", category: "accessibility", note: "Globally recognized set of technical standards designed to make web content more accessible to people with disabilities" },
    { id: 19, title: "WAI-ARIA live regions (role='alert' and role='status')", url: "https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Guides/Live_regions", category: "accessibility", note: "Behind the toast and form-error changes: assertive versus polite announcements." },
    { id: 20, title: "Chrome DevTools: Rendering and element states", url: "https://developer.chrome.com/docs/devtools/rendering/apply-effects?st_source=ai_mode", category: "devtools", note: "Emulate a focused page, emulate `prefers-color-scheme`, and force `:focus` or `:focus-visible` from the `:hov` panel in Elements." },
    { id: 21, title: "You Might Not Need an Effect", url: "https://react.dev/learn/you-might-not-need-an-effect", category: "react", note: "The page linked from the react-hooks/set-state-in-effect lint error in CookieBanner.jsx (ROA-041)." },
    { id: 22, title: "React DevTools", url: "https://react.dev/link/react-devtools", category: "tooling", note: "The install prompt printed in the dev console during the INP checks." },
    //{ id: 4, title: "Tailwind CSS v4 Docs", url: "https://tailwindcss.com/docs", category: "styling", note: "v4 uses @theme in CSS instead of tailwind.config.js." },
    //{ id: 4, title: "Tailwind CSS v4 Docs", url: "https://tailwindcss.com/docs", category: "styling", note: "v4 uses @theme in CSS instead of tailwind.config.js." },
    //{ id: 4, title: "Tailwind CSS v4 Docs", url: "https://tailwindcss.com/docs", category: "styling", note: "v4 uses @theme in CSS instead of tailwind.config.js." },
    //{ id: 4, title: "Tailwind CSS v4 Docs", url: "https://tailwindcss.com/docs", category: "styling", note: "v4 uses @theme in CSS instead of tailwind.config.js." },
    //{ id: 4, title: "Tailwind CSS v4 Docs", url: "https://tailwindcss.com/docs", category: "styling", note: "v4 uses @theme in CSS instead of tailwind.config.js." },
    //{ id: 4, title: "Tailwind CSS v4 Docs", url: "https://tailwindcss.com/docs", category: "styling", note: "v4 uses @theme in CSS instead of tailwind.config.js." },
    //{ id: 4, title: "Tailwind CSS v4 Docs", url: "https://tailwindcss.com/docs", category: "styling", note: "v4 uses @theme in CSS instead of tailwind.config.js." },
    //{ id: 4, title: "Tailwind CSS v4 Docs", url: "https://tailwindcss.com/docs", category: "styling", note: "v4 uses @theme in CSS instead of tailwind.config.js." },
    //{ id: 4, title: "Tailwind CSS v4 Docs", url: "https://tailwindcss.com/docs", category: "styling", note: "v4 uses @theme in CSS instead of tailwind.config.js." },
    //{ id: 4, title: "Tailwind CSS v4 Docs", url: "https://tailwindcss.com/docs", category: "styling", note: "v4 uses @theme in CSS instead of tailwind.config.js." },

    
    
    //{ id: 4, title: "Tailwind CSS v4 Docs", url: "https://tailwindcss.com/docs", category: "styling", note: "v4 uses @theme in CSS instead of tailwind.config.js." },
  ],
};

// ─── Style maps ───────────────────────────────────────────────────────────────
const TAG_STYLES = {
  // ── deployment: pushed off cyan toward a deeper, more saturated blue so it
  // reads distinctly from feature's cyan while still popping against the bg.
  deployment:  { bg: "rgba(47,111,255,0.12)", color: "#4c83ff", border: "rgba(47,111,255,0.3)" },
  feature:     { bg: "rgba(34,211,238,0.1)",  color: "#22d3ee", border: "rgba(34,211,238,0.25)" },
  fix:         { bg: "rgba(255,201,60,0.1)",  color: "#ffc93c", border: "rgba(255,201,60,0.25)" },
  // ── fixed: explicit entry so it stops silently falling back to
  // TAG_STYLES.feature — pairs with the red "open" status in the Bug Log.
  fixed:       { bg: "rgba(0,229,160,0.1)",   color: "#00e5a0", border: "rgba(0,229,160,0.25)" },
  refactor:    { bg: "rgba(167,139,250,0.1)", color: "#a78bfa", border: "rgba(167,139,250,0.25)" },
  // ── performance: lightened toward near-white so it's actually legible —
  // previous slate was too close to bg/muted text to register as a tag.
  performance: { bg: "rgba(221,226,234,0.14)", color: "#dde2ea", border: "rgba(221,226,234,0.4)" },
  decision:    { bg: "rgba(250,204,21,0.1)",  color: "#facc15", border: "rgba(250,204,21,0.25)" },
  documentation: { bg: "rgba(201,168,118,0.1)", color: "#c9a876", border: "rgba(201,168,118,0.25)" },
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
            <img src={media.src} alt={media.alt ?? (media.caption ? "" : "Dev log screenshot")} loading="lazy" />
          )}

          {media.type === "video" && (
            <video controls muted preload="metadata">
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

// ─── Valid tab ids + default, derived live from TABS ─────────────────────────
// Shared by TabNav.jsx (URL validation / back-forward handling) and page.jsx
// (server-side searchParams validation) — defined once here so both stay in
// sync automatically as tabs are added to or removed from TABS above.
const VALID_TAB_IDS = new Set(TABS.map((t) => t.id));
const DEFAULT_TAB = "progression";

// ─── Exports for TabNav.jsx (client) and page.jsx (server) ──────────────────
export { TABS, PINNED, DATA, PANES, formatCount, VALID_TAB_IDS, DEFAULT_TAB };
