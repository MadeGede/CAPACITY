"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { LogoMark } from "@/components/site/logo";
import { StartCompetitionDemo } from "@/components/competition/start-demo";
import { ImpactLayers, InnovationPillars, ProductFaq, ValueForBothSides } from "@/components/explanation/product-story";
import { useDemandState } from "@/lib/data/demands";
import {
  ArrowRight,
  ArrowUpRight,
  Boxes,
  Building2,
  Check,
  ChevronDown,
  CircleCheck,
  Clock3,
  Cog,
  Cpu,
  Factory,
  Gauge,
  MapPin,
  Network,
  PackageCheck,
  Search,
  Shirt,
  SlidersHorizontal,
  Warehouse,
} from "lucide-react";

const problems = [
  {
    icon: Gauge,
    title: "Idle Production Capacity",
    copy: "Machines, facilities, and workforce can remain unused during low-demand periods.",
  },
  {
    icon: Boxes,
    title: "Demand Beyond Internal Capacity",
    copy: "Growing businesses may receive orders beyond their existing production capacity.",
  },
  {
    icon: Network,
    title: "Fragmented Partner Discovery",
    copy: "Finding reliable production partners is fragmented, slow, and inefficient.",
  },
];

const process = [
  {
    number: "01",
    title: "List Capacity",
    copy: "Businesses publish their unused production capability.",
  },
  {
    number: "02",
    title: "Create Demand",
    copy: "Businesses specify the production capacity they need.",
  },
  {
    number: "03",
    title: "Smart Matching",
    copy: "CAPACITY evaluates capability, quantity, location, availability, lead time, and cost.",
  },
  {
    number: "04",
    title: "Request Capacity",
    copy: "Send a structured requirement to a provider and agree the production terms.",
  },
  {
    number: "05",
    title: "Collaborate",
    copy: "Start production after agreement and track progress together.",
  },
];

const previewFactors = [
  { label: "Capability", score: 100 }, { label: "Capacity", score: 90 },
  { label: "Location", score: 80 }, { label: "Availability", score: 100 },
  { label: "Lead time", score: 100 }, { label: "Cost", score: 85 },
];

const categories = [
  { icon: Cog, name: "CNC & Machining", count: "Explore capacity", tone: "blue", href: "/discover?category=CNC%20%26%20Machining" },
  { icon: Factory, name: "Plastic Manufacturing", count: "Explore capacity", tone: "slate", href: "/discover?category=Plastic%20Manufacturing" },
  { icon: Shirt, name: "Textile Production", count: "Explore capacity", tone: "amber", href: "/discover?category=Textile" },
  { icon: Warehouse, name: "Warehousing", count: "Explore capacity", tone: "cyan", href: "/discover?category=Warehousing" },
  { icon: Cpu, name: "Assembly", count: "Explore capacity", tone: "indigo", href: "/discover?category=Assembly" },
  { icon: PackageCheck, name: "Packaging", count: "Explore capacity", tone: "emerald", href: "/discover?category=Packaging" },
];

const locations = ["Jakarta", "Bekasi", "Tangerang", "Bandung", "Surabaya", "Semarang", "Yogyakarta"];

const MotionLink = motion.create(Link);

const reveal = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0 },
};

function Button({
  children,
  href = "/discover",
  variant = "primary",
  className = "",
}: {
  children: React.ReactNode;
  href?: string;
  variant?: "primary" | "secondary" | "light";
  className?: string;
}) {
  const { newDemand } = useDemandState();
  const styles = {
    primary: "brand-button",
    secondary: "border border-slate-300 bg-white text-ink hover:border-slate-400 hover:bg-slate-50",
    light: "bg-white text-ink hover:bg-blue-50 shadow-[0_10px_30px_-12px_rgba(0,0,0,.22)]",
  };

  return (
    <Link
      href={href}
      onClick={href === "/match" ? newDemand : undefined}
      className={`group inline-flex h-12 items-center justify-center gap-2 rounded-lg px-5 text-sm font-semibold transition-all duration-200 ${styles[variant]} ${className}`}
    >
      {children}
      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

function ProductPreview() {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 24, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.75, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
      className="relative"
    >
      <div className="absolute -inset-10 -z-10 bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.10),transparent_67%)]" />
      <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-panel">
        <div className="flex h-12 items-center justify-between border-b border-slate-200 bg-slate-50/80 px-4 sm:px-5">
          <div className="flex items-center gap-3">
            <LogoMark className="h-5 w-5" />
            <span className="hidden h-4 w-px bg-slate-200 sm:block" />
            <span className="hidden text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 sm:block">
              CAPACITY / Opportunity workspace
            </span>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-semibold text-emerald-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
            Illustrative Demo Scenario
          </div>
        </div>

        <div className="px-4 pb-4 pt-5 sm:px-6 sm:pb-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <div className="mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] text-brand-600">
                <Network className="h-3 w-3" /> Recommended match
              </div>
              <h3 className="text-lg font-bold tracking-tight text-ink">Illustrative CNC demand</h3>
            </div>
            <span className="grid h-8 w-8 place-items-center rounded-md border border-slate-200 text-slate-500" aria-hidden="true">
              <SlidersHorizontal className="h-3.5 w-3.5" />
            </span>
          </div>

          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_90px_minmax(0,1fr)] md:items-stretch">
            <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
              <div className="mb-5 flex items-center justify-between">
                <span className="rounded bg-blue-50 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-brand-600">
                  Business Demand
                </span>
              </div>
              <h4 className="text-[15px] font-bold text-ink">CNC Milling</h4>
              <p className="mt-1 text-xs text-slate-500">NusaTech Industries</p>
              <div className="mt-5 grid grid-cols-2 gap-y-4">
                <DataItem label="Quantity" value="5,000 units" />
                <DataItem label="Location" value="Jakarta" icon={<MapPin className="h-3 w-3" />} />
                <DataItem label="Required" value="Within 21 days" icon={<Clock3 className="h-3 w-3" />} />
                <DataItem label="Material" value="Aluminum" />
              </div>
            </div>

            <div className="relative flex flex-col items-center justify-center gap-2 py-3 md:py-0">
              <span className="text-center text-[9px] font-extrabold uppercase tracking-[.1em] text-brand-600">Matching<br />engine</span>
              <motion.div
                initial={reduceMotion ? false : { scale: 0.88, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.4 }}
                className="relative z-10 grid h-12 w-12 place-items-center rounded-full border-4 border-white bg-brand-600 text-center text-white shadow-md"
              >
                <span className="text-[9px] font-extrabold leading-[1.05]">94%<br />MATCH</span>
              </motion.div>
              <span className="max-w-[90px] text-center text-[10px] font-medium leading-4 text-slate-500">Smart Compatibility Analysis</span>
              <ArrowRight className="h-4 w-4 rotate-90 text-brand-600 md:rotate-0" aria-hidden="true" />
            </div>

            <div className="relative rounded-xl border border-blue-200 bg-blue-50/40 p-4 sm:p-5">
              <div className="absolute right-4 top-4 grid h-6 w-6 place-items-center rounded-full bg-brand-600 text-white">
                <Check className="h-3.5 w-3.5 stroke-[3]" />
              </div>
              <div className="mb-5 flex items-center gap-2.5">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-ink text-white">
                  <Factory className="h-4 w-4" />
                </div>
                <div>
                  <span className="block text-[9px] font-bold uppercase tracking-[0.14em] text-brand-600">Capacity Provider</span>
                  <h4 className="text-[14px] font-bold text-ink">Precision Works</h4>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-y-4">
                <DataItem label="Available" value="6,500 units/month" />
                <DataItem label="Location" value="Bekasi" icon={<MapPin className="h-3 w-3" />} />
                <DataItem label="Lead time" value="14 days" icon={<Clock3 className="h-3 w-3" />} />
                <DataItem label="Compatibility" value="94% Match" />
              </div>
            </div>
          </div>

          <div className="mt-3 flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-[11px] text-slate-600">
              <CircleCheck className="h-4 w-4 text-emerald-500" />
              <span><strong className="font-semibold text-ink">Six weighted factors</strong> explain the fit</span>
            </div>
            <Link href="/how-it-works#matching" className="flex min-h-8 items-center gap-1 text-[11px] font-bold text-brand-600 hover:underline">How 94% is calculated <ArrowRight className="h-3 w-3" /></Link>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 rounded-xl border border-blue-100 bg-[#f8fbff] p-4 sm:grid-cols-3" aria-label="Illustrative compatibility factors">
            {previewFactors.map(({ label, score }) => <div key={label}>
              <div className="flex items-baseline justify-between gap-2 text-[10px]"><span className="font-semibold text-slate-600">{label}</span><span className="font-bold tabular-nums text-brand-600">{score}%</span></div>
              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-blue-100"><div className="h-full rounded-full bg-brand-500" style={{ width: `${score}%` }} /></div>
            </div>)}
          </div>
        </div>
      </div>

      <motion.div
        className="absolute -bottom-5 -left-5 hidden items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-soft sm:flex"
      >
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-50 text-emerald-600"><Check className="h-4 w-4" /></span>
        <span>
          <span className="block text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">Demo profile</span>
          <span className="block text-xs font-semibold text-ink">Provider information shown</span>
        </span>
      </motion.div>
    </motion.div>
  );
}

function DataItem({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div>
      <span className="mb-0.5 block text-[9px] font-semibold uppercase tracking-[0.11em] text-slate-400">{label}</span>
      <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-700">{icon}{value}</span>
    </div>
  );
}

function SectionIntro({ eyebrow, title, copy, align = "left", dark = false }: { eyebrow: string; title: React.ReactNode; copy?: string; align?: "left" | "center"; dark?: boolean }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      variants={reveal}
      initial={reduceMotion ? false : "hidden"}
      whileInView="visible"
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.55 }}
      className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}
    >
      <div className={`mb-4 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] ${dark ? "text-blue-300" : "text-brand-600"} ${align === "center" ? "justify-center" : ""}`}>
        <span className={`h-px w-5 ${dark ? "bg-blue-300" : "bg-brand-500"}`} /> {eyebrow}
      </div>
      <h2 className={`text-balance text-3xl font-bold tracking-[-0.035em] sm:text-4xl lg:text-[44px] lg:leading-[1.12] ${dark ? "text-white" : "text-ink"}`}>{title}</h2>
      {copy && <p className={`mt-5 text-base leading-7 ${dark ? "text-slate-300" : "text-slate-600"}`}>{copy}</p>}
    </motion.div>
  );
}

export default function Home() {
  const reduceMotion = useReducedMotion();

  return (
    <main id="top" className="overflow-hidden bg-white text-ink">
      <Header />

      <section className="relative border-b border-slate-100 bg-[#fbfcff] pb-24 pt-32 sm:pt-36 lg:pb-28 lg:pt-40">
        <div className="hero-grid absolute inset-0 opacity-80" />
        <div className="absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(ellipse_at_68%_20%,rgba(191,219,254,0.42),transparent_62%)]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 sm:px-8 lg:grid-cols-[0.88fr_1.12fr] lg:gap-12 lg:px-10">
          <motion.div
            initial={reduceMotion ? false : "hidden"}
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          >
            <motion.div variants={reveal} transition={{ duration: 0.55 }} className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/80 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-brand-700">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
              The industrial opportunity network
            </motion.div>
            <motion.h1 variants={reveal} transition={{ duration: 0.6 }} className="text-balance text-[clamp(2.7rem,5vw,4.7rem)] font-bold leading-[1.035] tracking-[-0.057em] text-ink">
              Turn Idle Capacity Into <span className="text-brand-600">Business Opportunities.</span>
            </motion.h1>
            <motion.p variants={reveal} transition={{ duration: 0.6 }} className="mt-6 max-w-xl text-[17px] leading-7 text-slate-600 sm:text-lg">
              Providers list unused production capacity. Buyers create production demand. CAPACITY compares compatibility and connects them through requests, proposals, and collaboration.
            </motion.p>
            <motion.div variants={reveal} transition={{ duration: 0.6 }} className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button href="/match">Find Capacity</Button>
              <Button href="/dashboard/capacity/new" variant="secondary">List Your Capacity</Button>
            </motion.div>
            <motion.div variants={reveal} transition={{ duration: 0.6 }} className="mt-5">
              <StartCompetitionDemo className="!h-auto !min-h-10 !bg-transparent !px-0 !text-brand-600 hover:!text-brand-700" />
              <p className="text-[11px] text-slate-500">No login required · Explore both sides of a working demo.</p>
            </motion.div>
            <motion.div variants={reveal} transition={{ duration: 0.6 }} className="mt-9 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] font-medium text-slate-500">
              <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-brand-600" /> Provider-submitted capacity</span>
              <span className="h-3 w-px bg-slate-200" />
              <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-brand-600" /> Opportunity-based matching</span>
            </motion.div>
          </motion.div>

          <ProductPreview />
        </div>
      </section>

      <section className="border-b border-slate-100 bg-slate-50/40 py-7" aria-label="Platform principles">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-12 gap-y-5 px-5 text-[10px] font-bold uppercase tracking-[0.17em] text-slate-400 sm:px-8 lg:px-10">
          <span className="text-slate-500">Built for modern industry</span>
          <span className="flex items-center gap-2"><Factory className="h-4 w-4" /> Manufacturing</span>
          <span className="flex items-center gap-2"><Warehouse className="h-4 w-4" /> Production</span>
          <span className="flex items-center gap-2"><Building2 className="h-4 w-4" /> B2B Collaboration</span>
          <span className="flex items-center gap-2"><Network className="h-4 w-4" /> Supply Networks</span>
        </div>
      </section>

      <section id="about" className="py-24 sm:py-28 lg:py-32">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
            <SectionIntro eyebrow="The opportunity gap" title={<>Unused capacity on one side.<br /><span className="text-slate-400">Unmet demand on the other.</span></>} />
            <motion.p variants={reveal} initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.55, delay: 0.1 }} className="max-w-xl text-base leading-7 text-slate-600 lg:ml-auto">
              One business has underused resources. Another has an order it cannot produce alone. Finding the right partner often relies on existing contacts, manual outreach, and disconnected information.
            </motion.p>
          </div>

          <div className="mt-14 grid gap-4 md:grid-cols-3">
            {problems.map((problem, index) => {
              const Icon = problem.icon;
              return (
                <motion.article
                  key={problem.title}
                  initial={reduceMotion ? false : { opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.25 }}
                  transition={{ duration: 0.5, delay: index * 0.08 }}
                  className="surface-premium surface-premium-interactive group min-h-[245px] rounded-xl p-7 sm:p-8"
                >
                  <p className="mb-5 text-[10px] font-bold uppercase tracking-[.18em] text-brand-600">0{index + 1} / The gap</p>
                  <div className="mb-7 grid h-11 w-11 place-items-center rounded-lg border border-blue-100 bg-blue-50 text-brand-600 transition group-hover:border-blue-200 group-hover:bg-blue-100">
                    <Icon className="h-5 w-5" strokeWidth={1.7} />
                  </div>
                  <h3 className="text-lg font-bold tracking-tight text-ink">{problem.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{problem.copy}</p>
                </motion.article>
              );
            })}
          </div>
        </div>
      </section>

      <section aria-label="The CAPACITY solution" className="border-y border-slate-200 bg-blue-50/40 py-10">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 px-5 sm:px-8 lg:flex-row lg:items-center lg:px-10">
          <div className="max-w-2xl"><p className="text-[11px] font-bold uppercase tracking-widest text-brand-600">Capacity + Demand → Collaboration</p><h2 className="mt-3 text-xl font-bold tracking-tight">A structured connection between available capacity and production demand.</h2><p className="mt-3 text-sm leading-7 text-slate-600">Discover capability, compare requirement fit, and turn a match into a capacity request, production proposal, and business collaboration.</p></div>
          <div className="shrink-0"><StartCompetitionDemo /><Link href="/how-it-works" className="mt-3 block min-h-8 text-sm font-semibold text-brand-600 hover:underline">Understand the complete workflow →</Link></div>
        </div>
      </section>

      <section id="discover" className="border-y border-slate-200 bg-paper py-24 sm:py-28 lg:py-32">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <SectionIntro eyebrow="Explore capacity" title="Find the capability your business needs." copy="Discover provider-submitted production capabilities across industries and turn a capacity gap into momentum." />
            <Link href="/discover" className="group flex shrink-0 items-center gap-2 text-sm font-bold text-brand-600">
              Browse all capabilities <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <motion.form
            action="/discover"
            method="get"
            role="search"
            aria-label="Find production capacity"
            initial={reduceMotion ? false : { opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-10 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-2.5 shadow-soft sm:flex-row"
          >
            <div className="flex min-h-12 flex-1 items-center gap-3 px-3">
              <Search className="h-5 w-5 shrink-0 text-slate-400" aria-hidden="true" />
              <input
                type="search"
                name="q"
                aria-label="Production capability"
                placeholder="What production capability are you looking for?"
                className="min-w-0 flex-1 bg-transparent py-3 text-sm text-ink placeholder:text-slate-400"
              />
            </div>
            <div className="relative flex min-h-12 items-center justify-between gap-6 border-t border-slate-100 px-3 text-sm font-medium text-slate-600 sm:border-l sm:border-t-0 sm:px-5">
              <MapPin className="pointer-events-none absolute left-3 h-4 w-4 text-slate-400 sm:left-5" aria-hidden="true" />
              <select
                name="location"
                aria-label="Provider location"
                defaultValue=""
                className="min-h-12 w-full appearance-none bg-transparent pl-6 pr-8 text-sm font-medium text-slate-600"
              >
                <option value="">All locations</option>
                {locations.map((location) => <option key={location} value={location}>{location}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 h-4 w-4 sm:right-5" aria-hidden="true" />
            </div>
            <button type="submit" className="min-h-12 rounded-lg bg-brand-600 px-6 text-sm font-bold text-white transition hover:bg-brand-700">Search Capacity</button>
          </motion.form>

          <div id="categories" className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category, index) => {
              const Icon = category.icon;
              return (
                <MotionLink
                  key={category.name}
                  href={category.href}
                  initial={reduceMotion ? false : { opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05, duration: 0.4 }}
                  className="surface-premium surface-premium-interactive group flex items-center gap-4 rounded-xl p-5"
                >
                  <span className={`category-icon category-${category.tone}`}><Icon className="h-5 w-5" strokeWidth={1.7} /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold text-ink">{category.name}</span>
                    <span className="mt-0.5 block text-xs text-slate-500">{category.count}</span>
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-slate-300 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand-600" />
                </MotionLink>
              );
            })}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-24 sm:py-28 lg:py-32">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <SectionIntro eyebrow="How it works" title="From unused resources to shared growth." copy="A clear, structured pathway makes industrial collaboration easier to discover, evaluate, and begin." align="center" />

          <div className="relative mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-5 lg:gap-5">
            <div className="absolute left-[10%] right-[10%] top-5 hidden h-px bg-blue-200 lg:block" />
            {process.map((step, index) => (
              <motion.article
                key={step.number}
                initial={reduceMotion ? false : { opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08, duration: 0.45 }}
                className="process-step relative rounded-xl border border-slate-200 bg-white p-5 pt-0 shadow-[0_14px_35px_-30px_rgba(16,29,54,.5)]"
              >
                <div className="relative z-10 -mt-5 mb-5 flex h-10 w-10 items-center justify-center rounded-full border border-blue-200 bg-white text-[11px] font-extrabold text-brand-600 shadow-[0_0_0_6px_white]">
                  {step.number}
                </div>
                <h3 className="text-lg font-bold tracking-tight text-ink">{step.title}</h3>
                <p className="mt-3 max-w-[250px] text-xs leading-6 text-slate-600">{step.copy}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section id="value" className="border-t border-slate-100 bg-paper py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10"><SectionIntro eyebrow="Two sides, shared value" title="Value for Both Sides" copy="Buyers gain production flexibility. Providers gain opportunities to put existing resources to work." /><div className="mt-10"><ValueForBothSides /></div><Link href="/how-it-works#workflow" className="mt-6 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-brand-600 hover:underline">See all seven workflow stages <ArrowRight className="h-4 w-4" /></Link></div>
      </section>

      <section id="innovation" className="relative overflow-hidden bg-[#101d36] py-20 sm:py-24">
        <div className="dark-grid pointer-events-none absolute inset-0 opacity-70" aria-hidden="true" />
        <div className="pointer-events-none absolute -right-48 -top-48 h-[450px] w-[450px] rounded-full bg-blue-600/10 blur-3xl" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl px-5 sm:px-8 lg:px-10"><SectionIntro eyebrow="Our approach" title="What Makes CAPACITY Different?" copy="Not a marketplace for finished products. CAPACITY connects what a business can produce with the capability, quantity, timeline, and location another business needs." dark /><div className="mt-10"><InnovationPillars /></div><Link href="/how-it-works#matching" className="mt-6 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-blue-200 hover:text-white hover:underline">Explore transparent compatibility scoring <ArrowRight className="h-4 w-4" /></Link></div>
      </section>

      <section id="providers" className="pb-24 sm:pb-28 lg:pb-32">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="overflow-hidden rounded-2xl bg-[#111827]">
            <div className="grid lg:grid-cols-[0.95fr_1.05fr]">
              <div className="flex flex-col justify-center p-8 sm:p-12 lg:p-16">
                <div className="mb-5 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-blue-300">
                  <span className="h-px w-5 bg-blue-400" /> For capacity providers
                </div>
                <h2 className="text-balance text-3xl font-bold tracking-[-0.035em] text-white sm:text-4xl lg:text-[44px] lg:leading-[1.12]">
                  Put your idle capacity back to work.
                </h2>
                <p className="mt-5 max-w-lg text-sm leading-7 text-slate-300 sm:text-base">
                  Publish available production capacity. Review incoming requirements, negotiate terms, and send production proposals. Once a buyer accepts, begin and track your production collaboration.
                </p>
                <ul className="mt-8 space-y-3">
                  {["Review structured production requests", "Stay in control of availability and proposal terms", "Build new B2B production relationships"].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sm font-medium text-slate-200">
                      <span className="grid h-5 w-5 place-items-center rounded-full bg-blue-500/20 text-blue-300"><Check className="h-3 w-3" strokeWidth={3} /></span>
                      {item}
                    </li>
                  ))}
                </ul>
                <Button href="/dashboard/capacity/new" variant="light" className="mt-9 w-fit">List Your Capacity</Button>
                <Link href="/how-it-works#workflow" className="mt-3 inline-flex min-h-9 w-fit items-center gap-2 text-xs font-semibold text-blue-300 hover:text-white">See the provider workflow <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></Link>
              </div>

              <div className="relative min-h-[410px] border-t border-white/10 bg-[#162034] p-7 sm:p-10 lg:border-l lg:border-t-0">
                <div className="dark-grid absolute inset-0 opacity-30" />
                <div className="relative mx-auto max-w-lg">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">Capacity overview</p>
                      <h3 className="mt-1 text-lg font-bold text-white">Operations Dashboard</h3>
                    </div>
                    <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[9px] font-bold text-emerald-300">AVAILABLE</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2.5">
                    {[{ value: "35%", label: "Declared use" }, { value: "6,500", label: "Units open" }, { value: "14d", label: "Lead time" }].map((metric) => (
                      <div key={metric.label} className="rounded-lg border border-white/10 bg-white/[0.045] p-3.5">
                        <span className="block text-lg font-bold text-white">{metric.value}</span>
                        <span className="mt-1 block text-[9px] font-semibold uppercase tracking-[0.1em] text-slate-500">{metric.label}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.045] p-5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-200">Monthly capacity</span>
                      <span className="text-[10px] text-slate-500">Illustrative view</span>
                    </div>
                    <div className="mt-6 flex h-28 items-end gap-2" aria-label="Capacity availability bar chart">
                      {[50, 64, 42, 72, 61, 84, 68, 76, 58, 80, 70, 88].map((height, index) => (
                        <div key={index} className="group relative flex-1 rounded-sm bg-blue-500/15" style={{ height: `${height}%` }}>
                          <div className="absolute inset-x-0 bottom-0 rounded-sm bg-blue-500 transition-all group-hover:bg-blue-400" style={{ height: `${Math.max(height - 23, 18)}%` }} />
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
                      <span className="text-[10px] text-slate-400">New opportunity near your facility</span>
                      <Link href="/how-it-works#scenario" className="flex min-h-8 items-center gap-1 text-[10px] font-bold text-blue-300 hover:underline">Example demand <ArrowRight className="h-3 w-3" aria-hidden="true" /></Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="impact" className="border-t border-slate-100 bg-slate-50/50 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="flex flex-wrap items-end justify-between gap-6"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-brand-600">CAPACITY Impact</p><h2 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight text-ink sm:text-4xl">More production value from resources already in place.</h2></div><span className="rounded-md border border-line bg-white px-3 py-2 text-[11px] font-semibold text-slate-500">Illustrative Demo Metrics</span></div>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-600">CAPACITY helps businesses use production resources that might otherwise remain idle, while other businesses can fulfill demand without immediately investing in new infrastructure.</p>
          <div className="mt-8"><ImpactLayers /></div>
          <div className="mt-8 grid gap-4 md:grid-cols-2"><div className="rounded-lg border border-line bg-white p-6"><h3 className="text-sm font-semibold text-slate-600">Before collaboration</h3><p className="mt-4 text-3xl font-bold tabular-nums">60% <span className="text-sm font-normal text-slate-500">utilization</span></p><div className="mt-5 h-2 rounded-full bg-slate-100"><div className="h-full w-[60%] rounded-full bg-slate-400" /></div><p className="mt-4 text-xs leading-6 text-slate-500">30,000 units of total capacity · 18,000 used · 12,000 idle</p></div><div className="rounded-lg border border-blue-200 bg-white p-6"><h3 className="text-sm font-semibold text-brand-600">After a capacity collaboration</h3><p className="mt-4 text-3xl font-bold tabular-nums text-brand-600">83% <span className="text-sm font-normal text-slate-500">illustrative utilization</span></p><div className="mt-5 h-2 rounded-full bg-slate-100"><div className="h-full w-[83%] rounded-full bg-brand-600" /></div><p className="mt-4 text-xs leading-6 text-slate-500">30,000 units of total capacity · 25,000 used · 5,000 idle</p></div></div>
          <p className="mt-4 text-[11px] leading-5 text-slate-500">A separate illustrative utilization example, not the Precision Works scenario. These numbers are not live platform results or research findings. No environmental benefit has been measured.</p>
          <Link href="/how-it-works#architecture" className="mt-6 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-brand-600 hover:underline">See how the working system is built <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </section>

      <section id="faq" className="border-t border-slate-100 py-20 sm:py-24">
        <div className="mx-auto max-w-4xl px-5 sm:px-8"><SectionIntro eyebrow="A few essentials" title="Questions, answered." /><div className="mt-10"><ProductFaq /></div><p className="mt-6 text-xs leading-6 text-slate-500">Compatibility is decision support, not a guarantee of quality, delivery, pricing, or availability. Businesses confirm final production terms together.</p></div>
      </section>

      <section id="start" className="border-t border-slate-100 bg-blue-50/50 py-20 sm:py-24">
        <div className="mx-auto max-w-4xl px-5 text-center sm:px-8">
          <span className="mx-auto mb-5 grid h-11 w-11 place-items-center rounded-xl bg-brand-600 text-white shadow-lg shadow-blue-600/20"><Network className="h-5 w-5" /></span>
          <h2 className="text-balance text-3xl font-bold tracking-[-0.04em] text-ink sm:text-5xl">Capacity should create value, not sit idle.</h2>
          <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-slate-600">Follow NusaTech’s production demand through compatibility analysis, a Precision Works proposal, and collaboration.</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button href="/match">Find Capacity</Button>
            <Button href="/dashboard/capacity/new" variant="secondary">List Your Capacity</Button>
          </div>
          <div className="mt-5"><StartCompetitionDemo className="!bg-transparent !text-brand-600" /><p className="text-[11px] text-slate-500">No login required · Illustrative Demo Scenario</p></div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
