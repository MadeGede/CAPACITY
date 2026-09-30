import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { DirectoryNotice, DiscoveryExplorer } from "@/components/capacity/discovery-explorer";

export const metadata: Metadata = {
  title: "Discover Production Capacity | CAPACITY",
  description: "Explore CNC machining, packaging, textile manufacturing, warehousing, and more. Find production partners across Indonesia.",
};

export default function DiscoverPage() {
  return (
    <>
      <Header />
      <main id="top" className="bg-paper pt-[72px]">
        <div className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-5 pb-9 pt-10 sm:px-8 sm:pb-11 sm:pt-12 lg:px-10">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-brand-600"><span className="h-px w-5 bg-brand-500" aria-hidden="true" /> Discover Capacity</p>
              <span className="text-[10px] font-medium tracking-wide text-slate-500"><DirectoryNotice /></span>
            </div>
            <h1 className="max-w-3xl text-balance text-[30px] font-bold leading-[1.15] tracking-[-0.035em] text-ink sm:text-[40px] lg:text-[44px]">Find the production capacity your business needs.</h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base sm:leading-7">Explore available capabilities from businesses ready to take on additional production demand.</p>
          </div>
        </div>
        <Suspense fallback={<PageSkeleton label="Loading production capacities" />}>
          <DiscoveryExplorer />
        </Suspense>
        <div className="border-t border-slate-200 bg-white px-5 py-5 text-center text-[11px] leading-5 text-slate-500"><DirectoryNotice detail /></div>
      </main>
      <Footer />
    </>
  );
}
