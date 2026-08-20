# Roam: Go Where Your Heart Takes You

Roam is a full-stack social discovery web app built with React, Next.js, Mapbox, PostGIS, and Claude Code that puts people at the center of tourism, prioritizing authentic local insight over algorithmic recommendations while deliberately surfacing hidden and undertrafficked spots alongside well-known landmarks to give every corner of a city a fair chance at visibility. Designed as the foundation of a larger civic platform, it serves as the social and geospatial data layer for future 3D urban visualization and infrastructure planning tools targeting civil engineers and city planners.

**Link to project:** https://roam-dusky-alpha.vercel.app

<img src="./assets/roam-logo2.png" img alt = "ROAM Logo"/>

## Development and Design
**Development Log:** https://roam-dusky-alpha.vercel.app/dev-log

**Phase 1:** https://trello.com/b/6ZvbHk51/roam-phase-1

**Figma:** [Roam Website Flowmap](https://www.figma.com/design/YZmwBodxfLgd2Nq0umAsRZ/Roam-Design--Copy-?node-id=0-1&t=GKFCZkkxWU8lP9Js-1)

## How It's Made:

**Tech used:** <a href="https://developer.mozilla.org/en-US/docs/Web/HTML" target="_blank" rel="noreferrer"> <img alt="HTML5 Badge" src="https://img.shields.io/badge/-HTML5-000000?style=flat&logo=HTML5"></a> 
<a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="_blank" rel="noreferrer"> <img alt="CSS3 Badge" src="https://img.shields.io/badge/-CSS3-000000?style=flat&logo=CSS"></a>
<a href="https://tailwindcss.com/" target="_blank" rel="noreferrer"> <img alt="Tailwind CSS Badge" src="https://img.shields.io/badge/-Tailwind CSS-000000?style=flat&logo=TailwindCSS"></a>
<a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript" target="_blank" rel="noreferrer"> <img alt="JavaScript Badge" src="https://img.shields.io/badge/-JavaScript-000000?style=flat&logo=JavaScript"></a>
<a href="https://nodejs.org/en/" target="_blank" rel="noreferrer"> <img alt="Node.js Badge" src="https://img.shields.io/badge/-Node.js-000000?style=flat&logo=Node.js"></a>
<a href="https://nextjs.org/" target="_blank" rel="noreferrer"> <img alt="Next.js Badge" src="https://img.shields.io/badge/-Next.js-000000?style=flat&logo=Next.js"></a>
<a href="https://turfjs.org/" target="_blank" rel="noreferrer"> <img alt="Turf.js Badge" src="https://img.shields.io/badge/-Turf.js-000000?style=flat&logo=None"></a>
<a href="https://react.dev/" target="_blank" rel="noreferrer"> <img alt="React Badge" src="https://img.shields.io/badge/-React-000000?style=flat&logo=React"></a>
<a href="https://expressjs.com/" target="_blank" rel="noreferrer"> <img alt="Express Badge" src="https://img.shields.io/badge/-Express-000000?style=flat&logo=Express"></a>
<a href="https://leafletjs.com/" target="_blank" rel="noreferrer"> <img alt="Leaflet Badge" src="https://img.shields.io/badge/-Leaflet-000000?style=flat&logo=Leaflet"></a>
<a href="https://supabase.com/" target="_blank" rel="noreferrer"> <img alt="Supabase Badge" src="https://img.shields.io/badge/-Supabase-000000?style=flat&logo=Supabase"></a>
<a href="https://www.ibm.com/think/topics/structured-query-language" target="_blank" rel="noreferrer"> <img alt="SQL Badge" src="https://img.shields.io/badge/-SQL-000000?style=flat&logo=None"></a>
<a href="https://postgis.net/" target="_blank" rel="noreferrer"> <img alt="PostGIS Badge" src="https://img.shields.io/badge/-PostGIS-000000?style=flat&logo=None"></a>
<a href="https://tanstack.com/query/latest" target="_blank" rel="noreferrer"> <img alt="TanStack Query Badge" src="https://img.shields.io/badge/-TanStack Query-000000?style=flat&logo=TanStack"></a>
<a href="https://www.figma.com/" target="_blank" rel="noreferrer"> <img alt="Figma Badge" src="https://img.shields.io/badge/-Figma-000000?style=flat&logo=Figma"></a>
<a href="https://trello.com/" target="_blank" rel="noreferrer"> <img alt="Trello Badge" src="https://img.shields.io/badge/-Trello-000000?style=flat&logo=Trello"></a>
<a href="https://www.mapbox.com/" target="_blank" rel="noreferrer"> <img alt="Mapbox Badge" src="https://img.shields.io/badge/-Mapbox-000000?style=flat&logo=Mapbox"></a>
<a href="https://docs.mapbox.com/mapbox-gl-js/guides/" target="_blank" rel="noreferrer"> <img alt="Mapbox GL JS Badge" src="https://img.shields.io/badge/-Mapbox GL JS-000000?style=flat&logo=Mapbox"></a>


I built Roam because I wanted a location discovery platform that actually reflects how people find places, through the people they trust, not a star rating. The goal was to build something production grade from the ground up: real RLS security, real backup and monitoring infrastructure, real rate limiting, not a portfolio piece that only works in the happy path. I intentionally treated every ticket as something that had to be independently verified with real data, not just marked done because the code compiled. If you're the type who wants to see what a fully hardened Supabase backend actually looks like, schema, security, and ops, this is that build in progress.

On the backend, I started with the core schema: 14 tables covering users, places, posts, comments, reactions, follows, saves, and blocks, all built around PostGIS geometry for spatial data. I locked every table down with Row Level Security policies before writing a single line of client code against them, public reads where they belonged, owner only writes everywhere else. Along the way I hit a bug where RLS was blocking RLS: a table's own restrictive policy was silently breaking the subqueries other tables' policies depended on, so blocked users could never actually be filtered out. I fixed it with a `SECURITY DEFINER` function that checks the block relationship without exposing the underlying row. I built out full mutual block isolation across posts, comments, follows, and saves, hide not delete, so a person's own data never gets destroyed by someone else's action. I also built automatic counter triggers so post counts and popularity scores update from real activity instead of manual seeding, and I re-verified every one of these against actual inserted data, not just a passing test message.

On the ops side, I built a real backup pipeline before I trusted the project with real data, a GitHub Actions workflow that dumps the database daily to Cloudflare R2, and I didn't call it done until I'd actually restored it into a scratch database and matched row counts against production. I caught real gaps doing that: the dump was silently schema only for a while, then leaking `auth` and `storage` tables into the backup file once I fixed it, then dropping the PostGIS extension on restore once I scoped it back down. Each one got root caused and fixed before I moved on. I did the same thing with uptime monitoring, I didn't trust the setup until I forced a real outage and watched the DOWN and recovery emails land in my inbox. Most recently I built out rate limiting with Upstash Redis, five separate sliding window limiters keyed by route so one endpoint's traffic can't eat into another's quota, wired through Next.js middleware at the root level.

On the frontend, I built the UI system first in HTML across phone, tablet portrait, and tablet landscape formats with a full light/dark token system, then moved it into Next.js and React. The landing page, privacy policy, and terms of service are live in production. Getting there wasn't clean, I hit CSS import scope bugs, a layout restructure to properly separate routes that need Nav/Footer from ones that don't, and a full JSX conversion pass on the legal pages that surfaced real bugs vanilla HTML had been hiding. Every fix got confirmed live, not just assumed.

Roam is still in active development. More infrastructure, more features, and more of the build to come.

## Lessons Learned:
**Lessons Learned:**

If there's one thing this project hammered into me, it's that a "Success" message means almost nothing on its own. I lost count of how many times a clean test result, a green checkmark, or a dump that ran without errors turned out to be hiding something. RLS policies silently blocked by their own subqueries. Backups that ran perfectly and backed up nothing but the schema. A DELETE that reported success while touching zero rows. Every time, I had to stop trusting the output and go check the actual state myself, a real `pg_policies` lookup, a real `count(*)`, actually opening the file and looking for the row data. It happened enough times across this build that it stopped being a lesson and became a reflex. Now I don't call anything done until I've gone and proven it myself.

The RLS bug was probably the one that taught me the most. I had a policy that checked another table through a subquery, and it turned out that subquery was itself bound by that other table's RLS, so the check could silently fail for the exact person it was supposed to catch, even though the policy read perfectly fine on paper. It wasn't a typo or a careless mistake, it was just how Postgres actually works under the hood, and nothing about the SQL itself gave it away. I ended up building a `SECURITY DEFINER` function to sidestep it, checking the relationship without exposing the row, and once I had it, I reused it everywhere the same pattern showed up. That one bug changed how I think about RLS entirely. It's not just "policy on, access blocked." It's a layered system, and the layers can quietly undercut each other.

The same thing was true for infrastructure. Configuring something correctly and proving it actually works are two completely different things, and I kept catching myself conflating the two. A monitor that says "Up" isn't proof the alert pipeline works, only a real forced outage and an actual email landing in my inbox is. A backup workflow that runs green in GitHub Actions isn't proof the backup is restorable, only actually restoring it into a scratch database and matching the row counts is. I made that rule explicit for myself partway through, and it's stuck with me since: configuration success and functional proof are not the same claim, and only the second one gets to close a ticket.

And then there were the quiet failures, the ones that don't throw an error, they just do the wrong thing without telling you. A `middleware.js` file sitting one folder too deep gets silently ignored by Next.js, no warning, it just never runs. One stray `.tsx` file will bootstrap an entire TypeScript toolchain into a project that was never supposed to have one. `npm audit fix --force` will cheerfully offer to downgrade a core framework by six major versions if that's what technically satisfies the dependency chain. None of these announce themselves. The real skill I picked up wasn't memorizing each individual gotcha, it was learning to assume silence isn't safety, and to go looking for the thing that didn't complain instead of waiting for it to.

## Docs & Updates
#### Updates will be shown in the dev log regarding its progress

**Development Log:** https://roam-dusky-alpha.vercel.app/dev-log

## More Projects:
Feel free to explore some of my other projects in my portfolio:

**Portfolio:** [Portfolio](https://github.com/NomadCode33/DevChronicles/tree/main/Portfolio)

**SonicVerse:** [SonicVerse](https://github.com/NomadCode33/DevChronicles/tree/main/SonicVerse)

## Repositories
**Profile:** [NomadCode33](https://github.com/NomadCode33)

**Main Repository:** [DevChronicles](https://github.com/NomadCode33/DevChronicles)



