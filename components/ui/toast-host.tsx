"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, X } from "lucide-react";
import { toastEventName } from "@/lib/toast";

export function ToastHost() {
  const [message, setMessage] = useState("");
  useEffect(() => {
    const handle = (event: Event) => setMessage((event as CustomEvent<string>).detail);
    window.addEventListener(toastEventName, handle);
    return () => window.removeEventListener(toastEventName, handle);
  }, []);
  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(""), 3800);
    return () => window.clearTimeout(timer);
  }, [message]);
  return message ? <div role="status" aria-live="polite" className="fixed bottom-5 right-5 z-[110] flex max-w-[calc(100vw-2.5rem)] items-center gap-3 rounded-lg border border-blue-100 bg-white px-4 py-3 text-xs font-semibold text-ink shadow-panel"><CheckCircle2 className="h-4 w-4 shrink-0 text-brand-600" /><span>{message}</span><button type="button" onClick={() => setMessage("")} aria-label="Dismiss message" className="ml-2 grid h-7 w-7 place-items-center rounded text-slate-400 hover:bg-paper"><X size={14} /></button></div> : null;
}
