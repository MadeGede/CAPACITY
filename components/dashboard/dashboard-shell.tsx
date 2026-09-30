"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowUpRight, Bell, Bookmark, Boxes, Building2, ChevronRight, ClipboardList, Factory, Handshake, LayoutDashboard, Menu, Search, Settings, SlidersHorizontal, TrendingUp } from "lucide-react";
import { Logo } from "@/components/site/logo";
import { useCapacityCatalog } from "@/lib/data/capacities";
import { useDemandState } from "@/lib/data/demands";
import { useRequestState } from "@/lib/data/requests";
import { useReadNotifications } from "@/lib/data/notifications";
import { useDataMode } from "@/lib/data/mode";
import { useRealWorkspace } from "@/lib/data/real-workspace";
import { requestsForPerspective, workspaceActivity } from "@/lib/dashboard";
import { DEMO_BUYER_NAME } from "@/lib/demo-identity";
import { requestDate } from "@/lib/request-format";
import { resetDemoData } from "@/lib/demo-reset";
import { beginCompetitionPresentation, endCompetitionPresentation, openCompetitionGuide, useCompetitionPresentation } from "@/lib/competition-presentation";
import { showToast } from "@/lib/toast";
import { WorkspacePanel } from "./workspace-panel";

type Panel = "navigation" | "notifications" | "settings" | "reset" | "search" | null;
const titles: Record<string, string> = { "/dashboard": "Overview", "/dashboard/buyer": "Buyer Overview", "/dashboard/provider": "Provider Overview", "/dashboard/demands": "My Demands", "/dashboard/capacity": "My Capacity", "/dashboard/capacity/new": "List Capacity", "/dashboard/collaborations": "Collaborations", "/dashboard/saved": "Saved Providers" };

export function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { ready, perspective, setPerspective, requests, sessionOnly } = useRequestState();
  const { providers, managedListings } = useCapacityCatalog();
  const { demands, viewDemandMatches } = useDemandState();
  const { readIds, markRead } = useReadNotifications();
  const { mode, business, name, signOut, chooseMode, configured } = useDataMode();
  const real = useRealWorkspace();
  const presentation = useCompetitionPresentation();
  const [panel, setPanel] = useState<Panel>(null);
  const [query, setQuery] = useState("");
  const closePanel = useCallback(() => setPanel(null), []);
  useEffect(() => {
    queueMicrotask(() => {
      if (pathname === "/dashboard/buyer") setPerspective("buyer");
      if (pathname === "/dashboard/provider") setPerspective("provider");
      if (pathname.startsWith("/dashboard/capacity")) setPerspective("provider");
      if (pathname === "/dashboard/demands" || pathname === "/dashboard/saved") setPerspective("buyer");
      setPanel(null);
    });
  }, [pathname, setPerspective]);
  const relevantRequests = useMemo(() => requestsForPerspective(requests, perspective, providers, mode === "real" ? business?.id : undefined), [requests, perspective, providers, mode, business?.id]);
  const activity = useMemo(() => {
    const items = workspaceActivity(relevantRequests, demands, perspective, providers);
    if (perspective === "provider") for (const listing of managedListings) items.push({ id: `listing-${listing.id}-${listing.updatedAt}`, title: listing.availableCapacity <= listing.maximumCapacity * 0.15 ? "Listed capacity is almost fully booked" : "Capacity listing updated", detail: listing.capability, date: listing.updatedAt, href: `/dashboard/capacity/${listing.id}/edit` });
    return items.sort((a, b) => Date.parse(b.date) - Date.parse(a.date)).slice(0, 30);
  }, [relevantRequests, demands, perspective, providers, managedListings]);
  const unread = mode === "real" ? real.notifications.filter((item) => !item.is_read).length : activity.filter((item) => !readIds.includes(item.id)).length;
  const businessName = mode === "real" ? business?.name || "Business workspace" : perspective === "provider" ? "Precision Works" : DEMO_BUYER_NAME;
  const navigation = [
    { label: "Overview", href: `/dashboard/${perspective}`, icon: LayoutDashboard },
    ...(perspective === "buyer" ? [
      { label: "My Demands", href: "/dashboard/demands", icon: ClipboardList },
      { label: "Matches", href: "/match/results", icon: SlidersHorizontal },
      { label: "Requests", href: "/requests", icon: Boxes },
      { label: "Collaborations", href: "/dashboard/collaborations", icon: Handshake },
      { label: "Saved Providers", href: "/dashboard/saved", icon: Bookmark },
    ] : [
      { label: "My Capacity", href: "/dashboard/capacity", icon: Factory },
      { label: "Incoming Requests", href: "/requests", icon: ClipboardList },
      { label: "Collaborations", href: "/dashboard/collaborations", icon: Handshake },
      { label: "Provider Performance", href: "/dashboard/provider#performance", icon: TrendingUp },
    ]),
  ];
  const queryText = query.trim().toLocaleLowerCase();
  const foundProviders = queryText ? providers.filter((provider) => `${provider.name} ${provider.capability} ${provider.location}`.toLocaleLowerCase().includes(queryText)).slice(0, 5) : [];
  const foundRequests = queryText ? relevantRequests.filter((request) => `${request.id} ${request.capability} ${providers.find((provider) => provider.id === request.providerId)?.name}`.toLocaleLowerCase().includes(queryText)).slice(0, 5) : [];
  const foundDemands = queryText && perspective === "buyer" ? demands.filter((demand) => `${demand.name} ${demand.requirement.category} ${demand.requirement.capability}`.toLocaleLowerCase().includes(queryText)).slice(0, 5) : [];
  const navContent = <><nav aria-label="Workspace navigation" className="space-y-1">{navigation.map(({ label, href, icon: Icon }) => {
    const active = href === pathname || (label === "Overview" && pathname === "/dashboard") || (label === "My Capacity" && pathname.startsWith("/dashboard/capacity/"));
    return <Link key={label} href={href} onClick={closePanel} aria-current={active ? "page" : undefined} className={`flex min-h-10 items-center gap-3 rounded-lg px-3 text-xs font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600 ${active ? "border-l-2 border-brand-500 bg-blue-50 font-semibold text-brand-700" : "border-l-2 border-transparent text-slate-500 hover:bg-slate-50 hover:text-ink"}`}><Icon className="h-4 w-4" aria-hidden="true" />{label}</Link>;
  })}</nav><div className="mt-7 border-t border-slate-200 pt-5"><p className="mb-3 px-3 text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400">Workspace</p><Link href="/discover" className="flex min-h-10 items-center gap-3 rounded-lg px-3 text-xs font-medium text-slate-500 hover:bg-slate-50"><Search className="h-4 w-4" aria-hidden="true" />Discover Capacity<ArrowUpRight className="ml-auto h-3 w-3" aria-hidden="true" /></Link><button type="button" onClick={() => setPanel("notifications")} className="flex min-h-10 w-full items-center gap-3 rounded-lg px-3 text-xs font-medium text-slate-500 hover:bg-slate-50"><Bell className="h-4 w-4" aria-hidden="true" />Notifications{unread > 0 && <span className="ml-auto rounded bg-slate-100 px-1.5 py-0.5 text-[10px]">{unread}</span>}</button><button type="button" onClick={() => setPanel("settings")} className="flex min-h-10 w-full items-center gap-3 rounded-lg px-3 text-xs font-medium text-slate-500 hover:bg-slate-50"><Settings className="h-4 w-4" aria-hidden="true" />Settings</button></div></>;

  return (
    <div className="min-h-dvh bg-paper text-ink">
      <a href="#dashboard-content" className="sr-only z-[100] rounded bg-white p-3 text-sm focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Skip to content</a>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[232px] flex-col border-r border-slate-200 bg-white px-4 py-7 shadow-[12px_0_35px_-35px_rgba(16,29,54,.5)] lg:flex"><div className="mb-8 border-b border-slate-100 px-3 pb-7"><Logo /><p className="mt-3 text-[9px] font-bold uppercase tracking-[.14em] text-slate-400">Business infrastructure</p></div>{navContent}<div className="mt-auto border-t border-slate-200 px-3 pt-5"><p className="text-[10px] font-semibold text-slate-500">{mode === "real" ? "Real business workspace" : "Local demo workspace"}</p><p className="mt-1 text-[10px] leading-5 text-slate-400">Business capacity, connected.</p></div></aside>
      <div className="lg:pl-[232px]">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur-xl">
          <div className="flex min-h-[76px] items-center gap-3 px-5 sm:px-7 xl:px-9">
            <button type="button" onClick={() => setPanel("navigation")} aria-label="Open workspace navigation" aria-haspopup="dialog" className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-600 lg:hidden"><Menu className="h-4 w-4" /></button>
            <p className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-700">{titles[pathname] ?? (pathname.endsWith("/edit") ? "Edit Capacity" : "Workspace")}</p>
            <form role="search" onSubmit={(event) => { event.preventDefault(); setPanel("search"); }} className="hidden h-9 w-[180px] items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 xl:flex"><input aria-label="Search workspace" placeholder="Search workspace…" value={query} onChange={(event) => setQuery(event.target.value)} className="min-w-0 flex-1 bg-transparent text-xs outline-none" /><button type="submit" aria-label="Search workspace records"><Search className="h-3.5 w-3.5 text-slate-400" /></button></form>
            <button type="button" onClick={() => setPanel("search")} aria-label="Search workspace" className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-50 xl:hidden"><Search className="h-4 w-4" /></button>
            <button type="button" onClick={() => setPanel("notifications")} aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`} aria-haspopup="dialog" className="relative grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-500 hover:bg-slate-50"><Bell className="h-4 w-4" />{unread > 0 && <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-brand-500" />}</button>
            <label className="flex items-center gap-2 text-[10px] text-slate-500"><span className="hidden sm:inline">Operating as {businessName}</span><select aria-label="Dashboard perspective" disabled={!ready} value={perspective} onChange={(event) => { const role = event.target.value === "provider" ? "provider" : "buyer"; setPerspective(role); router.push(`/dashboard/${role}`); }} className="h-9 rounded-lg border border-blue-200 bg-blue-50 px-2 text-xs font-bold uppercase tracking-wide text-brand-700"><option value="buyer">Buyer</option><option value="provider">Provider</option></select></label>
            <button type="button" onClick={() => setPanel("settings")} aria-label="Account and workspace settings" className="hidden items-center gap-2.5 border-l border-slate-200 pl-4 text-left md:flex"><span className="grid h-8 w-8 place-items-center rounded-lg bg-ink text-[10px] font-bold text-white">{mode === "real" ? businessName.slice(0,2).toUpperCase() : perspective === "buyer" ? "NI" : "PW"}</span><span className="hidden 2xl:block"><span className="block text-[11px] font-semibold">{businessName}</span><span className="mt-0.5 block text-[10px] text-slate-400">{mode === "real" ? name : `${perspective} workspace`}</span></span></button>
          </div>
        </header>
        {mode === "demo" && <div className="flex flex-wrap items-center justify-between gap-2 border-b border-blue-100 bg-blue-50/70 px-5 py-2 text-[11px] sm:px-7 xl:px-9"><span className="font-semibold text-brand-700">Competition Demo <span className="font-normal text-slate-500">· Illustrative data</span></span><div className="flex flex-wrap gap-4"><button type="button" onClick={openCompetitionGuide} aria-haspopup="dialog" className="min-h-8 font-semibold text-brand-700 hover:underline">Demo Guide</button><button type="button" onClick={() => setPanel("reset")} className="min-h-8 font-semibold text-brand-700 hover:underline">Reset Demo</button><button type="button" onClick={() => { endCompetitionPresentation(); chooseMode(configured ? "real" : "demo"); router.push("/"); }} className="min-h-8 font-semibold text-slate-600 hover:underline">Exit Demo</button></div></div>}
        <main id="dashboard-content" className="mx-auto max-w-[1440px] px-5 py-7 sm:px-7 sm:py-9 xl:px-9">{sessionOnly && <p role="status" className="mb-5 rounded-lg border border-amber-100 bg-amber-50 px-4 py-3 text-xs text-slate-600">Browser storage is unavailable. Workspace changes are kept for this visit only.</p>}{mode === "real" && real.error ? <div role="alert" className="rounded-lg border border-red-100 bg-white p-8 text-center"><h1 className="text-lg font-semibold">Unable to load your workspace.</h1><p className="mt-2 text-sm text-slate-500">Your account data is not available right now. No demo data has been substituted.</p><button type="button" onClick={() => void real.refresh()} className="mt-5 min-h-10 rounded-md bg-ink px-5 text-xs font-semibold text-white">Try Again</button></div> : children}</main>
        <footer className="flex flex-wrap items-center justify-between gap-3 px-5 pb-6 text-[10px] text-slate-400 sm:px-7 xl:px-9"><span>{mode === "real" ? "CAPACITY business workspace" : "Demo workspace · no external messages sent"}</span><div className="flex gap-4"><Link href="/#impact" className="min-h-8 py-2 hover:text-brand-600">Capacity Impact</Link><Link href="/how-it-works#architecture" className="min-h-8 py-2 hover:text-brand-600">How it works & architecture</Link></div></footer>
      </div>
      <WorkspacePanel open={panel === "navigation"} title="Workspace navigation" onClose={closePanel} drawer><div className="mb-6"><Logo /></div>{navContent}</WorkspacePanel>
      <WorkspacePanel open={panel === "notifications"} title="Notifications" onClose={closePanel}>
        {mode === "real" ? <div><div className="mb-4 flex justify-between gap-3"><p className="text-xs text-slate-500">Updates for {businessName}</p><button type="button" disabled={!unread} onClick={() => void real.markRead(real.notifications.map((item) => item.id))} className="text-[11px] font-semibold text-brand-600 disabled:text-slate-400">Mark all read</button></div>{real.notifications.length ? <ul className="divide-y divide-slate-100">{real.notifications.map((item) => <li key={item.id}><Link href={item.link || "/dashboard"} onClick={() => { void real.markRead([item.id]); closePanel(); }} className="flex gap-3 py-3"><span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${item.is_read ? "bg-slate-200" : "bg-brand-500"}`} /><span><strong className="block text-xs text-slate-700">{item.title}</strong><span className="mt-1 block text-[11px] text-slate-500">{item.description}</span><time dateTime={item.created_at} className="mt-1 block text-[10px] text-slate-400">{requestDate(item.created_at, true)}</time></span></Link></li>)}</ul> : <p className="py-8 text-center text-sm text-slate-500">No notifications yet.</p>}</div> : <>
        <div className="mb-4 flex items-center justify-between gap-3"><p className="text-xs text-slate-500">Updates from your workspace</p><button type="button" onClick={() => markRead(activity.map((item) => item.id))} disabled={!unread} className="text-[11px] font-semibold text-brand-600 disabled:text-slate-400">Mark all read</button></div>
        {activity.length ? <ul className="divide-y divide-slate-100">{activity.map((item) => <li key={item.id}><Link href={item.href} onClick={() => { markRead([item.id]); closePanel(); }} className="flex gap-3 rounded py-3 hover:bg-slate-50"><span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${readIds.includes(item.id) ? "bg-slate-200" : "bg-brand-500"}`} /><div className="min-w-0"><p className="text-xs font-semibold text-slate-700">{item.title}</p><p className="mt-1 text-[11px] leading-5 text-slate-500">{item.detail}</p><time dateTime={item.date} className="mt-1 block text-[10px] text-slate-400">{requestDate(item.date, true)}</time></div></Link></li>)}</ul> : <p className="py-8 text-center text-sm text-slate-500">No activity yet. New workspace updates will appear here.</p>}
        </>}
      </WorkspacePanel>
      <WorkspacePanel open={panel === "settings"} title="Workspace settings" onClose={closePanel}>
        {mode === "real" ? <div><div className="mb-5 flex items-center gap-3"><Building2 className="h-5 w-5 text-slate-400" /><div><h3 className="text-sm font-bold">{businessName}</h3><p className="mt-1 text-xs text-slate-500">{business?.city || "Indonesia"}</p></div></div><dl className="divide-y divide-slate-100 text-xs"><div className="flex justify-between gap-4 py-3"><dt className="text-slate-500">Signed in as</dt><dd className="text-right font-medium">{name}</dd></div><div className="flex justify-between gap-4 py-3"><dt className="text-slate-500">Business type</dt><dd className="text-right font-medium">{business?.type || "Business"}</dd></div><div className="flex justify-between gap-4 py-3"><dt className="text-slate-500">Data storage</dt><dd className="font-medium">Supabase</dd></div></dl><button type="button" onClick={async () => { try { await signOut(); closePanel(); router.push("/login"); router.refresh(); } catch { showToast("Unable to sign out. Please try again."); } }} className="mt-6 min-h-10 w-full rounded-md border border-slate-200 px-4 text-xs font-semibold text-slate-700 hover:bg-slate-50">Sign Out</button></div> : <>
        <div className="mb-5 flex items-center gap-3"><Building2 className="h-5 w-5 text-slate-400" /><div><h3 className="text-sm font-bold">{businessName}</h3><p className="mt-1 text-xs text-slate-500">{perspective === "buyer" ? "Jakarta" : "Bekasi"}, Indonesia</p></div></div>
        <dl className="divide-y divide-slate-100 text-xs"><div className="flex justify-between gap-4 py-3"><dt className="text-slate-500">Business type</dt><dd className="text-right font-medium">{perspective === "buyer" ? "Industrial Components" : "Precision Manufacturing"}</dd></div><div className="flex justify-between gap-4 py-3"><dt className="text-slate-500">Perspective</dt><dd className="font-medium capitalize">{perspective}</dd></div><div className="flex justify-between gap-4 py-3"><dt className="text-slate-500">Currency</dt><dd className="font-medium">Indonesian Rupiah (IDR)</dd></div><div className="flex justify-between gap-4 py-3"><dt className="text-slate-500">Data storage</dt><dd className="font-medium">This browser</dd></div></dl><p className="mt-5 text-[11px] leading-6 text-slate-500">Demo Mode uses fixed business profiles. Switch perspective in the header to explore both workflows. All changes stay in this browser.</p><div className="mt-6 rounded-lg border border-line bg-paper p-4"><p className="text-xs font-semibold">Competition Demo</p><p className="mt-1 text-[11px] leading-5 text-slate-500">Follow the NusaTech CNC demand from matching through a Precision Works proposal and collaboration.</p><div className="mt-3 flex flex-wrap gap-3 text-[11px] font-semibold text-brand-600"><Link href="/dashboard/demands" onClick={closePanel}>1. Demand</Link><Link href="/match/results" onClick={closePanel}>2. Matches</Link><Link href="/requests/REQ-2026-00124" onClick={closePanel}>3. Proposal</Link><Link href="/dashboard/collaborations" onClick={closePanel}>4. Collaboration</Link></div></div><button type="button" onClick={() => setPanel("reset")} className="mt-6 min-h-10 rounded-md border border-red-200 px-4 text-xs font-semibold text-red-700 hover:bg-red-50">Reset Demo Data</button>
        </>}
      </WorkspacePanel>
      <WorkspacePanel open={panel === "reset"} title="Reset Competition Demo?" onClose={closePanel}>
        <p className="text-sm leading-7 text-slate-600">This will restore all demonstration data to its original state.</p>
        <div className="mt-6 flex justify-end gap-2"><button type="button" onClick={closePanel} className="min-h-10 rounded-md border border-line px-4 text-xs font-semibold">Cancel</button><button type="button" onClick={() => { resetDemoData(); if (presentation.active) beginCompetitionPresentation(); closePanel(); router.push("/dashboard/buyer"); showToast("Demo data reset"); }} className="min-h-10 rounded-md bg-ink px-4 text-xs font-semibold text-white">Reset Demo</button></div>
      </WorkspacePanel>
      <WorkspacePanel open={panel === "search"} title="Search workspace" onClose={closePanel}>
        <input autoFocus aria-label="Search all workspace records" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Provider, request ID, or demand…" className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100" />
        {!queryText ? <p className="py-7 text-xs text-slate-500">Search providers, your requests, and production demands.</p> : !foundProviders.length && !foundRequests.length && !foundDemands.length ? <p className="py-7 text-xs text-slate-500">No workspace records match “{query.trim()}”.</p> : <div className="mt-5 space-y-5">{foundProviders.length > 0 && <section><h3 className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">Providers</h3>{foundProviders.map((provider) => <Link key={provider.id} href={`/capacity/${provider.id}`} onClick={closePanel} className="flex items-center justify-between gap-3 rounded py-2.5 text-xs text-slate-700 hover:bg-slate-50"><span>{provider.name}<span className="mt-1 block text-[11px] text-slate-400">{provider.capability} · {provider.location}</span></span><ChevronRight className="h-3.5 w-3.5" /></Link>)}</section>}{foundRequests.length > 0 && <section><h3 className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">Requests</h3>{foundRequests.map((request) => <Link key={request.id} href={`/requests/${request.id}`} onClick={closePanel} className="block rounded py-2.5 text-xs text-slate-700 hover:bg-slate-50">{request.id} · {request.capability}</Link>)}</section>}{foundDemands.length > 0 && <section><h3 className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">Demands</h3>{foundDemands.map((demand) => <button type="button" key={demand.id} onClick={() => { viewDemandMatches(demand.id); closePanel(); router.push("/match/results"); }} className="block w-full rounded py-2.5 text-left text-xs text-slate-700 hover:bg-slate-50">{demand.name} <span className="text-slate-400">· {demand.status}</span></button>)}</section>}</div>}
      </WorkspacePanel>
    </div>
  );
}
