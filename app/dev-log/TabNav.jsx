"use client";
// ─── TabNav.jsx ───────────────────────────────────────────────────────────────
// Client component: owns everything that requires a browser — sidebar button
// clicks, tab routing (URL sync), and ScrollDock (scroll position tracking).
//
// Pane CONTENT is not rendered here. It arrives as the `activePane` prop from
// the server component (page.jsx), already resolved server-side. That split is
// what makes the dev log's real content show up in the raw HTML response
// instead of only existing after hydration.
import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { TABS, DATA, formatCount, VALID_TAB_IDS, DEFAULT_TAB } from "./devlog-data";

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

// ─── TabNav ───────────────────────────────────────────────────────────────────
// The interactive shell: topbar, sidebar nav, and the scroll dock. Receives the
// already-rendered active pane as a prop instead of rendering it here — this
// component's only job is clicking / routing / scrolling, not content.
//
//   activeTabId:  which tab is active, resolved server-side from the URL
//   activePane:   the already-rendered JSX for that tab's content
const TabNav = ({ activeTabId, activePane }) => {
  // BEFORE: const [darkMode, setDarkMode] = useState(false);
  // AFTER: reads from localStorage on mount, same pattern as VerseHubLayout
  /*const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });*/

  // saves preference to localStorage whenever darkMode changes
  /*useEffect(() => {
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);*/

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Local state mirrors the server-resolved activeTabId so the sidebar
  // highlight updates instantly on click, before the server round-trip lands.
  const [activeTab, setActiveTabState] = useState(activeTabId);

  // Keeps local state in sync with the URL in both directions:
  //  - back/forward navigation and direct/bookmarked links update `activeTab`
  //  - clicking a sidebar tab pushes a new URL (see setActiveTab below)
  // Guards against invalid/missing ?tab= by silently normalizing to the default
  // rather than rendering a blank pane.
  useEffect(() => {
    const urlTab = searchParams.get("tab");
    const normalized = VALID_TAB_IDS.has(urlTab) ? urlTab : DEFAULT_TAB;
    if (normalized !== activeTab) {
      setActiveTabState(normalized);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Single entry point for tab switches — updates local state immediately (no
  // flash while the URL updates) and pushes the new query string. The server
  // component re-renders with the new tab's content on navigation.
  // `scroll: false` keeps ScrollDock's own scroll-restoration behavior intact
  // instead of Next.js jumping the page to top.
  const setActiveTab = (id) => {
    setActiveTabState(id);
    router.push(`${pathname}?tab=${id}`, { scroll: false });
  };

  // Ref to the scrollable content container — passed to ScrollDock so it can
  // read/drive scroll position. .dn-main is the actual scrolling element in
  // this layout (sidebar + topbar stay fixed).
  const mainScrollRef = useRef(null);

  const sections = [...new Set(TABS.map((t) => t.section))];

  // Badge count read straight from the imported DATA object — the same source
  // page.jsx uses server-side, so sidebar counts never drift from what's
  // actually rendered in the pane.
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
                    <span className="dn-tab-badge">{formatCount(getCount(tab.id))}</span>
                  )}
                </button>
              ))}
            </div>
          ))}
        </nav>

        {/* Only the active pane is rendered now — the server already resolved
            which one it is, so the previous TABS.map over all eight panes
            (with only the active one filled in) is no longer needed. The
            .dn-pane.active class pair is preserved so devlog.css rules that
            target it keep applying unchanged.

            key={activeTab} is load-bearing: with a single persistent pane div,
            React would reuse the same DOM node across tab switches and the
            fadeSlideIn animation on .dn-pane.active would never replay. Keying
            on the tab id forces a remount per switch, which restarts the
            animation exactly like the old eight-div version did. */}
        <main className="dn-main" ref={mainScrollRef}>
          <div className="dn-pane active" key={activeTab}>
            {activePane}
          </div>
        </main>
      </div>

      {/* Persistent scroll dock — lives outside .dn-main/.dn-pane so it never
          remounts on tab switch; fixed-position via CSS, bottom-right. */}
      <ScrollDock scrollRef={mainScrollRef} activeTab={activeTab} />
    </div>
  );
};

export default TabNav;
