"use client";

import { Bookmark } from "lucide-react";
import { useRef, useState } from "react";
import { useSavedProviders } from "@/lib/data/saved-providers";
import { useDataMode } from "@/lib/data/mode";
import { useRouter } from "next/navigation";
import { showToast } from "@/lib/toast";

export function SaveProvider({ id, name, label = "Save", className = "" }: {
  id: string; name: string; label?: string; className?: string;
}) {
  const { ids, toggle } = useSavedProviders();
  const { mode, user } = useDataMode();
  const router = useRouter();
  const saved = ids.includes(id);
  const saving = useRef(false);
  const [pending, setPending] = useState(false);
  return (
    <button
      type="button"
      aria-label={`${saved ? "Unsave" : "Save"} ${name}`}
      aria-pressed={saved}
      disabled={pending}
      onClick={async () => {
        if (saving.current) return;
        if (mode === "real" && !user) { router.push("/login"); return; }
        saving.current = true;
        try {
          const operation = toggle(id);
          if (operation instanceof Promise) {
            setPending(true); await operation;
            showToast(saved ? "Provider removed from saved" : "Provider saved");
          }
          // The synchronous demo store already supplies its own success feedback.
        } catch { showToast("Unable to update saved providers. Please try again."); }
        finally { saving.current = false; setPending(false); }
      }}
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border px-3 text-xs font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 ${saved ? "border-blue-200 bg-blue-50 text-brand-600 hover:bg-blue-100" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-ink"} ${className}`}
    >
      <Bookmark className={`h-3.5 w-3.5 ${saved ? "fill-current" : ""}`} aria-hidden="true" />
      {saved ? "Saved" : label}
    </button>
  );
}
