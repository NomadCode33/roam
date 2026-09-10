"use client";

import { useState, useEffect } from "react";
import { CONSENT_COOKIE, parseConsent, hasConsentDecision } from "@/lib/consent";
import "@/css/CookieBanner.css";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

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
    <div className="roam-cookie-banner">
      <p className="roam-cookie-banner__text">
        We use cookies to understand how people use Roam. Read our{" "}
        <a href="/privacy" className="roam-cookie-banner__link">
          Privacy Policy
        </a>{" "}
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
    </div>
  );
}