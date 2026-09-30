"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ArrowUpRight, Menu, X } from "lucide-react";
import { Logo } from "./logo";
import { useDataMode } from "@/lib/data/mode";
import { useStartCompetitionDemo } from "@/components/competition/start-demo";

const navLinks = [
  { label: "Discover", href: "/discover" },
  { label: "Dashboard", href: "/dashboard" },
  { label: "How It Works", href: "/how-it-works" },
  { label: "For Providers", href: "/#providers" },
  { label: "About", href: "/#about" },
];

export function Header() {
  const startDemo = useStartCompetitionDemo();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const reduceMotion = useReducedMotion();
  const { mode, business } = useDataMode();
  const enterDemo = () => { startDemo(); setOpen(false); };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        menuButton.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b transition-all duration-300 ${
        scrolled || open
          ? "border-slate-200/80 bg-white/90 shadow-[0_10px_30px_-22px_rgba(16,29,54,.5)] backdrop-blur-xl"
          : "border-transparent bg-white/80 backdrop-blur-lg"
      }`}
    >
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
        <Logo onClick={() => setOpen(false)} />

        <nav className="hidden items-center gap-4 lg:flex xl:gap-8" aria-label="Primary navigation">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="whitespace-nowrap text-[13px] font-medium text-slate-600 transition-colors hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex xl:gap-5">
          <button type="button" onClick={enterDemo} className="min-h-10 whitespace-nowrap text-[13px] font-semibold text-brand-600 hover:text-brand-700">Explore Demo</button>
          <Link href={mode === "real" ? "/dashboard" : "/login"} className="max-w-[140px] truncate py-2 text-[13px] font-semibold text-slate-700 hover:text-ink">
            {mode === "real" ? business?.name || "Workspace" : "Sign In"}
          </Link>
          <Link
            href="/dashboard/capacity/new"
            className="brand-button inline-flex h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-lg px-4 text-[13px] font-semibold transition"
          >
            List Capacity <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <button
          ref={menuButton}
          type="button"
          className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 text-ink lg:hidden"
          onClick={() => setOpen((value) => !value)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="mobile-navigation"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <motion.nav
          id="mobile-navigation"
          initial={reduceMotion ? false : { opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="max-h-[calc(100dvh_-_72px)] overflow-y-auto overscroll-contain border-t border-slate-100 bg-white px-5 pb-6 pt-3 lg:hidden"
          aria-label="Mobile navigation"
        >
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={() => setOpen(false)}
              className="block border-b border-slate-100 py-3.5 text-sm font-medium text-slate-700"
            >
              {link.label}
            </Link>
          ))}
          <button type="button" onClick={enterDemo} className="block w-full border-b border-slate-100 py-3.5 text-left text-sm font-semibold text-brand-600">Explore Demo</button>
          <Link href={mode === "real" ? "/dashboard" : "/login"} onClick={() => setOpen(false)} className="block border-b border-slate-100 py-3.5 text-sm font-semibold text-slate-700">{mode === "real" ? "Business Workspace" : "Sign In"}</Link>
          <Link
            href="/dashboard/capacity/new"
            onClick={() => setOpen(false)}
            className="brand-button group mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg px-5 text-sm font-semibold transition-all duration-200"
          >
            List Capacity
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </motion.nav>
      )}
    </header>
  );
}
