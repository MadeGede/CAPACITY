import Link from "next/link";
import { ArrowLeft, SearchX } from "lucide-react";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";

export default function NotFound() {
  return <><Header /><main className="grid min-h-[76vh] place-items-center bg-paper px-5 pb-20 pt-32 text-center"><div className="max-w-lg"><span className="mx-auto grid h-14 w-14 place-items-center rounded-xl border border-blue-100 bg-blue-50 text-brand-600"><SearchX size={26} /></span><p className="mt-7 text-[11px] font-bold uppercase tracking-[.18em] text-brand-600">404 · CAPACITY</p><h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">This page could not be found.</h1><p className="mt-4 text-sm leading-7 text-slate-500">The page may have moved, expired, or never existed. Continue from a valid workspace page.</p><div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row"><Link href="/dashboard" className="inline-flex min-h-11 items-center justify-center rounded-md bg-ink px-5 text-xs font-semibold text-white">Go to Dashboard</Link><Link href="/discover" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-line bg-white px-5 text-xs font-semibold text-slate-700"><ArrowLeft size={14} />Discover Capacity</Link></div></div></main><Footer /></>;
}
