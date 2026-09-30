"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function BackToDiscover() {
  const [href, setHref] = useState("/discover");
  const [fromMatches, setFromMatches] = useState(false);
  useEffect(() => {
    queueMicrotask(() => {
      if (new URLSearchParams(window.location.search).get("from") === "matches") {
        setHref("/match/results");
        setFromMatches(true);
        return;
      }
      try {
        const previous = sessionStorage.getItem("capacity-discovery-url");
        if (previous === "/discover" || previous?.startsWith("/discover?")) setHref(previous);
      } catch { /* The unfiltered directory is always available. */ }
    });
  }, []);
  return (
    <Link href={href} className="inline-flex min-h-10 items-center gap-2 rounded text-xs font-medium text-slate-500 transition hover:text-brand-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600">
      <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> {fromMatches ? "Back to matches" : "Back to discover"}
    </Link>
  );
}
