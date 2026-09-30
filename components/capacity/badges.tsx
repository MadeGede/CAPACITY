"use client";

import { BadgeCheck, Clock3 } from "lucide-react";
import { useDataMode } from "@/lib/data/mode";

export function VerificationBadge({ verified }: { verified: boolean }) {
  const { mode } = useDataMode();
  if (!verified) return null;
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-600" title={mode === "demo" ? "Fictional demo verification status; no legal verification has been performed." : "Business information status on file. Confirm credentials directly with the provider."}>
      <BadgeCheck aria-hidden="true" className="h-3.5 w-3.5" />{mode === "demo" ? "Demo Verified" : "Business info on file"}
    </span>
  );
}

export function AvailabilityBadge({ days }: { days: number }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium ${days === 0 ? "text-emerald-700" : "text-slate-500"}`}>
      {days === 0 ? <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" /> : <Clock3 className="h-3 w-3" aria-hidden="true" />}
      {days === 0 ? "Available Now" : `Within ${days} Days`}
    </span>
  );
}
