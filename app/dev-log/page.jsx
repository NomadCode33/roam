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

// ─── Pinned Cards ─────────────────────────────────────────────────────────────
// Optional pinned card shown at the top of a tab, inside the content header
// (below the description/count line, above the horizontal rule). One card
// per tab, keyed by tab id. To take a card down, delete its entry (or set
// it to null/undefined) and redeploy — no separate on/off flag needed.
//
// Fields:
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
//
// Example — single link:
//   progression: {
//     label: "PINNED",
//     title: "Roadmap board",
//     body: "Live task tracking for what's in progress right now.",
//     linkText: "Open Trello →",
//     linkUrl: "https://trello.com/b/yourboard",
//   },
//
// Example — multiple links (e.g. one per phase), horizontal (default):
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
// Example — same, but stacked vertically:
//   progression: {
//     ...
//     linksLayout: "vertical",
//     links: [
//       { text: "Phase 1 →", url: "https://trello.com/b/phase1" },
//       { text: "Phase 2 →", url: "https://trello.com/b/phase2" },
//     ],
//   },
//
// If both `links` and `linkText`/`linkUrl` are present, `links` takes priority.
//
// Leave a tab's entry out entirely (or null) to show no pinned card there.
const PINNED = {
  progression: null,
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

const DATA = {
  progression: [
    {
      id: 1,
      date: "Mar 25, 2026",
      title: "Fixed Render deployment — stale Vite cache",
      // multi-paragraph body example — array of strings
      body: [
        "Root-level npm install was missing from the Render build command, causing stale hashed filenames to break production. Fixed by clearing cache and updating the build command to: npm install && cd react-frontend && npm install && npm run build.",
        "It then was pretty cool to add multiple pictures. Root-level npm install was missing from the Render build command, causing stale hashed filenames to break production. Fixed by clearing cache and updating the build command to: npm install && cd react-frontend && npm install && npm run build.",
      ],
      tag: "deployment",
      /*mediaItems: [
        { type: "image",   src: "/img/hero-images/SA2_Cast_Japan.webp", caption: "The MIME error in DevTools" },
        { type: "image",   src: "/img/hero-images/SADX_Cast.webp", caption: "The MIME error in DevTools" }
      ]*/
      // Example — uncomment and fill in to add media to this card:
      // mediaItems: [
      //   { type: "image", src: "/images/your-screenshot.png", caption: "Optional caption" },
      //   { type: "image", src: "/images/another.png" },
      // ]
    },
    {// pulling data from MongoDB via the Express API.
      id: 2,
      date: "Mar 20, 2026",
      title: "Characters page live",
      body: "Characters nested route under /verse-hub is live, pulling data from the Express API.",
      tag: "feature",
    },
    {// with MongoDB Atlas connection
      id: 3,
      date: "Mar 10, 2026",
      title: "Initial SonicVerse deploy",
      body: "React + Vite frontend served by Express backend. Successfully deployed to Render.",
      tag: "deployment",
    },
  ],

  future: [
    { id: 1, 
      title: "API Documentation",
      priority: "high",  
      body: "The API Documentation is crucial for developers to understand how to interact with the backend services."
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
    { id: 3, 
      title: "Games Page", 
      priority: "medium", 
      body: "Document all Sonic games, including spin-off titles, that have been released." 
    },
    { id: 4, 
      title: "Transformations Page", 
      priority: "medium", 
      body: "Document all Sonic transformations — Super, Hyper, Dark Sonic, and more — with stats and lore entries." 
    },
    { id: 5, 
      title: "Admin / API Home",     
      priority: "medium", 
      body: "A dedicated admin panel route for managing content and monitoring the Express API." 
    },
    { id: 6, 
      title: "User Auth",            
      priority: "low",    
      body: "Allow users to create accounts, save favourite characters, and track quiz scores." 
    },
    { id: 7, 
      title: "Quiz Trivia Page",     
      priority: "low",   
      body: "Route is already set up in the codebase. A full Sonic trivia quiz with score tracking and a leaderboard." 
    },
  ],

  // ── Optimizations data ────────────────────────────────────────────────────
  // Cards are grouped by `month` in OptimizePane. Add new months freely —
  // the pane auto-discovers all unique months from this array in order.
  // Put the most recent entries at the top within each month.
  optimize: [
    {
      id: 1,
      month: "April 2026",
      date: "Apr 03, 2026",
      title: "Dev Log: Optimizations Tab",
      body: "Made the Optimizations tab in Dev Log that has the structure of (Month, Year) with the card content below it.",
      bullets: [
        "I didn't want the optimizations tab in Dev Log because I thought that the 'Progression' 'What I Learned' tabs would showcase my skillset",
        "I realized that showing optimizations was important to show my growth as a developer and show that I can not only build features, but also make them more efficient over time"
      ],
      tag: "refactor",
    },
    {
      id: 2,
      month: "March 2026",
      date: "Mar 02, 2026",
      title: "Characters: Character tiles (mobile)",
      body: "Updated how the character tiles are displayed on mobile devices for the 'Browse Characters List' in the search box.",
      bullets: [
        "Used the flexbox features to have the tile wrap side-by-side, if possible",
        "If they're not able to...then they are centered with each entry being on their own row like a normal list",
      ],
      tag: "refactor",
    },
    {
      id: 3,
      month: "March 2026",
      date: "Mar 02, 2026",
      title: "Custom search names for character searching",
      body: "I added nicknames by how they're called in universe and in reference material for easier searching.",
      bullets: [
        "For example, searching 'Tails' will now also pull up 'Miles Tails Prower' since that's his nickname and how he's often referred to in official materials",
      ],
      tag: "refactor",
    },
    {
      id: 4,
      month: "March 2026",
      date: "Mar 02, 2026",
      title: "Hash table implementation w/localhost",
      body: "I implemented new search functionality allowing it to search via localhost for O(1) time.",
      bullets: [
        "My previous implementation worked, but was too slow because Render often spun down with inactivity",
        "To circumvent this, the hash table is now built on the frontend at runtime, so searching is lightning fast even if the backend is down",
      ],
      tag: "performance",
    },
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
    
    /*{
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
    },*/
  ],

  learned: [
    { id: 1, topic: "Render Build Cache",         body: "Render caches the build directory between deploys. Vite hashes output filenames on every build — if old dist/ artifacts are served from cache, the HTML references filenames that no longer exist. Always clear cache when production diverges from local." },
    { id: 2, topic: "nodemon is dev-only",         body: "nodemon restarts the server on every file change — useful in development, wrong in production. Render's start script must use node server.js. nodemon belongs only in the dev script." },
    { id: 3, topic: "React Router Nested Routes", body: "Layout routes wrap child routes via Outlet. The parent renders the layout and children render inside it. Index routes handle the default child when no sub-path is matched." },
  ],

  bugs: [
    { id: 1, title: "MIME type error in production",                status: "fixed", date: "Mar 25, 2026", body: "JS files served with the wrong MIME type. Root cause: stale Vite build cache on Render serving outdated hashed filenames. Fixed by clearing cache and correcting the build command." },
    { id: 2, title: "nodemon/node scripts swapped in package.json", status: "fixed", date: "Mar 25, 2026", body: "The start script had nodemon and dev had node — completely backwards. Corrected so start uses node for Render and dev uses nodemon." },
  ],

  stack: [
    { id: 1, name: "React 19",     icon: "⚛️", version: "^19.2.0",  role: "Frontend UI library" },
    { id: 2, name: "Vite 7",       icon: "⚡", version: "^7.2.4",   role: "Build tool & dev server" },
    { id: 3, name: "React Router", icon: "🧭", version: "^7.12.0",  role: "Client-side routing" },
    { id: 4, name: "Tailwind v4",  icon: "🎨", version: "^4.1.18",  role: "Utility-first styling" },
    { id: 5, name: "Express",      icon: "🖥️", version: "backend",  role: "Node.js web server" },
    { id: 6, name: "MongoDB",      icon: "🍃", version: "Atlas",    role: "NoSQL database" },
    { id: 7, name: "EJS",          icon: "📄", version: "backend",  role: "Server-side templates" },
    { id: 8, name: "Render",       icon: "☁️", version: "hosting",  role: "Deployment platform" },
  ],

  snippets: [
    {
      id: 1,
      title: "Render Build Command",
      lang: "bash",
      body: "Correct build command — root install must be explicit or Render cache will skip it.",
      code: "npm install && cd react-frontend && npm install && npm run build",
    },
    {
      id: 2,
      title: "Express Static Serve (Vite build)",
      lang: "js",
      body: "Serve the Vite dist folder from Express. Must come after all API routes.",
      code: `import path from 'path';\nimport { fileURLToPath } from 'url';\n\nconst __dirname = path.dirname(fileURLToPath(import.meta.url));\n\napp.use(express.static(path.join(__dirname, 'react-frontend/dist')));\n\napp.get('*', (req, res) => {\n  res.sendFile(path.join(__dirname, 'react-frontend/dist/index.html'));\n});`,
    },
  ],

  resources: [
    { id: 1, title: "Vite Docs",            url: "https://vite.dev",             category: "build",      note: "Official Vite documentation — config, plugins, and deployment guides." },
    { id: 2, title: "React Router v7 Docs", url: "https://reactrouter.com",      category: "routing",    note: "Full API reference for nested routes, loaders, and actions." },
    { id: 3, title: "Render Docs",          url: "https://render.com/docs",      category: "deployment", note: "Build settings, environment variables, and cache management." },
    { id: 4, title: "Tailwind CSS v4 Docs", url: "https://tailwindcss.com/docs", category: "styling",    note: "v4 uses @theme in CSS instead of tailwind.config.js." },
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
const CardBody = ({ body }) => {
  if (!body) return null;

  // Plain string — single paragraph, same as original behaviour
  if (typeof body === 'string') {
    return <div className="dn-card-body">{body}</div>;
  }

  // Array — render each entry in order:
  //   string  → paragraph
  //   object with `bullets` key → bullet list via CardBullets
  if (Array.isArray(body)) {
    return (
      <>
        {body.map((entry, i) => {
          // Object with bullets key — inline bullet list
          if (entry && typeof entry === 'object' && entry.bullets) {
            return <CardBullets key={i} bullets={entry.bullets} />;
          }
          // Plain string — paragraph
          return (
            <div className="dn-card-body" key={i}>
              {entry}
            </div>
          );
        })}
      </>
    );
  }

  return null;
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

// ─── PinnedCard helper ────────────────────────────────────────────────────────
// Renders the optional pinned card for a tab, looked up from PINNED by tab id.
// Returns null (renders nothing) if that tab has no entry in PINNED — this is
// how a pinned card gets "taken down": delete/null the PINNED entry, not a flag.
const PinnedCard = ({ id }) => {
  const config = PINNED[id];
  if (!config) return null;

  return (
    <div className="dn-pinned-card">
      {config.label && <div className="dn-pinned-label">{config.label}</div>}
      <div className="dn-pinned-title">{config.title}</div>
      {/* Reuses CardBody so pinned cards support string or array body, same as regular cards */}
      <CardBody body={config.body} />
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

function ProgressionPane() {
  const items = DATA.progression;
  return (
    <>
      <div className="dn-content-header">
        <div className="dn-content-title">🚀 <span>Progression</span></div>
        <div className="dn-content-desc">Every milestone, fix, and feature shipped so far.</div>
        <div className="dn-count-line"><span>{items.length}</span> updates logged</div>
        {/* Optional pinned card — no-op if PINNED.progression is null */}
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
            <CardBody body={item.body} />
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

function FuturePane() {
  const items = DATA.future;
  const byPriority = (p) => items.filter((i) => i.priority === p);
  return (
    <>
      <div className="dn-content-header">
        <div className="dn-content-title">🔮 <span>Future Updates</span></div>
        <div className="dn-content-desc">What's coming next for SonicVerse.</div>
        <div className="dn-count-line"><span>{items.length}</span> features planned</div>
        {/* Optional pinned card — no-op if PINNED.future is null */}
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
                  {/* CardBody handles string or array */}
                  <CardBody body={item.body} />
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
        {/* Optional pinned card — no-op if PINNED.optimize is null */}
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
                  {/* CardBody handles string or array */}
                  <CardBody body={item.body} />
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

function LearnedPane() {
  const items = DATA.learned;
  return (
    <>
      <div className="dn-content-header">
        <div className="dn-content-title">🧠 <span>What I Learned</span></div>
        <div className="dn-content-desc">Lessons and insights picked up while building SonicVerse.</div>
        <div className="dn-count-line"><span>{items.length}</span> lessons logged</div>
        {/* Optional pinned card — no-op if PINNED.learned is null */}
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
            {/* CardBody handles string or array */}
            <CardBody body={item.body} />
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
        {/* Optional pinned card — no-op if PINNED.bugs is null */}
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
            {/* CardBody handles string or array */}
            <CardBody body={item.body} />
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

function StackPane() {
  return (
    <>
      <div className="dn-content-header">
        <div className="dn-content-title">⚙️ <span>Tech Stack</span></div>
        <div className="dn-content-desc">Every tool and service powering SonicVerse.</div>
        {/* Optional pinned card — no-op if PINNED.stack is null */}
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

function SnippetsPane() {
  return (
    <>
      <div className="dn-content-header">
        <div className="dn-content-title">📎 <span>Code Snippets</span></div>
        <div className="dn-content-desc">Useful patterns and reference code from the project.</div>
        {/* Optional pinned card — no-op if PINNED.snippets is null */}
        <PinnedCard id="snippets" />
      </div>
      <div className="dn-cards">
        {DATA.snippets.map((item) => (
          <div className="dn-card" key={item.id}>
            <div className="dn-card-meta">
              <span className="dn-snippet-lang">{item.lang}</span>
            </div>
            <div className="dn-card-title">{item.title}</div>
            {/* CardBody handles string or array */}
            <CardBody body={item.body} />
            {/* Optional bullet list — omit bullets field on card data to hide */}
            <CardBullets bullets={item.bullets} />
            {item.code  && <pre className="dn-code-block">{item.code}</pre>}
            {/* Was media={item.media} — now mediaItems={item.mediaItems} */}
            <CardMedia mediaItems={item.mediaItems} />
          </div>
        ))}
      </div>
    </>
  );
}

function ResourcesPane() {
  return (
    <>
      <div className="dn-content-header">
        <div className="dn-content-title">🔗 <span>Resources</span></div>
        <div className="dn-content-desc">Documentation and useful links referenced during development.</div>
        {/* Optional pinned card — no-op if PINNED.resources is null */}
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
            {/* CardBody handles string or array (note field used here) */}
            <CardBody body={item.note} />
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
          <span className="dn-topbar-title">Sonic<span>Verse</span> — Dev Log</span>
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
