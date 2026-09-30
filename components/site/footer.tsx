import Link from "next/link";
import { Logo } from "./logo";
import { StartDemandLink } from "@/components/matching/start-demand-link";
import { StartCompetitionDemo } from "@/components/competition/start-demo";

const destinations: Record<string, string> = {
  Discover: "/discover",
  Requests: "/requests",
  Dashboard: "/dashboard",
  "How It Works": "/how-it-works",
  "List Capacity": "/dashboard/capacity/new",
  "Create Demand": "/match",
  About: "/#about",
  "For Providers": "/#providers",
};

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-[#101d36] text-slate-200">
      <div className="dark-grid pointer-events-none absolute inset-0 opacity-70" aria-hidden="true" />
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="relative grid gap-10 border-b border-white/10 py-16 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <Logo light />
            <p className="mt-5 max-w-xs text-sm leading-7 text-slate-300">Digital infrastructure connecting businesses that need production capacity with businesses that have it available.</p>
            <span className="mt-6 inline-block border-l-2 border-blue-400 pl-3 text-[10px] font-semibold uppercase tracking-[.17em] text-blue-200">Capacity meets opportunity</span>
            <div><StartCompetitionDemo className="mt-6 border border-white/20 !bg-white/10 !text-white hover:!bg-white/20" /></div>
          </div>
          <FooterColumn title="Platform" links={["Discover", "Requests", "How It Works", "List Capacity", "Create Demand"]} />
          <FooterColumn title="Workspace" links={["Dashboard", "Requests", "Create Demand"]} />
          <FooterColumn title="Resources" links={["About", "For Providers", "How It Works"]} />
        </div>
        <div className="relative flex flex-col gap-2 py-6 text-[11px] text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 CAPACITY. All rights reserved.</span>
          <span>Turn idle capacity into business opportunities.</span>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: string[] }) {
  return (
    <div>
      <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-white">{title}</h3>
      <ul className="mt-4 space-y-3">
        {links.map((link) => <li key={link}>{link === "Create Demand" ? <StartDemandLink className="text-sm text-slate-300 transition hover:text-white">{link}</StartDemandLink> : <Link href={destinations[link] ?? "/#top"} className="text-sm text-slate-300 transition hover:text-white">{link}</Link>}</li>)}
      </ul>
    </div>
  );
}
