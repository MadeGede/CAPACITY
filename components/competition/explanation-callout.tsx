"use client";

import { X } from "lucide-react";
import type { ReactNode } from "react";
import { useDataMode } from "@/lib/data/mode";
import { dismissCompetitionCallout, useCompetitionPresentation } from "@/lib/competition-presentation";

export function DemoExplanationCallout({ id, children }: { id: string; children: ReactNode }) {
  const { mode } = useDataMode();
  const presentation = useCompetitionPresentation();
  if (mode !== "demo" || !presentation.active || presentation.dismissed.includes(id)) return null;
  return <aside aria-label="Competition demo explanation" className="my-5 flex items-start gap-3 rounded-md border border-blue-100 bg-blue-50/60 px-4 py-3 text-xs leading-6 text-slate-600"><div className="min-w-0 flex-1"><span className="mr-2 font-semibold text-brand-700">Inside CAPACITY</span>{children}</div><button type="button" onClick={() => dismissCompetitionCallout(id)} aria-label="Dismiss demo explanation" className="grid h-8 w-8 shrink-0 place-items-center rounded text-slate-500 hover:bg-blue-100"><X className="h-3.5 w-3.5" aria-hidden="true" /></button></aside>;
}
