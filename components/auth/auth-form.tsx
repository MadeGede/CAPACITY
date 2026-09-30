"use client";

import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Building2, LockKeyhole, Mail } from "lucide-react";
import { Logo } from "@/components/site/logo";
import { useDataMode } from "@/lib/data/mode";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useStartCompetitionDemo } from "@/components/competition/start-demo";

const field = "h-11 w-full rounded-md border border-slate-200 bg-white px-3.5 text-sm text-ink outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100";

export function AuthForm({ variant }: { variant: "login" | "register" }) {
  const startDemo = useStartCompetitionDemo();
  const router = useRouter();
  const search = useSearchParams();
  const { chooseMode, configured, refreshIdentity } = useDataMode();
  const [values, setValues] = useState({ fullName: "", businessName: "", businessType: "", city: "", email: "", password: "", confirm: "" });
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const update = (name: keyof typeof values, value: string) => setValues((current) => ({ ...current, [name]: value }));
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting.current) return;
    setError(""); setSuccess("");
    if (!configured) { setError("Real accounts are not configured yet. You can continue in Demo Mode."); return; }
    if (variant === "register" && [values.fullName, values.businessName, values.businessType, values.city].some((value) => !value.trim())) { setError("Complete your name and business details."); return; }
    if (variant === "register" && values.password !== values.confirm) { setError("Passwords do not match."); return; }
    if (values.password.length < 8) { setError("Use a password with at least 8 characters."); return; }
    const client = getSupabaseBrowserClient();
    if (!client) { setError("Account service is unavailable. Please try the demo."); return; }
    submitting.current = true;
    setBusy(true);
    try {
      if (variant === "register") {
        const { data, error: authError } = await client.auth.signUp({ email: values.email.trim(), password: values.password, options: { data: { full_name: values.fullName.trim(), business_name: values.businessName.trim(), business_type: values.businessType.trim(), city: values.city.trim() }, emailRedirectTo: `${window.location.origin}/auth/confirm` } });
        if (authError) throw authError;
        if (!data.session) { setSuccess("If this address can be registered, check your email for a confirmation link, then sign in."); return; }
      } else {
        const { error: authError } = await client.auth.signInWithPassword({ email: values.email.trim(), password: values.password });
        if (authError) throw authError;
      }
      chooseMode("real");
      await refreshIdentity();
      const next = search.get("next");
      router.replace(next?.startsWith("/") && !next.startsWith("//") && !/[\\\u0000-\u001f\u007f]/.test(next) ? next : "/dashboard");
      router.refresh();
    } catch (failure) { setError(variant === "register" && failure instanceof Error && /already registered|already exists/i.test(failure.message) ? "This email already has an account. Sign in instead." : variant === "register" ? "Unable to create this account. Check your details and try again." : "Unable to sign in. Check your email and password."); }
    finally { submitting.current = false; setBusy(false); }
  };
  const demo = startDemo;
  return <main className="grid min-h-dvh bg-paper text-ink lg:grid-cols-[minmax(0,1fr)_minmax(420px,560px)]">
    <aside className="hidden min-h-dvh flex-col justify-between bg-ink px-12 py-12 text-white lg:flex"><Logo light /><div className="max-w-xl"><span className="text-[11px] font-semibold uppercase tracking-[.22em] text-blue-300">Business capacity, connected</span><h1 className="mt-6 text-5xl font-semibold leading-[1.12] tracking-tight">Turn underused production into new opportunity.</h1><p className="mt-7 max-w-md text-base leading-8 text-slate-300">One focused workspace for production demand, trusted capacity discovery, and business collaboration.</p></div><p className="text-xs text-slate-400">CAPACITY · Built for the way industry works</p></aside>
    <section className="flex min-h-dvh flex-col px-5 py-8 sm:px-10 lg:px-14"><div className="flex items-center justify-between lg:justify-end"><span className="lg:hidden"><Logo /></span><Link href="/" className="text-xs font-semibold text-slate-500 hover:text-brand-600">Back to site</Link></div><div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10"><div className="mb-8 grid h-11 w-11 place-items-center rounded-lg border border-blue-100 bg-blue-50 text-brand-600"><Building2 size={20} /></div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-brand-600">{variant === "register" ? "Create your business workspace" : "Welcome back"}</p><h2 className="mt-2 text-3xl font-semibold tracking-tight">{variant === "register" ? "Create an account" : "Sign in to CAPACITY"}</h2><p className="mt-3 text-sm leading-6 text-slate-500">{variant === "register" ? "Publish capacity and connect with businesses that need it." : "Manage demand, capacity, requests, and collaboration."}</p>
      <form onSubmit={submit} className="mt-8 space-y-4">{variant === "register" && <><label className="block text-xs font-semibold text-slate-700">Full name<input required autoComplete="name" maxLength={160} value={values.fullName} onChange={(e) => update("fullName",e.target.value)} className={`${field} mt-2`} /></label><label className="block text-xs font-semibold text-slate-700">Business name<input required autoComplete="organization" maxLength={160} value={values.businessName} onChange={(e) => update("businessName",e.target.value)} className={`${field} mt-2`} /></label><div className="grid gap-4 sm:grid-cols-2"><label className="block text-xs font-semibold text-slate-700">Business type<input required maxLength={120} placeholder="Manufacturer" value={values.businessType} onChange={(e) => update("businessType",e.target.value)} className={`${field} mt-2`} /></label><label className="block text-xs font-semibold text-slate-700">City<input required maxLength={120} placeholder="Jakarta" value={values.city} onChange={(e) => update("city",e.target.value)} className={`${field} mt-2`} /></label></div></>}
        <label className="block text-xs font-semibold text-slate-700">Email address<span className="relative mt-2 block"><Mail className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" /><input required type="email" autoComplete="email" value={values.email} onChange={(e) => update("email",e.target.value)} className={`${field} pl-10`} /></span></label><label className="block text-xs font-semibold text-slate-700">Password<span className="relative mt-2 block"><LockKeyhole className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" /><input required type="password" minLength={8} autoComplete={variant === "register" ? "new-password" : "current-password"} value={values.password} onChange={(e) => update("password",e.target.value)} className={`${field} pl-10`} /></span></label>{variant === "register" && <label className="block text-xs font-semibold text-slate-700">Confirm password<input required type="password" minLength={8} autoComplete="new-password" value={values.confirm} onChange={(e) => update("confirm",e.target.value)} className={`${field} mt-2`} /></label>}
        {(error || search.get("error") === "confirmation") && <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs leading-5 text-red-700">{error || "We could not confirm this sign-in link. Request a new link or sign in again."}</p>}{success && <p role="status" className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs leading-5 text-brand-700">{success}</p>}
        <button type="submit" disabled={busy} className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-ink px-4 text-xs font-semibold text-white transition hover:bg-brand-600 disabled:opacity-60">{busy ? "Please wait…" : variant === "register" ? "Create Account" : "Sign In"}<ArrowRight size={14} /></button>
      </form><p className="mt-5 text-center text-xs text-slate-500">{variant === "register" ? "Already have an account?" : "New to CAPACITY?"} <Link href={variant === "register" ? "/login" : "/register"} className="font-semibold text-brand-600 hover:underline">{variant === "register" ? "Sign in" : "Create account"}</Link></p><div className="mt-8 border-t border-slate-200 pt-6 text-center"><p className="text-xs text-slate-500">Exploring for a competition?</p><button type="button" onClick={demo} className="mt-3 min-h-10 w-full rounded-md border border-slate-200 bg-white px-4 text-xs font-semibold text-ink hover:border-brand-300">Start Competition Demo</button><p className="mt-2 text-[11px] text-slate-400">No account or backend connection required.</p></div></div></section>
  </main>;
}
