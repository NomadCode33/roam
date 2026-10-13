// ─── page.jsx (server component) ────────────────────────────────────────────
// No "use client" — this runs on the server per-request, not in the browser.
// It reads ?tab= from the URL, resolves the matching pane's real content from
// PANES (devlog-data.js), and hands both down to TabNav.
//
// This is the fix for the empty-shell-on-fetch problem. Previously the entire
// page (content + interactivity) was one client component, so the server had
// nothing real to send — just a shell plus a JS bundle, and the actual cards
// and text only existed once the browser hydrated. Resolving content here
// means a plain HTTP GET (curl, a search-engine crawler, a link-preview bot,
// or any tool reading this page) sees the real pane content immediately, with
// no JS execution required.
//
// TabNav.jsx (client) still owns sidebar clicks, URL updates on navigation,
// and ScrollDock — none of that can run on the server, so it stays there.
//
// Routing model is unchanged from the single-file version: /dev-log?tab=<id>,
// driven entirely off the TABS array. Any tab added to TABS gets a working
// server-rendered route for free, with no changes to this file.
import "../../css/devlog.css";
import TabNav from "./TabNav";
import { PANES, VALID_TAB_IDS, DEFAULT_TAB } from "./devlog-data";

// Next.js passes searchParams as a prop to server components. In Next.js 15+
// it's a Promise and must be awaited; on 13.4–14 it's a plain object and the
// await is a harmless no-op, so this form works on both.
const DevLogPage = async ({ searchParams }) => {
  const params = await searchParams;
  const requestedTab = params?.tab;

  // Same validation logic as before, just running server-side now: falls back
  // to the default tab if ?tab= is missing or names an id that doesn't exist
  // in TABS (e.g. a stale bookmark from a tab you later removed).
  const activeTabId = VALID_TAB_IDS.has(requestedTab) ? requestedTab : DEFAULT_TAB;

  // Resolved here, server-side — this JSX becomes part of the actual response
  // body rather than something assembled client-side after the fact.
  const activePane = PANES[activeTabId];

  return <TabNav activeTabId={activeTabId} activePane={activePane} />;
};

export default DevLogPage;
