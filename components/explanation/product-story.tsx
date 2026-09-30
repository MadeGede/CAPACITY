import { Boxes, ClipboardList, Factory, Handshake, SlidersHorizontal, TrendingUp } from "lucide-react";
import { productFaq } from "@/lib/product-explanation";

export function ValueForBothSides() {
  return <div>
    <div className="grid gap-5 md:grid-cols-2">
      <article className="rounded-lg border border-line bg-white p-6 sm:p-8"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-brand-600">For buyers</p><h3 className="mt-3 text-xl font-semibold tracking-tight">Expand what you can deliver.</h3><p className="mt-3 text-sm leading-7 text-slate-600">Access additional production capability without immediately buying machinery or expanding facilities.</p><ul className="mt-5 space-y-3 text-sm leading-6 text-slate-600">{["Discover and compare capacity providers using structured information.", "Understand compatibility with your quantity, budget, and timeline.", "Send structured requests and manage production collaborations."].map((text) => <li key={text} className="flex gap-3"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" aria-hidden="true" />{text}</li>)}</ul></article>
      <article className="rounded-lg border border-line bg-white p-6 sm:p-8"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-brand-600">For providers</p><h3 className="mt-3 text-xl font-semibold tracking-tight">Put existing resources to work.</h3><p className="mt-3 text-sm leading-7 text-slate-600">Make available machines, space, and production hours visible to businesses that need them.</p><ul className="mt-5 space-y-3 text-sm leading-6 text-slate-600">{["Publish available capacity and stay in control of listing availability.", "Review structured requirements and negotiate production proposals.", "Create new B2B relationships and opportunities to improve utilization."].map((text) => <li key={text} className="flex gap-3"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" aria-hidden="true" />{text}</li>)}</ul></article>
    </div>
    <p className="mt-5 border-l-2 border-blue-200 pl-4 text-sm leading-7 text-slate-600"><strong className="font-semibold text-ink">One business, both roles.</strong> A manufacturer may need CNC support while having unused assembly hours. Buyer and Provider describe the role in a collaboration—not permanently separate types of business.</p>
  </div>;
}

export function InnovationPillars() {
  const pillars = [
    { icon: Factory, title: "Capacity Discovery", copy: "Discover what a business can produce, not a catalogue of finished products." },
    { icon: ClipboardList, title: "Structured Demand", copy: "Represent production needs as comparable quantities, locations, timelines, and requirements." },
    { icon: SlidersHorizontal, title: "Transparent Matching", copy: "See compatibility factors, their weights, and the reasoning behind each recommendation." },
    { icon: Handshake, title: "Collaboration Workflow", copy: "Continue from a match into a request, negotiation, proposal, and active collaboration." },
  ];
  return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{pillars.map(({ icon: Icon, title, copy }) => <article key={title} className="rounded-xl border border-blue-100 bg-white p-6 shadow-[0_20px_40px_-32px_rgba(2,10,28,.55)] transition-transform duration-200 hover:-translate-y-1"><span className="grid h-10 w-10 place-items-center rounded-lg bg-blue-50"><Icon className="h-5 w-5 text-brand-600" aria-hidden="true" /></span><h3 className="mt-5 text-base font-semibold">{title}</h3><p className="mt-3 text-sm leading-7 text-slate-600">{copy}</p></article>)}</div>;
}

export function ImpactLayers() {
  const layers = [
    { icon: Factory, title: "Business Efficiency", copy: "Better visibility of available production resources can help businesses plan utilization and respond to demand." },
    { icon: TrendingUp, title: "Economic Opportunity", copy: "Unused production capability can become a new business opportunity when another company needs that capacity." },
    { icon: Boxes, title: "Resource Utilization", copy: "Businesses can consider existing infrastructure before immediately expanding their own physical resources." },
  ];
  return <div className="grid gap-5 md:grid-cols-3">{layers.map(({ icon: Icon, title, copy }) => <article key={title} className="rounded-lg border border-line bg-white p-6"><Icon className="h-5 w-5 text-brand-600" aria-hidden="true" /><h3 className="mt-4 text-base font-semibold">{title}</h3><p className="mt-3 text-sm leading-7 text-slate-600">{copy}</p></article>)}</div>;
}

export function ProductFaq() {
  return <div className="divide-y divide-line border-y border-line">{productFaq.map(({ question, answer }) => <details key={question} className="group py-1"><summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-5 py-4 text-sm font-semibold text-ink">{question}<span aria-hidden="true" className="shrink-0 text-lg font-normal text-slate-400 group-open:rotate-45">+</span></summary><p className="max-w-3xl pb-5 pr-6 text-sm leading-7 text-slate-600">{answer}</p></details>)}</div>;
}
