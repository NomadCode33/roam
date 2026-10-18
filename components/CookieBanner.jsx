"use client";

import { useState, useEffect, useRef } from "react";
import Link from 'next/link';
import { CONSENT_COOKIE, parseConsent, hasConsentDecision } from "../lib/consent";
import "../css/cookieBanner.css";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const bannerRef = useRef(null);

  useEffect(() => {
    const match = document.cookie
      .split("; ")
      .find((row) => row.startsWith(`${CONSENT_COOKIE}=`));
    const rawValue = match ? match.split("=")[1] : null;
    const decision = parseConsent(rawValue);

    if (!hasConsentDecision(decision)) {
      setVisible(true);
    }
  }, []);

  useEffect(() => {
    const el = bannerRef.current;
    if (!visible || !el) return;
    const root = document.documentElement;
    const update = () =>
      root.style.setProperty("--cookie-banner-h", `${el.offsetHeight}px`);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => {
      observer.disconnect();
      root.style.removeProperty("--cookie-banner-h");
    };
  }, [visible]);

  function setConsentCookie(value) {
    const oneYear = 60 * 60 * 24 * 365;
    document.cookie = `${CONSENT_COOKIE}=${value}; path=/; max-age=${oneYear}; SameSite=Lax`;
  }

  function handleAccept() {
    setConsentCookie("accepted");
    // PostHog init call goes here once ROA-0XX installs the package.
    // Intentionally left as a marker, not a silent no-op — see note below.
    setVisible(false);
  }

  function handleDecline() {
    setConsentCookie("declined");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <section ref={bannerRef} className="roam-cookie-banner" aria-label="Cookie consent">
      <p className="roam-cookie-banner__text">
        We use cookies to understand how people use Roam. Read our{" "}
        <Link href="/privacy" className="roam-cookie-banner__link">
          Privacy Policy
        </Link>{" "}
        to learn more.
      </p>
      <div className="roam-cookie-banner__actions">
        <button
          type="button"
          className="roam-cookie-banner__btn roam-cookie-banner__btn--decline"
          onClick={handleDecline}
        >
          Decline
        </button>
        <button
          type="button"
          className="roam-cookie-banner__btn roam-cookie-banner__btn--accept"
          onClick={handleAccept}
        >
          Accept
        </button>
      </div>
    </section>
  );
}