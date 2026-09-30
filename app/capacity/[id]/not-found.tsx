import Link from "next/link";
import { ArrowLeft, Factory } from "lucide-react";
import { Footer } from "@/components/site/footer";
import { Header } from "@/components/site/header";

export default function CapacityNotFound() {
  return (
    <>
      <Header />
      <main id="main-content" className="flex min-h-[70vh] items-center justify-center bg-paper/50 px-5 pb-20 pt-36">
        <div className="max-w-md text-center">
          <span className="mx-auto mb-6 grid h-14 w-14 place-items-center rounded-lg border border-line bg-white text-slate-400"><Factory size={25} strokeWidth={1.5} aria-hidden="true" /></span>
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-500">Capacity profile</p>
          <h1 className="text-3xl font-semibold tracking-tight">Provider not found</h1>
          <p className="mt-4 text-sm leading-7 text-slate-500">This capacity profile is unavailable. Explore other production partners to find the capability your business needs.</p>
          <Link href="/discover" className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-md bg-brand-500 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"><ArrowLeft size={15} aria-hidden="true" />Back to discover</Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
