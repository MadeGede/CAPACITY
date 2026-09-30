"use client";

import type { ReactNode } from "react";
import { Check } from "lucide-react";

export const requestControl = "min-h-11 w-full rounded-md border border-slate-200 bg-white px-3.5 py-3 text-sm text-ink outline-none transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-50 disabled:bg-paper disabled:text-slate-400";

export function RequestField({ name, label, children, error, hint, optional }: { name: string; label: string; children: ReactNode; error?: string; hint?: string; optional?: boolean }) {
  return <div><label htmlFor={`request-${name}`} className="mb-2 block text-xs font-semibold text-slate-700">{label}{optional && <span className="ml-1.5 font-normal text-slate-400">Optional</span>}</label>{children}{hint && <p id={`request-${name}-hint`} className="mt-2 text-[11px] leading-5 text-slate-500">{hint}</p>}{error && <p id={`request-${name}-error`} className="mt-2 text-xs leading-5 text-red-700">{error}</p>}</div>;
}

export function RequestSection({ number, title, description, children }: { number: string; title: string; description?: string; children: ReactNode }) {
  return <section className="border-b border-line px-5 py-6 last:border-b-0 sm:px-7 sm:py-7"><div className="mb-5 flex items-start gap-3"><span className="mt-0.5 text-[10px] font-bold tracking-wider text-brand-500">{number}</span><div><h2 className="text-base font-semibold tracking-tight text-ink">{title}</h2>{description && <p className="mt-1.5 text-xs leading-6 text-slate-500">{description}</p>}</div></div><div className="space-y-5">{children}</div></section>;
}

export function RequestOptions({ label, options, selected, onToggle }: { label: string; options: string[]; selected: string[]; onToggle: (value: string) => void }) {
  return <fieldset><legend className="mb-3 text-xs font-semibold text-slate-700">{label}<span className="ml-1.5 font-normal text-slate-400">Optional</span></legend><div className="flex flex-wrap gap-2">{options.map((option) => <label key={option} className="cursor-pointer"><input className="peer sr-only" type="checkbox" checked={selected.includes(option)} onChange={() => onToggle(option)} /><span className="inline-flex min-h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-[11px] text-slate-600 peer-checked:border-brand-500 peer-checked:bg-brand-50 peer-checked:text-brand-700 peer-focus-visible:ring-2 peer-focus-visible:ring-brand-500 peer-focus-visible:ring-offset-2"><span aria-hidden="true" className={`grid h-3.5 w-3.5 place-items-center rounded-sm border ${selected.includes(option) ? "border-brand-500 bg-brand-500 text-white" : "border-slate-300"}`}>{selected.includes(option) && <Check size={10} />}</span>{option}</span></label>)}</div></fieldset>;
}
