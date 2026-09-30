import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowDown, ArrowRight, Check, Factory, Handshake, SlidersHorizontal } from "lucide-react";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { StartCompetitionDemo } from "@/components/competition/start-demo";
import { ImpactLayers, InnovationPillars, ProductFaq, ValueForBothSides } from "@/components/explanation/product-story";
import { MatchingExample } from "@/components/explanation/matching-example";
import { SystemArchitecture } from "@/components/explanation/system-architecture";
import { getIllustrativeScenario, matchingFactors } from "@/lib/product-explanation";
import { MATCH_WEIGHTS } from "@/lib/matching";
import { formatNumber, formatPrice } from "@/lib/capacity-format";

export const metadata: Metadata = {
  title: "How CAPACITY Works — From Demand to Collaboration",
  description: "Understand CAPACITY’s two-sided business model, transparent matching criteria, production collaboration workflow, and working competition demo.",
  openGraph: { title: "How CAPACITY Works", description: "Production demand, available capacity, transparent matching, and business collaboration.", type: "website" },
};

const workflow = [
  { title: "List Capacity", actor: "Provider", copy: "Publish a production capability, available quantity, location, lead time, and estimated price." },
  { title: "Create Demand", actor: "Buyer", copy: "Describe the production process, required quantity, preferred area, deadline, and budget." },
  { title: "Smart Matching", actor: "CAPACITY", copy: "Evaluate requirement fit using six published compatibility factors and fixed weights." },
  { title: "Review Match", actor: "Buyer", copy: "Compare ranked capacity providers and inspect the reasoning and limitations behind each score." },
  { title: "Request Capacity", actor: "Buyer", copy: "Send a structured requirement to a selected provider, carrying over the matching context." },
  { title: "Negotiate", actor: "Provider + Buyer", copy: "Review requirements, discuss specifications, and propose quantity, pricing, and production dates." },
  { title: "Collaborate", actor: "Both businesses", copy: "Accept the production terms, start collaboration, and track progress through completion." },
];
const without = ["Receive production demand", "Find internal capacity insufficient", "Search contacts manually", "Contact multiple providers", "Compare information manually", "Negotiate independently"];
const withCapacity = ["Create Production Demand", "Run Smart Matching", "Compare Compatibility", "Send Capacity Request", "Receive Production Proposal", "Start Collaboration"];

function Intro({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  return <div className="mb-9 max-w-3xl"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-brand-600">{eyebrow}</p><h2 className="mt-3 text-3xl font-semibold leading-tight tracking-[-.035em] sm:text-4xl">{title}</h2>{children && <div className="mt-4 text-sm leading-7 text-slate-600">{children}</div>}</div>;
}
function Section({ id, children, shaded = false }: { id: string; children: ReactNode; shaded?: boolean }) {
  return <section id={id} className={`scroll-mt-28 border-t border-line py-16 sm:py-20 ${shaded ? "bg-paper/70" : "bg-white"}`}><div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">{children}</div></section>;
}

export default function HowItWorksPage() {
  const { proposal } = getIllustrativeScenario();
  return <>
    <Header />
    <main id="main-content" className="bg-white text-ink">
      <section className="pb-14 pt-32 sm:pb-20 sm:pt-36">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <Link href="/" className="text-xs font-medium text-slate-500 hover:text-brand-600">CAPACITY / Product explanation</Link>
          <div className="mt-8 grid items-end gap-10 lg:grid-cols-[1.3fr_.7fr]">
            <div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-brand-600">The CAPACITY mechanism</p><h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-[1.08] tracking-[-.045em] sm:text-5xl lg:text-6xl">How capacity becomes collaboration.</h1><p className="mt-6 max-w-2xl text-base leading-8 text-slate-600">Providers list unused production capacity. Buyers create Production Demand. CAPACITY evaluates compatibility, explains the fit, and carries the connection into a structured business collaboration.</p><div className="mt-7 flex flex-wrap gap-3"><StartCompetitionDemo /><a href="#workflow" className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-line px-5 text-xs font-semibold hover:bg-slate-50">Explore the mechanism<ArrowDown className="h-4 w-4" aria-hidden="true" /></a></div><p className="mt-3 text-xs text-slate-500">No login required · illustrative data · working product screens</p></div>
            <aside className="border-l-2 border-blue-200 pl-6"><p className="text-sm font-semibold">Unused Capacity + Production Demand</p><p className="mt-3 text-xs leading-7 text-slate-500">Connected through transparent Smart Matching—not a catalogue of finished products.</p><div className="mt-5 flex items-center gap-2 text-sm font-semibold text-brand-600"><Handshake className="h-4 w-4" aria-hidden="true" />Business Collaboration</div></aside>
          </div>
          <nav aria-label="Product explanation sections" className="mt-12 flex flex-wrap gap-x-6 gap-y-3 border-t border-line pt-5 text-xs font-medium text-slate-500">{[["Workflow", "workflow"], ["Both sides", "both-sides"], ["Why CAPACITY", "innovation"], ["Matching", "matching"], ["Demo scenario", "scenario"], ["Architecture", "architecture"], ["MVP & future", "roadmap"], ["FAQ", "faq"]].map(([label, id]) => <a key={id} href={`#${id}`} className="min-h-7 hover:text-brand-600">{label}</a>)}</nav>
        </div>
      </section>

      <Section id="workflow" shaded>
        <Intro eyebrow="From discovery to production" title="A connection is the beginning, not the end.">Capacity is listed by one business; demand is created by another. The workflow makes both sides’ requirements visible before they agree on production.</Intro>
        <ol aria-label="Complete CAPACITY workflow" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{workflow.map((step, index) => <li key={step.title} className="surface-premium rounded-xl p-6"><div className="flex items-center justify-between gap-3"><span className="text-xs font-bold tabular-nums text-brand-600">{String(index + 1).padStart(2, "0")}</span><span className="text-[10px] text-slate-500">{step.actor}</span></div><h3 className="mt-5 text-base font-semibold">{step.title}</h3><p className="mt-3 text-xs leading-7 text-slate-600">{step.copy}</p></li>)}</ol>
        <p className="mt-5 text-xs leading-6 text-slate-500">The demo and real workspace use the same product stages. Only their data source and identity differ.</p>
      </Section>

      <Section id="both-sides"><Intro eyebrow="Value for both sides" title="Production flexibility meets available capability." /><ValueForBothSides /></Section>

      <Section id="innovation" shaded>
        <Intro eyebrow="The product’s approach" title="What makes CAPACITY different?">A provider directory can show who exists. CAPACITY connects structured production requirements to available capacity and continues into a collaboration workflow.</Intro>
        <InnovationPillars />
        <div className="mt-9 grid gap-6 border-t border-line pt-8 md:grid-cols-2"><div><h3 className="text-xl font-semibold tracking-tight">Not a marketplace for finished products.</h3><p className="mt-3 text-sm leading-7 text-slate-600">The starting point is “What can this business produce?” and “What production capability does another business need?” Capability, quantity, availability, location, timeline, and business requirements shape the connection.</p></div><div className="rounded-lg border border-line bg-white p-6"><p className="text-xs font-semibold text-slate-500">The object being matched</p><p className="mt-3 text-base font-semibold">Production Demand <ArrowRight className="mx-2 inline h-4 w-4 text-brand-600" aria-hidden="true" /> Available Capacity</p><p className="mt-3 text-xs leading-7 text-slate-600">There is no shopping cart or fixed product checkout. Businesses review feasibility and agree on their own production terms.</p></div></div>
      </Section>

      <Section id="matching">
        <Intro eyebrow="Transparent compatibility" title="How Smart Matching works.">A recommendation should be explainable. CAPACITY publishes each factor’s weight, displays its score, and shows why the requirement does—or does not—fit.</Intro>
        <div className="mb-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{matchingFactors.map((factor) => <article key={factor.key} className="rounded-md border border-line p-5"><div className="flex items-center justify-between gap-3"><h3 className="text-sm font-semibold">{factor.label}</h3><span className="text-lg font-semibold tabular-nums text-brand-600">{MATCH_WEIGHTS[factor.key] * 100}%</span></div><p className="mt-3 text-xs leading-6 text-slate-500">{factor.description}</p></article>)}</div>
        <MatchingExample />
        <div className="mt-8 grid gap-4 sm:grid-cols-2"><div className="flex gap-3"><Check className="mt-1 h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" /><p className="text-sm leading-7 text-slate-600">The exact capability and listed lead time can fit. A regional location relationship explains proximity.</p></div><div className="flex gap-3"><SlidersHorizontal className="mt-1 h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" /><p className="text-sm leading-7 text-slate-600">Capacity and estimated-cost warnings remain visible even when the overall score is high. Businesses can inspect these before making a decision.</p></div></div>
      </Section>

      <Section id="comparison" shaded>
        <Intro eyebrow="A more structured route" title="From manual discovery to comparable requirements." />
        <div className="grid gap-5 md:grid-cols-2">{[{ title: "Without CAPACITY", steps: without, highlighted: false }, { title: "With CAPACITY", steps: withCapacity, highlighted: true }].map((column) => <article key={column.title} className={`rounded-lg border bg-white p-6 sm:p-8 ${column.highlighted ? "border-blue-200" : "border-line"}`}><h3 className={`text-lg font-semibold ${column.highlighted ? "text-brand-600" : "text-ink"}`}>{column.title}</h3><ol className="mt-5 space-y-4">{column.steps.map((step, index) => <li key={step} className="flex items-center gap-3 text-sm text-slate-600"><span className="text-[10px] font-semibold tabular-nums text-slate-400">{String(index + 1).padStart(2, "0")}</span>{step}</li>)}</ol></article>)}</div>
      </Section>

      <Section id="scenario">
        <Intro eyebrow="Illustrative Demo Scenario" title="One production gap. One business opportunity.">NusaTech Industries receives an order for 5,000 CNC-milled aluminum components. Its internal capacity is insufficient. Precision Works has available production capacity in Bekasi.</Intro>
        <div className="grid gap-4 md:grid-cols-3"><article className="rounded-lg border border-line p-6"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Buyer · NusaTech Industries</p><h3 className="mt-4 text-lg font-semibold">A structured requirement</h3><p className="mt-3 text-sm leading-7 text-slate-600">5,000 units · CNC Milling · Aluminum · Jakarta area · 21-day maximum lead time · Rp110.000.000 budget.</p></article><article className="rounded-lg border border-blue-200 bg-blue-50/30 p-6"><p className="text-[10px] font-bold uppercase tracking-wider text-brand-600">Provider · Precision Works</p><h3 className="mt-4 text-lg font-semibold">An explainable 94% match</h3><p className="mt-3 text-sm leading-7 text-slate-600">Bekasi · 6,500 units/month of listed capacity · 14-day listed lead time. Scheduling and price assumptions are visible before requesting capacity.</p></article><article className="rounded-lg border border-line p-6"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Negotiated production proposal</p><h3 className="mt-4 text-lg font-semibold">{formatPrice(proposal.total)}</h3><p className="mt-3 text-sm leading-7 text-slate-600">{formatNumber(proposal.quantity)} units × {formatPrice(proposal.unitPrice)} / unit. The provider proposes a {proposal.leadTimeDays}-day production lead time; the buyer accepts and starts collaboration.</p></article></div>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-5 rounded-lg border border-line bg-paper/60 p-5"><p className="max-w-2xl text-sm leading-7 text-slate-600">Unused capacity becomes a business opportunity through a request and agreed terms—not through an automatic reservation or a guaranteed match.</p><StartCompetitionDemo /></div>
      </Section>

      <Section id="impact" shaded><Intro eyebrow="Capacity impact" title="Value from resources already in place." /><ImpactLayers /><p className="mt-5 text-xs leading-6 text-slate-500">These are potential value pathways, not measured platform results. Environmental benefits, revenue, and utilization improvements have not been independently measured.</p><Link href="/#impact" className="mt-4 inline-flex min-h-9 items-center gap-2 text-xs font-semibold text-brand-600">View illustrative impact example<ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></Link></Section>

      <Section id="architecture"><Intro eyebrow="For technical judges" title="A working mechanism, with visible business logic.">A structured data model, shared data adapters, deterministic weighted scoring, and role-aware request transitions connect the product’s screens.</Intro><SystemArchitecture /></Section>

      <Section id="roadmap" shaded>
        <Intro eyebrow="Current MVP vs future development" title="What works now—and what comes later." />
        <div className="grid gap-5 md:grid-cols-2"><article className="rounded-lg border border-line bg-white p-6"><h3 className="flex items-center gap-2 text-base font-semibold"><Factory className="h-4 w-4 text-brand-600" aria-hidden="true" />Current MVP</h3><p className="mt-3 text-xs leading-7 text-slate-500">Working in the independent demo; shared backend persistence and authentication are available when Supabase is configured.</p><ul className="mt-5 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">{["Capacity Discovery", "Production Demand", "Smart Matching", "Capacity Request", "Negotiation", "Production Proposal", "Collaboration Management"].map((item) => <li key={item} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />{item}</li>)}</ul></article><article className="rounded-lg border border-dashed border-slate-300 bg-white p-6"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Future concepts · not implemented</p><h3 className="mt-3 text-base font-semibold">Better signals and integrations</h3><p className="mt-3 text-sm leading-7 text-slate-600">Provider verification, advanced capacity analytics, geospatial matching, ERP and logistics integrations, and historical performance signals. These would require validation, reliable data, and further development.</p></article></div>
        <div className="mt-5 rounded-lg border border-line bg-white p-6"><div className="flex flex-wrap items-center justify-between gap-3"><h3 className="text-base font-semibold">Potential Business Model</h3><span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Potential Monetization Model · not active</span></div><ul className="mt-4 grid gap-4 text-xs leading-6 text-slate-600 sm:grid-cols-2 lg:grid-cols-4">{[["Transaction Service Fee", "Potential fee for facilitated collaborations."], ["Provider Subscription", "Potential subscription for capacity providers."], ["Premium Business Tools", "Potential paid planning and analytics tools."], ["Enterprise Integration", "Potential integration services for business systems."]].map(([title, copy]) => <li key={title}><strong className="block font-semibold text-ink">{title}</strong><span className="mt-1 block">{copy}</span></li>)}</ul><p className="mt-4 text-xs leading-6 text-slate-500">No payments, subscriptions, checkout, or transaction fees are implemented in the current MVP.</p></div>
      </Section>

      <Section id="faq"><Intro eyebrow="A few useful answers" title="Understand the platform, not just the screens." /><ProductFaq /><div className="mt-10 rounded-lg border border-blue-100 bg-blue-50/50 p-6"><h3 className="text-base font-semibold">Decision support. Business-led agreement.</h3><p className="mt-3 text-sm leading-7 text-slate-600">CAPACITY supports discovery and collaboration. Compatibility scores are decision-support information—not guarantees of quality, delivery, pricing, or availability. The participating businesses confirm feasibility and agree on final production terms.</p></div><div className="mt-8 flex flex-wrap items-center gap-4"><StartCompetitionDemo /><Link href="/discover" className="inline-flex min-h-11 items-center gap-2 text-xs font-semibold text-brand-600">Discover Available Capacity<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link></div></Section>
    </main>
    <Footer />
  </>;
}
