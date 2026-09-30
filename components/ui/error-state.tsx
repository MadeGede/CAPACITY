"use client";

import Link from "next/link";
import { AlertCircle } from "lucide-react";

export function ErrorState({ retry, scope = "this information" }: { retry: () => void; scope?: string }) {
  return <div role="alert" className="mx-auto flex min-h-[55vh] max-w-lg flex-col items-center justify-center px-5 py-16 text-center text-ink">
    <span className="grid h-12 w-12 place-items-center rounded-lg border border-red-100 bg-red-50 text-red-600"><AlertCircle size={22} aria-hidden="true" /></span>
    <h1 className="mt-5 text-2xl font-semibold">Something went wrong</h1>
    <p className="mt-3 text-sm leading-6 text-slate-500">We couldn&apos;t load {scope}. Your saved work has not been reset.</p>
    <div className="mt-7 flex flex-wrap justify-center gap-3"><button type="button" onClick={retry} className="min-h-10 rounded-md bg-ink px-5 text-xs font-semibold text-white">Try Again</button><Link href="/dashboard" className="inline-flex min-h-10 items-center rounded-md border border-line bg-white px-5 text-xs font-semibold text-slate-700">Go to Dashboard</Link></div>
  </div>;
}
