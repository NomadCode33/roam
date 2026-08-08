import { IconMapPin, IconRoute, IconFlame } from "@tabler/icons-react";

// page.js is the root page. The route is '/'
export default function Home() {
  return (
    <div className="home-page">
      <section className="hero">
        <div>
          <div className="hero-tag">Discover your city</div>
          <h1 className="hero-h">Find the places<br />locals actually love</h1>
          <p className="hero-sub">A community map where real people share hidden gems, local favorites, and walking trails — not tourist traps.</p>
          <div className="hero-actions">
            <button className="btn-primary">Sign up free</button>
            <button className="btn-secondary">Log in</button>
          </div>
        </div>
        <div className="map-mock">
          <div className="map-grid"></div>
          <div className="pulse"></div>
          <div className="pin" style={{ background: "#E8C547", top: "35%", left: "45%" }}></div>
          <div className="pin" style={{ background: "#AFA9EC", top: "55%", left: "62%" }}></div>
          <div className="pin" style={{ background: "#EDE8FF", opacity: 0.6, top: "28%", left: "70%" }}></div>
          <div className="pin" style={{ background: "#E8C547", opacity: 0.4, top: "65%", left: "30%" }}></div>
          <div className="feed-card">
            <div className="feed-card-name">Benny K. · Pike Place side alley</div>
            <div className="feed-card-sub">3 people saved this · 12 min ago</div>
          </div>
        </div>
      </section>

      <section className="features">
        <div className="feat">
          <div className="feat-icon"><IconMapPin size={20} stroke={2} color="#E8C547" /></div>
          <div className="feat-title">Community pins</div>
          <div className="feat-desc">
            Drop a pin anywhere, add photos and a vibe tag. Your spot joins the living map.
          </div>
        </div>

        <div className="feat">
          <div className="feat-icon"><IconRoute size={20} stroke={2} color="#E8C547" /></div>
          <div className="feat-title">Walking trails</div>
          <div className="feat-desc">
            Share multi-stop routes — coffee crawls, sunset walks, taco runs — with up to 5 locations.
          </div>
        </div>

        <div className="feat">
          <div className="feat-icon"><IconFlame size={20} stroke={2} color="#E8C547" /></div>
          <div className="feat-title">Live heatmap</div>
          <div className="feat-desc">
            See what's trending in your neighborhood right now, filtered by vibe.
          </div>
        </div>
      </section>

      <section className="mission">
        <div className="mission-h">Built for people who actually know their city</div>
        <p className="mission-sub">
          Roam exists because the best places don't show up on tourist lists.
          They live in the minds of locals — and now they live on the map.
        </p>
        <button className="mission-cta">Join the map</button>
      </section>
    </div>
  );
}





/*import Image from "next/image";
import PostCard from "../components/PostCard"

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={100}
          height={20}
          priority
        />
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            To get started, edit the page.js file.
          </h1>
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Looking for a starting point or more instructions? Head over to{" "}
            <a
              href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              className="font-medium text-zinc-950 dark:text-zinc-50"
            >
              Templates
            </a>{" "}
            or the{" "}
            <a
              href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              className="font-medium text-zinc-950 dark:text-zinc-50"
            >
              Learning
            </a>{" "}
            center.
          </p>
        </div>
        <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
          <a
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-[158px]"
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              className="dark:invert"
              src="/vercel.svg"
              alt="Vercel logomark"
              width={16}
              height={16}
            />
            Deploy Now
          </a>
          <a
            className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]"
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            Documentation
          </a>
        </div>
      </main>

      <PostCard post={{ content: "Testing Roam" }} />
    </div>
  );
}
*/