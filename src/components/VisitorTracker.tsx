import { useEffect, useRef } from "react";
import { useLocation } from "@tanstack/react-router";

// Records one page view per navigation. Skips the dashboard itself and API paths.
export function VisitorTracker() {
  const location = useLocation();
  const lastTracked = useRef<string | null>(null);

  useEffect(() => {
    const path = location.pathname;
    if (path.startsWith("/visitors") || path.startsWith("/api")) return;
    if (lastTracked.current === path) return;
    lastTracked.current = path;

    const payload = JSON.stringify({
      path,
      referrer: document.referrer || null,
    });

    try {
      const blob = new Blob([payload], { type: "application/json" });
      const sent = navigator.sendBeacon?.("/api/public/track", blob);
      if (!sent) {
        void fetch("/api/public/track", {
          method: "POST",
          body: payload,
          headers: { "content-type": "application/json" },
          keepalive: true,
        }).catch(() => {});
      }
    } catch {
      // Tracking must never break the page.
    }
  }, [location.pathname]);

  return null;
}
