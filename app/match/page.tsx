import type { Metadata } from "next";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { MatchForm } from "@/components/matching/match-form";

export const metadata: Metadata = {
  title: "Find Your Production Partner | CAPACITY",
  description: "Describe your production requirements and compare business capacity by capability, quantity, location, availability, lead time, and estimated cost.",
};

export default function MatchPage() {
  return (
    <>
      <Header />
      <main id="top" className="bg-paper pb-10 pt-[72px]">
        <div className="border-b border-line bg-white">
          <div className="mx-auto max-w-7xl px-5 pb-9 pt-10 sm:px-8 sm:pb-11 sm:pt-12 lg:px-10">
            <p className="mb-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-brand-600"><span className="h-px w-5 bg-brand-500" aria-hidden="true" />Smart Matching</p>
            <h1 className="max-w-3xl text-balance text-[30px] font-bold leading-[1.15] tracking-[-0.035em] text-ink sm:text-[40px] lg:text-[44px]">Find the right production partner.</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">Tell CAPACITY what your business needs and we&apos;ll identify providers with suitable capacity, capability, location, availability, and lead time.</p>
          </div>
        </div>
        <MatchForm />
      </main>
      <Footer />
    </>
  );
}
