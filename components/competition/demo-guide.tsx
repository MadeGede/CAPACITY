"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowUpRight, BookOpen } from "lucide-react";
import { WorkspacePanel } from "@/components/dashboard/workspace-panel";
import { useDataMode } from "@/lib/data/mode";
import { useDemandState } from "@/lib/data/demands";
import { useRequestState } from "@/lib/data/requests";
import { useCapacityCatalog } from "@/lib/data/capacities";
import { calculateMatchScore } from "@/lib/matching";
import { DEMO_BUYER_NAME, DEMO_PROVIDER_ID } from "@/lib/demo-identity";
import { closeCompetitionGuide, endCompetitionPresentation, exploreCompetitionStep, openCompetitionGuide, useCompetitionPresentation } from "@/lib/competition-presentation";

export function CompetitionDemoGuide() {
  const { mode } = useDataMode();
  const presentation = useCompetitionPresentation();
  const pathname = usePathname();
  const router = useRouter();
  const demand = useDemandState();
  const requests = useRequestState();
  const catalog = useCapacityCatalog();
  if (mode !== "demo" || !presentation.active) return null;
  const primary = demand.demands.find((item) => item.id === "demand-demo-cnc");
  const provider = catalog.providers.find((item) => item.id === DEMO_PROVIDER_ID);
  const current = requests.requests.find((item) => item.buyerName === DEMO_BUYER_NAME && item.providerId === DEMO_PROVIDER_ID && !["rejected", "cancelled"].includes(item.status));
  const requestHref = current ? `/requests/${current.id}` : "/requests";
  const steps = [
    { title: "Business Problem", copy: "One business needs production support. Another has idle capacity.", href: "/#about" },
    { title: "Create Demand", copy: "Open NusaTech’s CNC demand: 5,000 aluminum components.", href: "/dashboard/demands#demand-demo-cnc" },
    { title: "Smart Matching", copy: "Review the six weighted factors and Precision Works’ requirement fit.", href: "/match/results" },
    { title: "Provider Analysis", copy: "Inspect available capacity, lead time, facilities, and location.", href: `/capacity/${DEMO_PROVIDER_ID}?from=matches` },
    { title: "Request Capacity", copy: "Review the prefilled requirement and send a structured request.", href: `/request/${DEMO_PROVIDER_ID}` },
    { title: "Provider Proposal", copy: "Switch to Provider. Review, negotiate, then propose 5,000 × Rp21.500 with a 15-day lead time.", href: requestHref },
    { title: "Collaboration", copy: "Switch to Buyer. Accept the proposal, start collaboration, and review its status.", href: requestHref },
    { title: "Impact", copy: "See how existing production resources can create value for both businesses.", href: "/#impact" },
  ];
  const routeStep = pathname === "/match/results" ? 2 : pathname.startsWith("/capacity/") ? 3 : pathname.startsWith("/request/") ? 4 : pathname.startsWith("/requests/") ? requests.perspective === "provider" ? 5 : current && ["accepted", "in_progress", "completed"].includes(current.status) ? 6 : 4 : pathname === "/dashboard/collaborations" ? 6 : presentation.step;
  const navigate = (index: number) => {
    if ([1, 2, 3, 4].includes(index) && primary) {
      requests.setPerspective("buyer");
      demand.viewDemandMatches(primary.id);
      if ([3, 4].includes(index) && provider) {
        const result = calculateMatchScore(provider, primary.requirement);
        demand.selectRequest(provider.id, primary.requirement, { score: result.score, classification: result.classification, breakdown: result.breakdown, explanations: result.explanations });
      }
    }
    if (index === 5) requests.setPerspective("provider");
    if (index === 6) requests.setPerspective("buyer");
    exploreCompetitionStep(index);
    router.push(steps[index].href);
  };
  return <>
    <button type="button" onClick={openCompetitionGuide} aria-haspopup="dialog" className="fixed bottom-20 right-4 z-30 inline-flex min-h-11 items-center gap-2 rounded-lg border border-blue-200 bg-white px-4 text-xs font-semibold text-brand-700 shadow-soft sm:right-6"><BookOpen className="h-4 w-4" aria-hidden="true" />CAPACITY Demo<span className="border-l border-slate-200 pl-2 text-[10px] font-medium text-slate-500">{routeStep + 1} / 8</span></button>
    <WorkspacePanel open={presentation.open} title="CAPACITY Demo" onClose={closeCompetitionGuide}>
      <p className="text-xs leading-6 text-slate-500">An eight-stop guide to the working product, not a slideshow. Explore freely; steps do not execute business actions for you.</p>
      <p className="mt-2 text-[11px] text-slate-500">Illustrative data · no login · no external messages or payments</p>
      <ol aria-label="Competition demo steps" className="mt-5 divide-y divide-slate-100">{steps.map((step, index) => <li key={step.title}><button type="button" disabled={!demand.ready || !requests.ready || !catalog.ready} onClick={() => navigate(index)} aria-current={index === routeStep ? "step" : undefined} className={`flex min-h-14 w-full items-start gap-3 rounded px-2 py-3 text-left transition hover:bg-slate-50 disabled:opacity-50 ${index === routeStep ? "bg-blue-50/60" : ""}`}><span className="mt-0.5 text-[10px] font-bold tabular-nums text-brand-600">{String(index + 1).padStart(2, "0")}</span><span className="min-w-0 flex-1"><strong className="block text-xs text-ink">{step.title}</strong><span className="mt-1 block text-[11px] leading-5 text-slate-500">{step.copy}</span></span><ArrowUpRight className="mt-1 h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" /></button></li>)}</ol>
      {!primary && <p role="status" className="mt-3 text-xs leading-6 text-slate-500">The seeded CNC demand is unavailable. Use Reset Demo in the dashboard to restore the example.</p>}
      <div className="mt-5 flex flex-wrap gap-x-4 gap-y-3 border-t border-line pt-5 text-[11px] font-semibold text-brand-600"><Link href="/dashboard/buyer" onClick={() => { requests.setPerspective("buyer"); closeCompetitionGuide(); }}>Buyer Dashboard</Link><Link href="/dashboard/provider" onClick={() => { requests.setPerspective("provider"); closeCompetitionGuide(); }}>Provider Dashboard</Link><Link href="/dashboard/capacity" onClick={() => { requests.setPerspective("provider"); closeCompetitionGuide(); }}>Capacity Management</Link><Link href="/dashboard/collaborations" onClick={() => { requests.setPerspective("buyer"); closeCompetitionGuide(); }}>Collaborations</Link><Link href="/how-it-works#architecture" onClick={closeCompetitionGuide}>How it works & architecture</Link></div>
      <button type="button" onClick={endCompetitionPresentation} className="mt-5 min-h-9 text-xs font-medium text-slate-500 hover:underline">Hide guide and explanations</button>
    </WorkspacePanel>
  </>;
}
