"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

export function FilterDrawer({ open, onClose, count, children }: { open: boolean; onClose: () => void; count: number; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!open) { dialog?.close(); return; }
    const previousOverflow = document.body.style.overflow;
    dialog?.showModal();
    document.body.style.overflow = "hidden";
    const desktop = window.matchMedia("(min-width: 1024px)");
    const closeOnDesktop = () => { if (desktop.matches) onClose(); };
    desktop.addEventListener("change", closeOnDesktop);
    return () => {
      document.body.style.overflow = previousOverflow;
      desktop.removeEventListener("change", closeOnDesktop);
      dialog?.close();
    };
  }, [open, onClose]);
  return (
    <dialog ref={ref} aria-labelledby="filter-drawer-title" onCancel={onClose} onClick={(event) => { if (event.target === event.currentTarget) onClose(); }} className="fixed inset-y-0 left-auto right-0 m-0 h-dvh max-h-none w-[min(90vw,380px)] max-w-none border-0 bg-white p-0 shadow-2xl backdrop:bg-slate-900/35">
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 id="filter-drawer-title" className="text-sm font-bold text-ink">Refine your search</h2>
          <button autoFocus type="button" onClick={onClose} aria-label="Close filters" className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600"><X className="h-5 w-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5">{children}</div>
        <div className="border-t border-slate-200 bg-white p-5 pb-[max(20px,env(safe-area-inset-bottom))]">
          <button type="button" onClick={onClose} className="h-12 w-full rounded-lg bg-ink text-sm font-semibold text-white hover:bg-brand-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600">Show {count} {count === 1 ? "capacity" : "capacities"}</button>
        </div>
      </div>
    </dialog>
  );
}
