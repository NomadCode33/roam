"use client";

import { useEffect, useState } from "react";

export default function LiveRegion({ message, politeness = "polite" }) {
  const [announced, setAnnounced] = useState("");

  useEffect(() => {
    setAnnounced("");
    const t = setTimeout(() => setAnnounced(message ?? ""), 50);
    return () => clearTimeout(t);
  }, [message]);

  return (
    <div
      role={politeness === "assertive" ? "alert" : "status"}
      aria-live={politeness}
      aria-atomic="true"
      className="sr-only"
    >
      {announced}
    </div>
  );
}