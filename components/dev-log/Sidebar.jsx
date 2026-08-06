import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bars3Icon, 
  XMarkIcon, 
  ChevronDownIcon, 
  HomeIcon, 
  UserGroupIcon, 
  SparklesIcon, 
  QuestionMarkCircleIcon, 
  FilmIcon, 
  MusicalNoteIcon, 
  ArrowRightOnRectangleIcon,
  DocumentTextIcon 
} from '@heroicons/react/24/outline';

// ─── NAV STRUCTURE ────────────────────────────────────────────────────────────
//
// Each entry in NAV_SECTIONS can be one of two shapes:
//
// 1) DROPDOWN SECTION — has an icon, a label, and an array of child links.
//    Optionally add `routePrefix` to auto-expand when the URL matches.
//    The `homeTo` field defines the route the section label navigates to when
//    clicked directly (independent of the chevron toggle).
//
//    {
//      label: 'VerseHub',
//      icon: HomeIcon,
//      routePrefix: '/verse-hub', ← auto-expand: opens when URL starts with this
//      homeTo: '/verse-hub',      ← clicking the label navigates here directly
//      links: [
//        { label: 'Home',       to: '/verse-hub' },
//        { label: 'Characters', to: '/verse-hub/characters' },
//      ],
//    }
//
// 2) STANDALONE LINK — has an icon, a label, and a `to` but NO `links` array.
//    Renders as a single full-width clickable row with no dropdown at all.
//
//    {
//      label: 'Dev Notes',
//      icon: SparklesIcon,
//      to: '/dev-notes',          ← required: the route this navigates to
//    }

const NAV_SECTIONS = [
  {
    label: 'VerseHub',
    icon: HomeIcon,
    routePrefix: '/verse-hub',
    // Clicking the label text navigates directly to VerseHub home
    homeTo: '/verse-hub',
    links: [
      { label: 'Home',       to: '/verse-hub' },
      { label: 'Characters', to: '/verse-hub/characters' },
      //{ label: 'Transformations', to: '/verse-hub/transformations' }, // 👈 new page
    ]
  },
  /*{
    label: 'Quiz',
    icon: QuestionMarkCircleIcon,
    homeTo: '/quiz',
    links: [
      { label: 'Home', to: '/quiz' },
    ]
  },
  {
    label: 'Media',
    icon: FilmIcon,
    homeTo: '/media/comics',
    links: [
      { label: 'Comics',   to: '/media/comics' },
      { label: 'TV Shows', to: '/media/shows' },
      { label: 'Movies',   to: '/media/movies' },
    ]
  },
  {
    label: 'Music',
    icon: MusicalNoteIcon,
    homeTo: '/music/soundtracks',
    links: [
      { label: 'Soundtracks', to: '/music/soundtracks' },
      { label: 'Themes',      to: '/music/themes' },
    ]
  }*/
  {
    label: 'Dev Log',
    icon: DocumentTextIcon,
    to: '/dev-log'
  }
];

const Sidebar = ({ darkMode, setDarkMode, icon = '/img/icons/Adv3_sonic_idle.webp', iconAlt = 'SonicVerse' }) => {
  const [open, setOpen]         = useState(false);
  const { pathname }            = useLocation();
  const navigate = useNavigate();

  // ── AUTO-EXPAND based on current route ──────────────────────────────────────
  // For each dropdown section, check if the current URL starts with its
  // `routePrefix`. If yes, that section starts expanded. This means:
  //   - visiting /verse-hub or /verse-hub/characters → VerseHub opens
  //   - visiting /dev-notes → VerseHub stays closed (different prefix)
  // Users can still manually toggle sections open/closed after this initial state.
  const buildInitialExpanded = () => {
    const state = {};
    NAV_SECTIONS.forEach((section) => {
      if (section.routePrefix) {
        state[section.label] = pathname.startsWith(section.routePrefix);
      }
    });
    return state;
  };

  // useState with a function argument runs the initialiser once on mount only,
  // so navigating between tabs doesn't reset manually-toggled sections.
  const [expanded, setExpanded] = useState(buildInitialExpanded);

  const toggle = (label) =>
    setExpanded(prev => ({ ...prev, [label]: !prev[label] }));

  return (
    <>
      {/* Hamburger button */}
      <button
        className="sidebar-hamburger"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
      >
        <Bars3Icon className="sidebar-hamburger-icon" />
      </button>

      {/* Overlay */}
      <div
        className={`sidebar-overlay${open ? ' sidebar-overlay--visible' : ''}`}
        onClick={() => setOpen(false)}
      />

      {/* Drawer */}
      <aside className={`sidebar-drawer${open ? ' sidebar-drawer--open' : ''}${darkMode ? ' sidebar-dark' : ' sidebar-light'}`}>

        {/* Close button */}
        <button className="sidebar-close" onClick={() => setOpen(false)} aria-label="Close menu">
          <XMarkIcon style={{ width: '2.4rem', height: '2.4rem' }} />
        </button>

        {/* Brand — icon prop comes from Navbar, matching the current page's sprite */}
        {/* To disable per-page sprites, simply stop passing icon/iconAlt from Navbar and remove props from Sidebar.jsx */}
        <div className="sidebar-brand">
          <img src={icon} alt={iconAlt} className="sidebar-brand-icon" />
          <span className="sidebar-brand-name exo-2">SonicVerse</span>
        </div>

        {/*
        <div className="sidebar-brand">
          <img src="/img/icons/Adv3_sonic_idle.webp" alt="SonicVerse" className="sidebar-brand-icon" />
          <span className="sidebar-brand-name exo-2">SonicVerse</span>
        </div>
        */}

        {/* Nav sections */}
        <nav className="sidebar-nav">
          {NAV_SECTIONS.map(({ label, icon: Icon, links, to, homeTo }) => (
            <div key={label} className="sidebar-section">

              {to ? (
                // ── Standalone link (no dropdown) ──────────────────────────
                <button
                  className={`sidebar-section-header${pathname === to ? ' sidebar-section-header--active' : ''}`}
                  onClick={() => { navigate(to); setOpen(false); }}
                >
                  <span className="sidebar-section-left">
                    <Icon className="sidebar-section-icon" />
                    <span className="sidebar-section-label exo-2">{label}</span>
                  </span>
                </button>
              ) : (
                // ── Collapsible section (split header behavior) ─────────────
                // The header row is divided into two independent interaction zones:
                //   LEFT ZONE  → icon + label: navigates to `homeTo` and closes the sidebar
                //   RIGHT ZONE → chevron button: toggles the dropdown open/closed only
                // This lets the section name act as a direct shortcut to its home route
                // without interfering with the expand/collapse mechanic.
                <>
                  <div
                    className={`sidebar-section-header sidebar-section-header--split${
                      pathname === homeTo ? ' sidebar-section-header--active' : ''
                    }`}
                  >
                    {/* Left zone — navigates to the section's home route on click.
                        Shows an underline on hover to signal it is a link. */}
                    <button
                      className="sidebar-section-left sidebar-section-home-btn"
                      onClick={() => { navigate(homeTo); setOpen(false); }}
                      aria-label={`Go to ${label} home`}
                    >
                      <Icon className="sidebar-section-icon" />
                      <span className="sidebar-section-label exo-2">{label}</span>
                    </button>

                    {/* Right zone — chevron only; toggles dropdown independently of label */}
                    <button
                      className="sidebar-chevron-btn"
                      onClick={() => toggle(label)}
                      aria-expanded={!!expanded[label]}
                      aria-label={`${expanded[label] ? 'Collapse' : 'Expand'} ${label}`}
                    >
                      <ChevronDownIcon
                        className={`sidebar-chevron${expanded[label] ? ' sidebar-chevron--open' : ''}`}
                      />
                    </button>
                  </div>

                  <div className={`sidebar-links${expanded[label] ? ' sidebar-links--open' : ''}`}>
                    {links.map(({ label: lbl, to }) => (
                      <Link
                        key={to}
                        to={to}
                        className={`sidebar-link exo-2${pathname === to ? ' sidebar-link--active' : ''}`}
                        onClick={() => setOpen(false)}
                      >
                        {lbl}
                      </Link>
                    ))}
                  </div>
                </>
              )}

            </div>
          ))}
        </nav>

        {/* Bottom controls */}
        <div className="sidebar-bottom">
          <div className="sidebar-theme-row">
            <span className="sidebar-theme-label exo-2">
              {darkMode ? '🌙 Dark Mode' : '☀️ Light Mode'}
            </span>
            <button
              className={`sidebar-toggle-pill${darkMode ? ' sidebar-toggle-pill--on' : ''}`}
              onClick={() => setDarkMode(prev => !prev)}
              aria-label="Toggle dark mode"
            >
              <span className="sidebar-toggle-knob" />
            </button>
          </div>

          <button className="sidebar-logout exo-2">
            <ArrowRightOnRectangleIcon style={{ width: '2rem', height: '2rem' }} />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
