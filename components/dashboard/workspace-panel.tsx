"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

export function WorkspacePanel({ open, title, onClose, children, drawer = false }: { open: boolean; title: string; onClose: () => void; children: ReactNode; drawer?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog || !open) return;
    const overflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    return () => { dialog.close(); document.body.style.overflow = overflow; };
  }, [open]);
  return <dialog ref={ref} aria-labelledby={titleId} onCancel={onClose} onClick={(event) => { if (event.target === event.currentTarget) onClose(); }} className={`${drawer ? "fixed inset-y-0 left-0 right-auto m-0 h-dvh max-h-none w-[min(88vw,310px)]" : "m-auto max-h-[85dvh] w-[calc(100%_-_2rem)] max-w-xl rounded-xl"} overflow-y-auto overscroll-contain border border-slate-200 bg-white p-0 text-ink shadow-panel backdrop:bg-slate-900/30`}><div className="flex items-center justify-between border-b border-slate-200 px-5 py-4"><h2 id={titleId} className="text-sm font-bold">{title}</h2><button type="button" onClick={onClose} aria-label={`Close ${title.toLowerCase()}`} className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600"><X className="h-4 w-4" /></button></div><div className="p-5">{children}</div></dialog>;
}
