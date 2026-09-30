"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Building2, CircleAlert, Save } from "lucide-react";
import { categories, locations, type Category, type Location } from "@/data/capacities";
import { useCapacityCatalog } from "@/lib/data/capacities";
import { useDataMode } from "@/lib/data/mode";
import { validateCapacityListing } from "@/lib/capacity-listing-rules";
import { formatCurrencyInput } from "@/lib/capacity-format";
import { showToast } from "@/lib/toast";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import type { CapacityListingDraft } from "@/types/capacity-listing";

const controlClass = "min-h-11 w-full rounded-md border border-slate-200 bg-white px-3.5 py-3 text-sm text-ink outline-none transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-50";
const unitOptions = ["units", "pcs", "packages", "kg", "tons", "parts", "prints", "pallet spaces", "production hours"];
const parseList = (text: string) => Array.from(new Set(text.split(/[,\n]/).map((value) => value.trim()).filter(Boolean)));

function EditorField({ name, label, error, hint, children }: { name: string; label: string; error?: string; hint?: string; children: ReactNode }) {
  return <div><label htmlFor={`listing-${name}`} className="mb-2 block text-xs font-semibold text-slate-700">{label}</label>{children}{hint && <p className="mt-2 text-[11px] leading-5 text-slate-500" id={`listing-${name}-hint`}>{hint}</p>}{error && <p className="mt-2 text-xs leading-5 text-red-700" id={`listing-${name}-error`}>{error}</p>}</div>;
}

function EditorSection({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return <section className="border-b border-line px-5 py-6 sm:px-7 sm:py-7"><h2 className="text-base font-semibold tracking-tight">{title}</h2><p className="mt-1.5 text-xs leading-6 text-slate-500">{description}</p><div className="mt-5 space-y-5">{children}</div></section>;
}

function emptyListing(): CapacityListingDraft {
  return { capability: "", category: "CNC & Machining", description: "", location: "Bekasi", maximumCapacity: NaN, availableCapacity: NaN, capacityUnit: "units", minimumOrder: NaN, leadTimeDays: 14, priceFrom: NaN, priceTo: NaN, materials: [], facilities: [], certifications: [], status: "active", availabilityDays: 0 };
}

export function CapacityEditor({ id }: { id?: string }) {
  const router = useRouter();
  const { ready, managedListings, createListing, updateListing } = useCapacityCatalog();
  const { mode, business } = useDataMode();
  const [draft, setDraft] = useState<CapacityListingDraft | null>(null);
  const [listText, setListText] = useState({ materials: "", facilities: "", certifications: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const initialized = useRef(false);
  const savingRef = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!ready || initialized.current) return;
    const listing = id ? managedListings.find((item) => item.id === id) : emptyListing();
    let active = true;
    queueMicrotask(() => {
      if (!active || initialized.current) return;
      initialized.current = true;
      if (listing) { setDraft(listing); setListText({ materials: listing.materials.join(", "), facilities: listing.facilities.join("\n"), certifications: listing.certifications.join(", ") }); }
    });
    return () => { active = false; };
  }, [ready, managedListings, id]);

  const change = (changes: Partial<CapacityListingDraft>) => {
    setDraft((previous) => previous ? { ...previous, ...changes } : previous);
    setErrors((previous) => Object.fromEntries(Object.entries(previous).filter(([key]) => !(key in changes))));
  };
  const fieldProps = (name: keyof CapacityListingDraft, hint = false) => ({ id: `listing-${name}`, name, "aria-invalid": Boolean(errors[name]), "aria-describedby": [hint ? `listing-${name}-hint` : "", errors[name] ? `listing-${name}-error` : ""].filter(Boolean).join(" ") || undefined, className: `${controlClass} ${errors[name] ? "!border-red-400" : ""}` });
  const numberChange = (value: string) => value === "" ? NaN : Number(value);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft || savingRef.current) return;
    setError("");
    const value: CapacityListingDraft = { ...draft, materials: parseList(listText.materials), facilities: parseList(listText.facilities), certifications: parseList(listText.certifications), status: draft.availableCapacity === 0 && draft.status !== "paused" ? "fully_booked" : draft.status };
    const nextErrors = validateCapacityListing(value);
    if (Object.keys(nextErrors).length) { setErrors(nextErrors); window.requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()); return; }
    savingRef.current = true;
    setSaving(true);
    try { const operation = id ? updateListing(id, value) : createListing(value); if (operation instanceof Promise) await operation; showToast(id ? "Capacity listing updated" : "Capacity listing published"); router.push("/dashboard/capacity"); }
    catch (cause) { savingRef.current = false; setSaving(false); setError(cause instanceof Error ? cause.message : "We couldn't save your listing. Please try again."); }
  };

  if (!ready) return <PageSkeleton label="Loading capacity details" compact />;
  if (id && !managedListings.some((listing) => listing.id === id)) return <div className="rounded-lg border border-line bg-white px-6 py-14 text-center"><h1 className="text-2xl font-semibold tracking-tight">Capacity listing not found</h1><p className="mt-3 text-sm text-slate-500">This listing is not part of your provider workspace.</p><Link href="/dashboard/capacity" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand-600"><ArrowLeft size={14} aria-hidden="true" />Back to My Capacity</Link></div>;
  if (!draft) return null;

  return (
    <div className="space-y-6">
      <div><Link href="/dashboard/capacity" className="mb-4 inline-flex min-h-9 items-center gap-2 text-xs text-slate-500 hover:text-brand-600"><ArrowLeft size={13} aria-hidden="true" />My Capacity</Link><div className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-[28px] font-semibold tracking-tight sm:text-[32px]">{id ? "Edit Capacity" : "List Your Capacity"}</h1><p className="mt-2 text-sm leading-7 text-slate-500">{id ? "Keep your production capability and available capacity up to date." : "Make your available production capacity visible to businesses that need it."}</p></div><span className="inline-flex items-center gap-2 rounded-md border border-line bg-white px-3 py-2 text-xs text-slate-600"><Building2 size={14} className="text-slate-400" aria-hidden="true" />{mode === "real" ? business?.name || "Business" : "Precision Works"}</span></div></div>
      <form ref={formRef} noValidate onSubmit={submit} aria-label={id ? "Edit capacity listing" : "New capacity listing"} className="max-w-4xl overflow-hidden rounded-lg border border-line bg-white shadow-soft">
        {(Object.keys(errors).length > 0 || error) && <div role="alert" className="mx-5 mt-5 flex gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-xs leading-6 text-red-700 sm:mx-7"><CircleAlert size={16} className="mt-1 shrink-0" aria-hidden="true" />{error || "Please check the highlighted fields before saving your capacity."}</div>}
        <EditorSection title="Production Capability" description="A clear description helps businesses understand the work you can support.">
          <div className="grid gap-5 sm:grid-cols-2"><EditorField name="capability" label="Capability Name" error={errors.capability}><input {...fieldProps("capability")} value={draft.capability} maxLength={160} placeholder="e.g. CNC Milling" onChange={(event) => change({ capability: event.target.value })} /></EditorField><EditorField name="category" label="Category" error={errors.category}><select {...fieldProps("category")} value={draft.category} onChange={(event) => change({ category: event.target.value as Category })}>{categories.map((category) => <option key={category}>{category}</option>)}</select></EditorField></div>
          <EditorField name="description" label="Description" error={errors.description}><textarea {...fieldProps("description")} rows={4} maxLength={5000} value={draft.description} placeholder="Describe your production processes, capabilities, and the types of business you support." onChange={(event) => change({ description: event.target.value })} /></EditorField>
          <EditorField name="location" label="Production Location" error={errors.location}><select {...fieldProps("location")} value={draft.location} onChange={(event) => change({ location: event.target.value as Location })}>{locations.map((location) => <option key={location}>{location}</option>)}</select></EditorField>
        </EditorSection>
        <EditorSection title="Capacity & Lead Time" description="Set your total capacity and the portion currently open for new production demand.">
          <div className="grid gap-5 sm:grid-cols-2">{([{ name: "maximumCapacity", label: draft.category === "Warehousing" ? "Total Capacity" : "Total Monthly Capacity" }, { name: "availableCapacity", label: "Currently Available Capacity" }] as const).map(({ name, label }) => <EditorField key={name} name={name} label={label} error={errors[name]}><input {...fieldProps(name)} type="number" min="0" step="any" value={Number.isFinite(draft[name]) ? draft[name] : ""} placeholder={name === "maximumCapacity" ? "e.g. 10000" : "e.g. 6500"} onChange={(event) => change({ [name]: numberChange(event.target.value) })} /></EditorField>)}</div>
          <div className="grid gap-5 sm:grid-cols-2"><EditorField name="capacityUnit" label="Capacity Unit" error={errors.capacityUnit}><select {...fieldProps("capacityUnit")} value={draft.capacityUnit} onChange={(event) => change({ capacityUnit: event.target.value })}>{Array.from(new Set([...unitOptions, draft.capacityUnit])).map((unit) => <option key={unit}>{unit}</option>)}</select></EditorField><EditorField name="minimumOrder" label="Minimum Order" error={errors.minimumOrder}><input {...fieldProps("minimumOrder")} type="number" min="0" step="any" value={Number.isFinite(draft.minimumOrder) ? draft.minimumOrder : ""} placeholder="e.g. 500" onChange={(event) => change({ minimumOrder: numberChange(event.target.value) })} /></EditorField></div>
          <EditorField name="leadTimeDays" label="Estimated Lead Time (days)" error={errors.leadTimeDays} hint="Use 0 for immediate availability, such as ready-to-use warehouse space."><input {...fieldProps("leadTimeDays", true)} type="number" min="0" step="1" value={Number.isFinite(draft.leadTimeDays) ? draft.leadTimeDays : ""} placeholder="e.g. 14" onChange={(event) => change({ leadTimeDays: numberChange(event.target.value) })} /></EditorField>
        </EditorSection>
        <EditorSection title="Estimated Pricing" description="Indicative pricing per production unit, in Indonesian Rupiah. Final terms remain subject to agreement.">
          <div className="grid gap-5 sm:grid-cols-2">{([{ name: "priceFrom", label: "Estimated Price Minimum", placeholder: "18.000" }, { name: "priceTo", label: "Estimated Price Maximum", placeholder: "25.000" }] as const).map(({ name, label, placeholder }) => <EditorField key={name} name={name} label={label} error={errors[name]}><div className="relative"><span className="pointer-events-none absolute left-3.5 top-3 text-sm text-slate-400" aria-hidden="true">Rp</span><input {...fieldProps(name)} className={`${controlClass} pl-11 ${errors[name] ? "!border-red-400" : ""}`} type="text" inputMode="numeric" maxLength={22} placeholder={placeholder} value={Number.isFinite(draft[name]) ? formatCurrencyInput(draft[name]) : ""} onChange={(event) => { const digits = event.target.value.replace(/\D/g, ""); change({ [name]: digits ? Number(digits) : NaN }); }} /></div></EditorField>)}</div>
        </EditorSection>
        <EditorSection title="Materials, Facilities & Standards" description="Use commas or a new line to separate entries.">
          <EditorField name="materials" label="Supported Materials" error={errors.materials}><textarea {...fieldProps("materials")} rows={2} value={listText.materials} placeholder="Aluminum, Steel, Stainless steel" onChange={(event) => setListText((previous) => ({ ...previous, materials: event.target.value }))} /></EditorField>
          <EditorField name="facilities" label="Machines / Facilities" error={errors.facilities}><textarea {...fieldProps("facilities")} rows={3} value={listText.facilities} placeholder={"3-axis CNC milling machine\nCNC lathe\nPrecision measuring equipment"} onChange={(event) => setListText((previous) => ({ ...previous, facilities: event.target.value }))} /></EditorField>
          <EditorField name="certifications" label="Certifications" error={errors.certifications} hint="List only credentials held by your business. Entries are self-reported and do not create a verified badge."><textarea {...fieldProps("certifications", true)} rows={2} value={listText.certifications} placeholder="e.g. ISO 9001, Quality Control Process" onChange={(event) => setListText((previous) => ({ ...previous, certifications: event.target.value }))} /></EditorField>
        </EditorSection>
        <EditorSection title="Listing Availability" description="Choose how this capacity appears to businesses exploring production partners.">
          <div className="grid gap-5 sm:grid-cols-2"><EditorField name="status" label="Availability Status" error={errors.status}><select {...fieldProps("status")} value={draft.status} onChange={(event) => change({ status: event.target.value as CapacityListingDraft["status"], ...(event.target.value === "fully_booked" ? { availableCapacity: 0 } : {}) })}><option value="active">Active</option><option value="limited">Limited</option><option value="paused">Paused</option><option value="fully_booked">Fully Booked</option></select></EditorField><EditorField name="availabilityDays" label="Next Available Start" error={errors.availabilityDays}><select {...fieldProps("availabilityDays")} value={draft.availabilityDays} onChange={(event) => change({ availabilityDays: Number(event.target.value) })}>{[0, 7, 14, 30].map((days) => <option key={days} value={days}>{days === 0 ? "Available Now" : `Within ${days} Days`}</option>)}</select></EditorField></div>
          <p className="rounded-md border border-line bg-paper/60 p-3.5 text-xs leading-6 text-slate-500">{draft.status === "paused" ? "Paused listings remain in your workspace and are excluded from available discovery and matching results." : draft.availableCapacity === 0 || draft.status === "fully_booked" ? "This listing will be marked Fully Booked. It stays in your workspace until capacity becomes available again." : "Active and limited listings are available in Discover Capacity and Smart Matching. Updates apply across your workspace."}</p>
        </EditorSection>
        <div className="sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-3 bg-white/95 px-5 py-5 backdrop-blur-sm sm:px-7"><Link href="/dashboard/capacity" className="inline-flex min-h-11 items-center gap-2 rounded-md border border-slate-200 px-4 text-xs font-semibold text-slate-600 hover:bg-paper"><ArrowLeft size={13} aria-hidden="true" />Cancel</Link><button type="submit" disabled={saving} className="inline-flex min-h-11 items-center gap-2 rounded-md bg-brand-500 px-4 py-3 text-xs font-semibold text-white hover:bg-brand-600 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:opacity-60">{id ? <Save size={14} aria-hidden="true" /> : <ArrowRight size={14} aria-hidden="true" />}{saving ? "Saving Capacity…" : id ? "Save Changes" : "Publish Capacity"}</button></div>
      </form>
    </div>
  );
}
