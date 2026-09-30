import Link from "next/link";

export function LogoMark({ className = "h-9 w-9" }: { className?: string }) {
  return <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true" focusable="false">
    <rect width="48" height="48" rx="10" fill="#1D4ED8" />
    <path d="M32 10H20c-6 0-10 4-10 10v8c0 6 4 10 10 10h12v-6H20c-2.5 0-4-1.5-4-4v-8c0-2.5 1.5-4 4-4h12v-6Z" fill="white" />
    <path d="M29 21h9v6h-9" fill="#91D9FF" />
    <rect x="34" y="10" width="5" height="6" rx="1" fill="#91D9FF" />
    <rect x="34" y="32" width="5" height="6" rx="1" fill="#91D9FF" />
  </svg>;
}

export function LogoWordmark({ light = false }: { light?: boolean }) {
  return <span className={`text-[15px] font-extrabold tracking-[0.145em] ${light ? "text-white" : "text-ink"}`}>CAPACITY</span>;
}

export function FullLogo({ light = false, onClick }: { light?: boolean; onClick?: () => void }) {
  return <Link href="/#top" onClick={onClick} className="group inline-flex items-center gap-2.5 rounded" aria-label="CAPACITY home">
    <LogoMark className="h-9 w-9 shrink-0 transition-transform duration-200 group-hover:scale-[1.04]" />
    <LogoWordmark light={light} />
  </Link>;
}

// Keep the existing public name so every brand placement shares the new mark.
export const Logo = FullLogo;
